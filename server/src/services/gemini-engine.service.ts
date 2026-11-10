import { GoogleGenAI, Type } from '@google/genai';
import { z } from 'zod';
import type { BotTurn, ChatRequest, ConversationEngine, Diagnosis, SellerData } from '../types.js';
import { buildSummary } from './summary.service.js';
import { buildSystemPrompt } from './prompt.service.js';

/** Synthetic first user turn: Gemini requires the history to start with a user message. */
const CALL_CONNECTED_MARKER = '[The seller has just connected to the call.]';

const REQUEST_TIMEOUT_MS = 20_000;

/** Structured-output schema the model must follow. */
const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    reply: { type: Type.STRING },
    phase: { type: Type.STRING, enum: ['greeting', 'discovery', 'recommendation', 'summary'] },
    summary: {
      type: Type.OBJECT,
      properties: {
        keyIssues: { type: Type.ARRAY, items: { type: Type.STRING } },
        recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
        nextSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ['keyIssues', 'recommendations', 'nextSteps'],
    },
  },
  required: ['reply', 'phase'],
};

/** Validate the model output: structured output is requested but never blindly trusted. */
const botTurnSchema = z.object({
  reply: z.string().min(1),
  phase: z.enum(['greeting', 'discovery', 'recommendation', 'summary']),
  summary: z
    .object({
      keyIssues: z.array(z.string()),
      recommendations: z.array(z.string()),
      nextSteps: z.array(z.string()),
    })
    .optional(),
});

export interface GeminiEngineOptions {
  apiKey: string;
  model: string;
}

/** LLM-backed conversation engine using Google Gemini with grounded, structured output. */
export class GeminiEngine implements ConversationEngine {
  readonly name = 'gemini' as const;
  private readonly client: GoogleGenAI;

  constructor(
    private readonly options: GeminiEngineOptions,
    private readonly data: SellerData,
    private readonly diagnosis: Diagnosis,
  ) {
    this.client = new GoogleGenAI({
      apiKey: options.apiKey,
      httpOptions: { timeout: REQUEST_TIMEOUT_MS },
    });
  }

  async respond(request: ChatRequest): Promise<BotTurn> {
    const turnCount = request.messages.filter((m) => m.role === 'user').length;

    const systemInstruction = await buildSystemPrompt({
      data: this.data,
      diagnosis: this.diagnosis,
      language: request.language,
      turnCount,
    });

    const contents = [
      { role: 'user', parts: [{ text: CALL_CONNECTED_MARKER }] },
      ...request.messages.map((message) => ({
        role: message.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: message.content }],
      })),
    ];

    const response = await this.client.models.generateContent({
      model: this.options.model,
      contents,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0.6,
        maxOutputTokens: 1024,
      },
    });

    const text = response.text;
    if (!text) throw new Error('Gemini returned an empty response');

    const turn = botTurnSchema.parse(JSON.parse(text));

    // Guarantee a structured summary whenever the model declares the call finished.
    if (turn.phase === 'summary' && !turn.summary) {
      return { ...turn, summary: buildSummary(this.diagnosis, this.data) };
    }
    return turn;
  }
}
