import { describe, expect, it } from 'vitest';
import { formatDuration } from './useElapsed';

describe('formatDuration', () => {
  it('formats seconds as mm:ss', () => {
    expect(formatDuration(0)).toBe('00:00');
    expect(formatDuration(24)).toBe('00:24');
    expect(formatDuration(125)).toBe('02:05');
  });
});
