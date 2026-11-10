import type { ConversationSummary, Diagnosis, SellerData } from '../types.js';

/** Used when the seller never stated a concern, e.g. they hung up straight after the greeting. */
const DEFAULT_CONCERN = 'Significant drop in sales this month.';

const MAX_CONCERN_LENGTH = 200;

/** Trim the seller's own words into a short, single-line concern. */
function toConcern(text: string | undefined): string {
  const cleaned = text?.replace(/\s+/g, ' ').trim();
  if (!cleaned) return DEFAULT_CONCERN;
  return cleaned.length > MAX_CONCERN_LENGTH ? `${cleaned.slice(0, MAX_CONCERN_LENGTH - 1)}…` : cleaned;
}

/**
 * Build the end-of-call summary from the diagnosis.
 * Used by the rule-based engine and as a safety net when the LLM omits parts of the summary.
 *
 * @param sellerConcern the seller's first message in the call, if any
 */
export function buildSummary(
  diagnosis: Diagnosis,
  data: SellerData,
  sellerConcern?: string,
): ConversationSummary {
  const { metrics } = data;

  const keyIssues = diagnosis.insights
    .filter((insight) => insight.severity !== 'low')
    .map((insight) => insight.finding.split(' This is an inference')[0] ?? insight.finding);

  const recommendations = diagnosis.recommendations.map(
    (recommendation) => `${recommendation.title}: ${recommendation.action}`,
  );

  const nextSteps = [
    `Within 48 hours: list the ${metrics.outOfStockProducts.thisMonth} out-of-stock products by past sales and place restock orders for the top sellers.`,
    'Within 7 days: review order cancellation reasons in the seller panel and fix the top cause.',
    'In 2 weeks: review sales, cancellation rate and stock-outs again on a follow-up call.',
  ];

  return { primaryConcern: toConcern(sellerConcern), keyIssues, recommendations, nextSteps };
}
