import type { ConversationSummary, Diagnosis, SellerData } from '../types.js';

/**
 * Build the end-of-call summary from the diagnosis.
 * Used by the rule-based engine and as a safety net when the LLM omits a structured summary.
 */
export function buildSummary(diagnosis: Diagnosis, data: SellerData): ConversationSummary {
  const { metrics } = data;

  const keyIssues = diagnosis.insights
    .filter((insight) => insight.severity !== 'low')
    .map((insight) => insight.finding.split(' This is an inference')[0] ?? insight.finding);

  const recommendations = diagnosis.recommendations.map(
    (recommendation) => `${recommendation.title}: ${recommendation.detail}`,
  );

  const nextSteps = [
    `Within 48 hours: list the ${metrics.outOfStockProducts.thisMonth} out-of-stock products by past sales and place restock orders for the top sellers.`,
    'Within 7 days: review order cancellation reasons in the seller panel and fix the top cause.',
    'In 2 weeks: review sales, cancellation rate and stock-outs again on a follow-up call.',
  ];

  return { keyIssues, recommendations, nextSteps };
}
