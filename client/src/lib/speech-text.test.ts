import { describe, expect, it } from 'vitest';
import { splitIntoChunks, toSpeakable } from './speech-text';

describe('toSpeakable', () => {
  it('spells out the rupee and percent signs', () => {
    expect(toSpeakable('Sales fell to ₹1,35,000, a 32% drop')).toBe(
      'Sales fell to rupees 1,35,000, a 32 percent drop',
    );
  });

  it('strips markdown characters', () => {
    expect(toSpeakable('**Restock** your `best` sellers')).toBe('Restock your best sellers');
  });
});

describe('splitIntoChunks', () => {
  it('keeps short text as a single chunk', () => {
    expect(splitIntoChunks('Hello there. How are you?')).toEqual(['Hello there. How are you?']);
  });

  it('splits long text on sentence boundaries without exceeding the limit', () => {
    const sentence = 'This is a reasonably long sentence used for testing chunking behaviour.';
    const chunks = splitIntoChunks(Array.from({ length: 6 }, () => sentence).join(' '));
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => chunk.length <= 180)).toBe(true);
  });

  it('returns no chunks for empty text', () => {
    expect(splitIntoChunks('   ')).toEqual([]);
  });
});
