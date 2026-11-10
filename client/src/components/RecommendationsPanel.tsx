import clsx from 'clsx';
import { Ban, PackageX, Sparkles, TrendingDown, type LucideIcon } from 'lucide-react';
import type { Recommendation, Severity } from '../types/api';

const PRIORITY: Record<Severity, { label: string; badge: string }> = {
  high: { label: 'High priority', badge: 'bg-danger-soft text-danger' },
  medium: { label: 'Medium priority', badge: 'bg-warning-soft text-warning' },
  low: { label: 'Low priority', badge: 'bg-card-muted text-muted' },
};

const ICONS: Record<Recommendation['id'], LucideIcon> = {
  inventory: PackageX,
  cancellations: Ban,
  orders: TrendingDown,
};

function Field({ label, children }: { label: string; children: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</dt>
      <dd className="mt-1 text-sm leading-relaxed">{children}</dd>
    </div>
  );
}

/** Prioritised recommendations, each with the problem, its business impact and the action. */
export function RecommendationsPanel({ recommendations }: { recommendations: Recommendation[] }) {
  return (
    <section
      aria-labelledby="recs-title"
      className="shadow-card h-full rounded-3xl border border-line bg-card p-5 sm:p-6"
    >
      <h2 id="recs-title" className="flex items-center gap-2 text-lg font-semibold">
        <Sparkles className="h-5 w-5 text-brand" aria-hidden="true" />
        AI recommendations
      </h2>
      <p className="mt-1 text-sm text-muted">
        Actionable steps to improve your sales, ranked by priority.
      </p>

      <ol className="mt-5 space-y-4">
        {recommendations.map((rec) => {
          const Icon = ICONS[rec.id];
          const priority = PRIORITY[rec.priority];
          return (
            <li key={rec.id} className="rounded-2xl border border-line bg-card-muted p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="flex items-center gap-3 font-semibold">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  {rec.title}
                </h3>
                <span
                  className={clsx(
                    'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold',
                    priority.badge,
                  )}
                >
                  {priority.label}
                </span>
              </div>

              <dl className="mt-4 grid gap-4 md:grid-cols-3">
                <Field label="Problem">{rec.problem}</Field>
                <Field label="Business impact">{rec.impact}</Field>
                <Field label="Recommended action">{rec.action}</Field>
              </dl>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
