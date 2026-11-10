import type {
  Diagnosis,
  Insight,
  MetricComparison,
  MetricKey,
  MetricUnit,
  Recommendation,
  SellerData,
  Severity,
} from '../types.js';
import { formatInr, round } from '../utils/format.js';

interface MetricDefinition {
  key: MetricKey;
  label: string;
  unit: MetricUnit;
  /** True when an increase in this metric is good for the seller. */
  higherIsBetter: boolean;
}

const METRIC_DEFINITIONS: MetricDefinition[] = [
  { key: 'sales', label: 'Sales', unit: 'currency', higherIsBetter: true },
  { key: 'orders', label: 'Orders', unit: 'count', higherIsBetter: true },
  {
    key: 'cancellationRatePercent',
    label: 'Cancellation rate',
    unit: 'percent',
    higherIsBetter: false,
  },
  {
    key: 'averageSellingPrice',
    label: 'Average selling price',
    unit: 'currency',
    higherIsBetter: true,
  },
  {
    key: 'outOfStockProducts',
    label: 'Out-of-stock products',
    unit: 'count',
    higherIsBetter: false,
  },
];

/** Changes smaller than this (in percent) are treated as noise, e.g. for price stability. */
const FLAT_THRESHOLD_PERCENT = 2;

const SEVERITY_RANK: Record<Severity, number> = { high: 0, medium: 1, low: 2 };

function percentChange(from: number, to: number): number | null {
  return from === 0 ? null : round(((to - from) / from) * 100);
}

/** Build the month-over-month comparison for every tracked metric. */
export function compareMetrics(data: SellerData): MetricComparison[] {
  return METRIC_DEFINITIONS.map((def) => {
    const { lastMonth, thisMonth } = data.metrics[def.key];
    const change = round(thisMonth - lastMonth);
    const changePercent = percentChange(lastMonth, thisMonth);
    const isFlat =
      change === 0 || (changePercent !== null && Math.abs(changePercent) < FLAT_THRESHOLD_PERCENT);
    const direction = isFlat ? 'flat' : change > 0 ? 'up' : 'down';
    const sentiment =
      direction === 'flat'
        ? 'neutral'
        : (direction === 'up') === def.higherIsBetter
          ? 'positive'
          : 'negative';
    return {
      key: def.key,
      label: def.label,
      unit: def.unit,
      lastMonth,
      thisMonth,
      change,
      changePercent,
      direction,
      sentiment,
    };
  });
}

function buildInsights(data: SellerData): Insight[] {
  const { metrics, seller } = data;
  const insights: Insight[] = [];

  // Inventory: a surge in stock-outs removes listings from sale and hurts search ranking.
  const oos = metrics.outOfStockProducts;
  const oosDelta = oos.thisMonth - oos.lastMonth;
  const oosShare = round((oos.thisMonth / seller.activeListings) * 100, 0);
  const inventorySeverity: Severity =
    oos.thisMonth >= oos.lastMonth * 2 && oosDelta >= 5 ? 'high' : oosDelta > 0 ? 'medium' : 'low';
  insights.push({
    id: 'inventory',
    title: 'Stock-outs are removing listings from sale',
    severity: inventorySeverity,
    finding: `Out-of-stock products rose from ${oos.lastMonth} to ${oos.thisMonth} (${oosDelta >= 0 ? '+' : ''}${oosDelta}), which is about ${oosShare}% of ${seller.activeListings} active listings.`,
    evidence: [
      `${oos.thisMonth} of ${seller.activeListings} listings are currently unavailable`,
      'Unavailable listings cannot convert and tend to rank lower in marketplace search',
    ],
    followUpQuestion:
      'Do you know which of your best-selling products have gone out of stock, and why they were not restocked?',
  });

  // Cancellations: higher cancellations lose revenue directly and damage seller performance scores.
  const cancel = metrics.cancellationRatePercent;
  const cancelDelta = round(cancel.thisMonth - cancel.lastMonth);
  const extraCancelled = Math.round((metrics.orders.thisMonth * cancelDelta) / 100);
  const lostRevenue = extraCancelled * metrics.averageSellingPrice.thisMonth;
  const cancelSeverity: Severity = cancelDelta >= 5 ? 'high' : cancelDelta >= 2 ? 'medium' : 'low';
  insights.push({
    id: 'cancellations',
    title: 'Cancellations are climbing',
    severity: cancelSeverity,
    finding: `Cancellation rate rose from ${cancel.lastMonth}% to ${cancel.thisMonth}% (${cancelDelta >= 0 ? '+' : ''}${cancelDelta} points), roughly ${extraCancelled} extra cancelled orders worth about ${formatInr(lostRevenue)}.`,
    evidence: [
      `Extra cancelled orders vs last month's rate: ~${extraCancelled}`,
      `Estimated revenue lost to the increase: ~${formatInr(lostRevenue)}`,
    ],
    followUpQuestion:
      'Do you know why customers or your own team are cancelling more orders, for example because of stock mismatches or late dispatch?',
  });

  // Visibility: orders are down while price is flat, which points to fewer buyers reaching listings.
  const orderChange = percentChange(metrics.orders.lastMonth, metrics.orders.thisMonth) ?? 0;
  const priceChange =
    percentChange(metrics.averageSellingPrice.lastMonth, metrics.averageSellingPrice.thisMonth) ??
    0;
  const visibilitySeverity: Severity =
    orderChange <= -20 && Math.abs(priceChange) < FLAT_THRESHOLD_PERCENT ? 'medium' : 'low';
  insights.push({
    id: 'visibility',
    title: 'Fewer shoppers are reaching and buying your products',
    severity: visibilitySeverity,
    finding: `Orders fell ${Math.abs(orderChange)}% while price stayed flat, which points to lower visibility or availability rather than pricing. This is an inference, since impression and traffic data is not part of the dataset.`,
    evidence: [
      `Orders: ${metrics.orders.lastMonth} to ${metrics.orders.thisMonth} (${orderChange}%)`,
      'High stock-outs and cancellations can both reduce search ranking',
    ],
    followUpQuestion:
      'Have you run any promotions or ads recently, or noticed fewer views or a lower search position for your top products?',
  });

  // Pricing: flat average price means price is unlikely to be the root cause of the decline.
  const pricingChanged = Math.abs(priceChange) >= FLAT_THRESHOLD_PERCENT;
  insights.push({
    id: 'pricing',
    title: pricingChanged ? 'Average price has moved' : 'Pricing looks stable',
    severity: pricingChanged ? 'medium' : 'low',
    finding: pricingChanged
      ? `Average selling price changed ${priceChange}%, which may be affecting conversion.`
      : `Average selling price held at ${formatInr(metrics.averageSellingPrice.thisMonth)}, so price changes are unlikely to explain the drop. Competitor pricing is not covered by the data.`,
    evidence: [
      `Average selling price: ${formatInr(metrics.averageSellingPrice.lastMonth)} to ${formatInr(metrics.averageSellingPrice.thisMonth)}`,
    ],
    followUpQuestion:
      'Have competitors on similar products dropped their prices, or have you changed any of your prices or discounts?',
  });

  return insights.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
}

function buildRecommendations(data: SellerData): Recommendation[] {
  const { metrics } = data;
  const extraOos = metrics.outOfStockProducts.thisMonth - metrics.outOfStockProducts.lastMonth;
  return [
    {
      title: 'Restock your best sellers first',
      detail: `You have ${extraOos} more products out of stock than last month. Rank them by past sales, restock the top ones this week, and set a low-stock alert so you reorder before you run out. Temporarily deactivate items you cannot restock soon.`,
    },
    {
      title: 'Bring cancellations back towards 8 percent',
      detail: `Cancellations rose to ${metrics.cancellationRatePercent.thisMonth} percent. Check the cancellation reasons in your seller panel, keep stock counts accurate so you never accept orders you cannot fulfil, and dispatch within the promised handling time.`,
    },
    {
      title: 'Rebuild visibility once stock is back',
      detail:
        'After restocking, promote your top products with a deal or sponsored listing, refresh titles and images, and compare your prices with similar listings so recovering products win back search ranking.',
    },
  ];
}

/**
 * Analyse the seller's month-over-month numbers and produce the findings the bot reasons over.
 * Pure and deterministic: the same dataset always yields the same diagnosis.
 */
export function diagnose(data: SellerData): Diagnosis {
  const metrics = compareMetrics(data);
  const sales = data.metrics.sales;
  const orders = data.metrics.orders;
  const salesChange = percentChange(sales.lastMonth, sales.thisMonth) ?? 0;
  const ordersChange = percentChange(orders.lastMonth, orders.thisMonth) ?? 0;

  const headline =
    `Sales fell ${Math.abs(salesChange)}% (${formatInr(sales.lastMonth)} to ${formatInr(sales.thisMonth)}), ` +
    `driven by ${Math.abs(ordersChange)}% fewer orders at an unchanged average price.`;

  return {
    headline,
    metrics,
    insights: buildInsights(data),
    recommendations: buildRecommendations(data),
  };
}
