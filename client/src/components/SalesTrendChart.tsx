import { BarChart3 } from 'lucide-react';
import type { WeeklySales } from '../types/api';

const WEEKS = ['W1', 'W2', 'W3', 'W4'];
const TICK_COUNT = 5;

/** Compact rupee label for axes and captions, e.g. 50000 -> "₹50K". */
function compactInr(value: number): string {
  if (value >= 100000) return `₹${value / 100000}L`;
  if (value >= 1000) return `₹${Math.round(value / 1000)}K`;
  return `₹${value}`;
}

/** Round the axis maximum up to a clean number so gridlines land on tidy values. */
function niceMax(value: number): number {
  const step = 10000;
  return Math.ceil(value / step) * step;
}

/** Week-by-week sales for last month vs this month, drawn with plain CSS (no chart library). */
export function SalesTrendChart({ weeklySales }: { weeklySales: WeeklySales }) {
  const { lastMonth, thisMonth } = weeklySales;
  const max = niceMax(Math.max(...lastMonth, ...thisMonth));
  const ticks = Array.from({ length: TICK_COUNT + 1 }, (_, i) => (max / TICK_COUNT) * i);

  const firstWeek = thisMonth[0] ?? 0;
  const lastWeek = thisMonth[thisMonth.length - 1] ?? 0;

  return (
    <section
      aria-labelledby="trend-title"
      className="shadow-card flex h-full flex-col rounded-3xl border border-line bg-card p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="trend-title" className="flex items-center gap-2 text-lg font-semibold">
            <BarChart3 className="h-5 w-5 text-brand" aria-hidden="true" />
            Sales trend
          </h2>
          <p className="mt-1 text-sm text-muted">
            Weekly sales fell from {compactInr(firstWeek)} to {compactInr(lastWeek)} this month.
          </p>
        </div>
        <ul className="flex items-center gap-4 text-xs text-muted" aria-label="Chart legend">
          <li className="flex items-center gap-1.5">
            <span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm bg-line" />
            Last month
          </li>
          <li className="flex items-center gap-1.5">
            <span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm bg-brand" />
            This month
          </li>
        </ul>
      </div>

      <div className="mt-6 flex flex-1 gap-3">
        <div
          aria-hidden="true"
          className="flex h-56 flex-col-reverse justify-between text-right text-xs text-muted"
        >
          {ticks.map((tick) => (
            <span key={tick} className="leading-none">
              {compactInr(tick)}
            </span>
          ))}
        </div>

        <div className="relative flex-1">
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 flex h-56 flex-col-reverse justify-between"
          >
            {ticks.map((tick) => (
              <span key={tick} className="block h-px w-full bg-line/70" />
            ))}
          </div>

          <div className="relative flex h-56 items-end justify-around gap-2" aria-hidden="true">
            {WEEKS.map((week, index) => (
              <div key={week} className="flex h-full flex-1 items-end justify-center gap-1.5">
                <div
                  className="w-full max-w-7 rounded-t-md bg-line transition-[height] duration-700"
                  style={{ height: `${((lastMonth[index] ?? 0) / max) * 100}%` }}
                />
                <div
                  className="w-full max-w-7 rounded-t-md bg-brand transition-[height] duration-700"
                  style={{ height: `${((thisMonth[index] ?? 0) / max) * 100}%` }}
                />
              </div>
            ))}
          </div>

          <div className="mt-2 flex justify-around text-xs text-muted" aria-hidden="true">
            {WEEKS.map((week) => (
              <span key={week} className="flex-1 text-center">
                {week}
              </span>
            ))}
          </div>
        </div>
      </div>

      <table className="sr-only">
        <caption>Weekly sales, last month versus this month</caption>
        <thead>
          <tr>
            <th>Week</th>
            <th>Last month</th>
            <th>This month</th>
          </tr>
        </thead>
        <tbody>
          {WEEKS.map((week, index) => (
            <tr key={week}>
              <td>{week}</td>
              <td>{lastMonth[index]}</td>
              <td>{thisMonth[index]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
