import type { Env } from '../config/env.js';
import type { ChatRequest, ChatResponse, ConversationEngine, SellerData } from '../types.js';
import { logger } from '../utils/logger.js';
import { diagnose } from './diagnosis.service.js';
import { GeminiEngine } from './gemini-engine.service.js';
import { RuleBasedEngine } from './rule-engine.service.js';

/**
 * Orchestrates a bot turn: prefers the LLM engine and transparently degrades to the
 * rule-based engine if the LLM is not configured or a call fails, so a demo never dead-ends.
 */
export class ConversationService {
  private constructor(
    private readonly primary: ConversationEngine,
    private readonly fallback: ConversationEngine,
  ) {}

  static create(config: Pick<Env, 'GEMINI_API_KEY' | 'GEMINI_MODEL'>, data: SellerData) {
    const diagnosis = diagnose(data);
    const fallback = new RuleBasedEngine(data, diagnosis);
    const primary = config.GEMINI_API_KEY
      ? new GeminiEngine(
          { apiKey: config.GEMINI_API_KEY, model: config.GEMINI_MODEL },
          data,
          diagnosis,
        )
      : fallback;

    if (primary === fallback) {
      logger.warn('GEMINI_API_KEY is not set; running in offline rule-based mode');
    } else {
      logger.info('Gemini engine enabled', { model: config.GEMINI_MODEL });
    }
    return new ConversationService(primary, fallback);
  }

  async reply(request: ChatRequest): Promise<ChatResponse> {
    try {
      const turn = await this.primary.respond(request);
      return { ...turn, engine: this.primary.name };
    } catch (error) {
      if (this.primary === this.fallback) throw error;
      logger.error('Primary engine failed; using rule-based fallback', {
        error: error instanceof Error ? error.message : String(error),
      });
      const turn = await this.fallback.respond(request);
      return { ...turn, engine: this.fallback.name };
    }
  }
}
