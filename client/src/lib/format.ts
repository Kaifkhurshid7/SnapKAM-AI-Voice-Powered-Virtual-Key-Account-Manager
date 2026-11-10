import type { MetricComparison, MetricUnit } from '../types/api';

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

/** Format a metric value for display according to its unit. */
export function formatMetricValue(value: number, unit: MetricUnit): string {
  switch (unit) {
    case 'currency':
      return inr.format(value);
    case 'percent':
      return `${value}%`;
    case 'count':
      return new Intl.NumberFormat('en-IN').format(value);
  }
}

/** Short change label: "-32.5%" for most metrics, "+6 pts" for percentage metrics. */
export function formatChange(metric: MetricComparison): string {
  if (metric.direction === 'flat') return 'No change';
  const sign = metric.change > 0 ? '+' : '-';
  if (metric.unit === 'percent') return `${sign}${Math.abs(metric.change)} pts`;
  if (metric.changePercent === null) return `${sign}${Math.abs(metric.change)}`;
  return `${sign}${Math.abs(metric.changePercent)}%`;
}
