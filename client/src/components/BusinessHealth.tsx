import clsx from 'clsx';
import {
  CheckCircle2,
  HeartPulse,
  OctagonAlert,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';
import type { Insight, Severity } from '../types/api';

const STATUS: Record<Severity, { label: string; badge: string; icon: LucideIcon }> = {
  high: { label: 'Critical', badge: 'bg-danger-soft text-danger', icon: OctagonAlert },
  medium: { label: 'Needs attention', badge: 'bg-warning-soft text-warning', icon: TriangleAlert },
  low: { label: 'Healthy', badge: 'bg-success-soft text-success', icon: CheckCircle2 },
};

const RANK: Record<Severity, number> = { high: 0, medium: 1, low: 2 };

/** Overall status is the worst status across all areas. */
function overallSeverity(insights: Insight[]): Severity {
  return [...insights].sort((a, b) => RANK[a.severity] - RANK[b.severity])[0]?.severity ?? 'low';
}

/** Business health: each area of the account with a status and the evidence behind it. */
export function BusinessHealth({ headline, insights }: { headline: string; insights: Insight[] }) {
  const overall = STATUS[overallSeverity(insights)];

  return (
    <section
      aria-labelledby="health-title"
      className="shadow-card flex h-full flex-col rounded-3xl border border-line bg-card p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="health-title" className="flex items-center gap-2 text-lg font-semibold">
            <HeartPulse className="h-5 w-5 text-brand" aria-hidden="true" />
            Business health
          </h2>
          <p className="mt-1 text-sm text-muted">{headline}</p>
        </div>
        <span
          className={clsx(
            'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
            overall.badge,
          )}
        >
          <overall.icon className="h-3.5 w-3.5" aria-hidden="true" />
          {overall.label}
        </span>
      </div>

      <ul className="mt-5 grid flex-1 gap-3">
        {insights.map((insight) => {
          const status = STATUS[insight.severity];
          return (
            <li key={insight.id} className="rounded-2xl border border-line bg-card-muted p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold leading-snug">{insight.title}</h3>
                <span
                  className={clsx(
                    'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
                    status.badge,
                  )}
                >
                  <status.icon className="h-3.5 w-3.5" aria-hidden="true" />
                  {status.label}
                </span>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{insight.finding}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
