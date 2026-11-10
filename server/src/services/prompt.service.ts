import { readFile } from 'node:fs/promises';
import { SYSTEM_PROMPT_PATH } from '../config/paths.js';
import type { Diagnosis, Language, SellerData } from '../types.js';

/** Seller turn from which the model is told to move towards the summary. */
const WRAP_UP_FROM_TURN = 6;

const LANGUAGE_LABELS: Record<Language, string> = {
  'en-IN': 'English (Indian accent, simple spoken English)',
  'hi-IN': 'Hindi (or simple Hinglish in Latin script)',
};

let templateCache: string | undefined;

async function loadTemplate(): Promise<string> {
  templateCache ??= await readFile(SYSTEM_PROMPT_PATH, 'utf8');
  return templateCache;
}

/** Serialise the data the model is allowed to reason over, including the precomputed diagnosis. */
function buildSellerContext(data: SellerData, diagnosis: Diagnosis): string {
  return JSON.stringify(
    {
      seller: data.seller,
      currency: data.currency,
      metrics: data.metrics,
      headline: diagnosis.headline,
      insights: diagnosis.insights.map(({ id, severity, finding }) => ({ id, severity, finding })),
      recommendationPlaybook: diagnosis.recommendations,
    },
    null,
    2,
  );
}

function turnGuidance(turnCount: number): string {
  if (turnCount >= WRAP_UP_FROM_TURN) {
    return 'The call is long enough. Move to the summary phase now and say goodbye.';
  }
  return 'Aim to reach recommendations by seller turn 4 to 5 and the summary by turn 6.';
}

export interface PromptInput {
  data: SellerData;
  diagnosis: Diagnosis;
  language: Language;
  turnCount: number;
}

/** Render the system prompt template with the call's data and settings. */
export async function buildSystemPrompt(input: PromptInput): Promise<string> {
  const template = await loadTemplate();
  return template
    .replace('{{LANGUAGE}}', LANGUAGE_LABELS[input.language])
    .replace('{{TURN_COUNT}}', String(input.turnCount))
    .replace('{{TURN_GUIDANCE}}', turnGuidance(input.turnCount))
    .replace('{{SELLER_CONTEXT}}', buildSellerContext(input.data, input.diagnosis));
}
