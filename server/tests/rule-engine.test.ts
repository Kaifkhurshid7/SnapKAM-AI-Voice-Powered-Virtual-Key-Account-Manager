import { beforeAll, describe, expect, it } from 'vitest';
import { diagnose } from '../src/services/diagnosis.service.js';
import { RuleBasedEngine } from '../src/services/rule-engine.service.js';
import { loadSellerData } from '../src/services/seller.service.js';
import type { ChatMessage } from '../src/types.js';

let engine: RuleBasedEngine;

beforeAll(async () => {
  const data = await loadSellerData();
  engine = new RuleBasedEngine(data, diagnose(data));
});

/** Build a transcript of alternating turns with the given seller utterances. */
function transcript(...sellerTurns: string[]): ChatMessage[] {
  const messages: ChatMessage[] = [{ role: 'assistant', content: 'greeting' }];
  for (const content of sellerTurns) {
    messages.push({ role: 'user', content }, { role: 'assistant', content: 'bot reply' });
  }
  messages.pop();
  return messages;
}

describe('RuleBasedEngine', () => {
  it('greets the seller on an empty transcript', async () => {
    const turn = await engine.respond({ messages: [], language: 'en-IN' });
    expect(turn.phase).toBe('greeting');
    expect(turn.reply).toContain('Aarav');
  });

  it('shares the headline finding and asks about stock after the concern', async () => {
    const turn = await engine.respond({
      messages: transcript('My sales have dropped a lot this month'),
      language: 'en-IN',
    });
    expect(turn.phase).toBe('discovery');
    expect(turn.reply).toMatch(/18/);
    expect(turn.reply).toMatch(/\?$/);
  });

  it('asks only one question per turn during discovery', async () => {
    const turn = await engine.respond({
      messages: transcript('sales dropped', 'yes some items finished'),
      language: 'en-IN',
    });
    expect(turn.reply.match(/\?/g)).toHaveLength(1);
  });

  it('delivers three recommendations on the fourth seller turn', async () => {
    const turn = await engine.respond({
      messages: transcript('sales dropped', 'out of stock', 'late dispatch', 'no ads'),
      language: 'en-IN',
    });
    expect(turn.phase).toBe('recommendation');
    expect(turn.reply).toMatch(/First.*Second.*Third/);
  });

  it('ends with a structured summary when the seller wraps up', async () => {
    const turn = await engine.respond({
      messages: transcript('sales dropped', 'out of stock', 'thank you, that is all'),
      language: 'en-IN',
    });
    expect(turn.phase).toBe('summary');
    expect(turn.summary?.keyIssues.length).toBeGreaterThan(0);
    expect(turn.summary?.recommendations.length).toBeGreaterThanOrEqual(2);
    expect(turn.summary?.nextSteps.length).toBeGreaterThan(0);
  });

  it('does not end the call on a wrap-up phrase before discovery has started', async () => {
    const turn = await engine.respond({
      messages: transcript('thanks'),
      language: 'en-IN',
    });
    expect(turn.phase).toBe('discovery');
  });
});
