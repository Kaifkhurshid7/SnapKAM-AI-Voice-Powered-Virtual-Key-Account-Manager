import clsx from 'clsx';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { formatChange, formatMetricValue } from '../lib/format';
import type { MetricComparison } from '../types/api';

const SENTIMENT_STYLES = {
  positive: 'bg-success-soft text-success',
  negative: 'bg-danger-soft text-danger',
  neutral: 'bg-card-muted text-muted',
} as const;

const BAR_STYLES = {
  positive: 'bg-success',
  negative: 'bg-danger',
  neutral: 'bg-muted',
} as const;

function MetricCard({ metric }: { metric: MetricComparison }) {
  const Icon =
    metric.direction === 'up' ? ArrowUpRight : metric.direction === 'down' ? ArrowDownRight : Minus;
  const max = Math.max(metric.lastMonth, metric.thisMonth, 1);

  return (
    <article className="shadow-card flex flex-col gap-3 rounded-2xl border border-line bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-medium text-muted">{metric.label}</h3>
        <span
          className={clsx(
            'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold',
            SENTIMENT_STYLES[metric.sentiment],
          )}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          {formatChange(metric)}
        </span>
      </div>

      <p className="text-2xl font-semibold tracking-tight">
        {formatMetricValue(metric.thisMonth, metric.unit)}
      </p>

      {/* Last month vs this month, scaled to the larger of the two. */}
      <div className="space-y-1.5" aria-hidden="true">
        <div className="h-1.5 overflow-hidden rounded-full bg-card-muted">
          <div
            className="h-full rounded-full bg-line"
            style={{ width: `${(metric.lastMonth / max) * 100}%` }}
          />
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-card-muted">
          <div
            className={clsx('h-full rounded-full', BAR_STYLES[metric.sentiment])}
            style={{ width: `${(metric.thisMonth / max) * 100}%` }}
          />
        </div>
      </div>

      <p className="text-xs text-muted">
        Last month: {formatMetricValue(metric.lastMonth, metric.unit)}
      </p>
    </article>
  );
}

/** Month-over-month KPI cards for the seller's account. */
export function MetricsPanel({ metrics }: { metrics: MetricComparison[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {metrics.map((metric) => (
        <MetricCard key={metric.key} metric={metric} />
      ))}
    </div>
  );
}
