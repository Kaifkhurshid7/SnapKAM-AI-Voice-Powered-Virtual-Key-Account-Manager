/** Longest text handed to the browser in one utterance. Long utterances can stall in Chrome. */
const MAX_CHUNK_LENGTH = 180;

/**
 * Clean text before speaking it: remove markdown and symbols that text-to-speech engines
 * read aloud awkwardly, and spell out the rupee sign and percent sign.
 */
export function toSpeakable(text: string): string {
  return text
    .replace(/[*_`#>~]/g, '')
    .replace(/₹\s?/g, 'rupees ')
    .replace(/%/g, ' percent')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Split text into sentence-sized chunks no longer than MAX_CHUNK_LENGTH.
 * Chunking keeps speech responsive and works around Chrome cutting off long utterances.
 */
export function splitIntoChunks(text: string): string[] {
  const sentences = text.match(/[^.!?।]+[.!?।]*/g) ?? [text];
  const chunks: string[] = [];
  let current = '';

  for (const raw of sentences) {
    const sentence = raw.trim();
    if (!sentence) continue;
    if (current && `${current} ${sentence}`.length > MAX_CHUNK_LENGTH) {
      chunks.push(current);
      current = sentence;
    } else {
      current = current ? `${current} ${sentence}` : sentence;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}
