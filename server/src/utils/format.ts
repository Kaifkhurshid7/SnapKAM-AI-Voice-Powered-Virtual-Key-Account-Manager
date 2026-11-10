/** Format a rupee amount using the Indian digit grouping, e.g. 135000 -> "₹1,35,000". */
export function formatInr(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Speech-friendly rupee amount, e.g. 135000 -> "1,35,000 rupees".
 * The "₹" glyph is read inconsistently by text-to-speech engines, so we spell it out.
 */
export function spokenInr(amount: number): string {
  const grouped = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount);
  return `${grouped} rupees`;
}

/** Round to a fixed number of decimals, avoiding floating point noise (e.g. 32.49999). */
export function round(value: number, decimals = 1): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
