import { GoogleGenAI, Type } from '@google/genai';
import { z } from 'zod';
import type { BotTurn, ChatRequest, ConversationEngine, Diagnosis, SellerData } from '../types.js';
import { buildSummary } from './summary.service.js';
import { buildSystemPrompt } from './prompt.service.js';

/** Synthetic first user turn: Gemini requires the history to start with a user message. */
const CALL_CONNECTED_MARKER = '[The seller has just connected to the call.]';

/** Sent as the last turn when the seller hangs up, forcing the closing summary. */
const CALL_ENDED_MARKER =
  '[The seller has ended the call. Reply with a brief goodbye, set phase to summary and fill the summary object.]';

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
        primaryConcern: { type: Type.STRING },
        keyIssues: { type: Type.ARRAY, items: { type: Type.STRING } },
        recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
        nextSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ['primaryConcern', 'keyIssues', 'recommendations', 'nextSteps'],
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
      primaryConcern: z.string().optional(),
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
      ...(request.endCall ? [{ role: 'user', parts: [{ text: CALL_ENDED_MARKER }] }] : []),
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

    const parsed = botTurnSchema.parse(JSON.parse(text));
    const firstSellerMessage = request.messages.find((m) => m.role === 'user')?.content;

    // A hang-up always ends in the summary phase, whatever phase the model reports.
    const phase = request.endCall ? 'summary' : parsed.phase;
    if (phase !== 'summary') return { reply: parsed.reply, phase };

    // Guarantee a complete structured summary: fill anything the model omitted from the diagnosis.
    const fallback = buildSummary(this.diagnosis, this.data, firstSellerMessage);
    const summary = parsed.summary;
    return {
      reply: parsed.reply,
      phase,
      summary: {
        primaryConcern: summary?.primaryConcern?.trim() || fallback.primaryConcern,
        keyIssues: summary?.keyIssues.length ? summary.keyIssues : fallback.keyIssues,
        recommendations: summary?.recommendations.length
          ? summary.recommendations
          : fallback.recommendations,
        nextSteps: summary?.nextSteps.length ? summary.nextSteps : fallback.nextSteps,
      },
    };
  }
}
