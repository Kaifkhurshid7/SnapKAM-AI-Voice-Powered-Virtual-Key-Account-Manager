import clsx from 'clsx';
import {
  ArrowDownRight,
  ArrowUpRight,
  Ban,
  IndianRupee,
  Minus,
  PackageX,
  ShoppingCart,
  Tag,
  type LucideIcon,
} from 'lucide-react';
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

const METRIC_ICONS: Record<string, LucideIcon> = {
  sales: IndianRupee,
  orders: ShoppingCart,
  cancellationRatePercent: Ban,
  averageSellingPrice: Tag,
  outOfStockProducts: PackageX,
};

function MetricCard({ metric }: { metric: MetricComparison }) {
  const TrendIcon =
    metric.direction === 'up' ? ArrowUpRight : metric.direction === 'down' ? ArrowDownRight : Minus;
  const MetricIcon = METRIC_ICONS[metric.key] ?? Tag;
  const max = Math.max(metric.lastMonth, metric.thisMonth, 1);

  return (
    <article className="shadow-card flex flex-col gap-3 rounded-[20px] border border-line bg-card p-4 transition hover:-translate-y-0.5 hover:border-brand/50">
      <div className="flex items-center gap-2 text-muted">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-card-muted text-brand">
          <MetricIcon className="h-4 w-4" aria-hidden="true" />
        </span>
        <h3 className="text-sm font-medium">{metric.label}</h3>
      </div>

      <p className="text-2xl font-semibold tracking-tight">
        {formatMetricValue(metric.thisMonth, metric.unit)}
      </p>

      <span
        className={clsx(
          'inline-flex w-fit items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold',
          SENTIMENT_STYLES[metric.sentiment],
        )}
      >
        <TrendIcon className="h-3.5 w-3.5" aria-hidden="true" />
        {formatChange(metric)}
      </span>

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
        vs {formatMetricValue(metric.lastMonth, metric.unit)} last month
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
