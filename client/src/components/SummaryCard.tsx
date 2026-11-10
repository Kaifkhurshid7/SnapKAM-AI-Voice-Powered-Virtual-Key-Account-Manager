import { CheckCheck, Copy, ListChecks, Target, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import type { ConversationSummary } from '../types/api';

function SummarySection({
  title,
  items,
  icon: Icon,
  ordered = false,
}: {
  title: string;
  items: string[];
  icon: typeof Target;
  ordered?: boolean;
}) {
  const List = ordered ? 'ol' : 'ul';
  return (
    <div className="rounded-2xl border border-line bg-card-muted p-5">
      <h3 className="flex items-center gap-2 font-semibold">
        <Icon className="h-5 w-5 text-brand" aria-hidden="true" />
        {title}
      </h3>
      <List
        className={`mt-3 space-y-2.5 pl-5 text-sm leading-relaxed ${ordered ? 'list-decimal' : 'list-disc'}`}
      >
        {items.map((item) => (
          <li key={item} className="marker:text-brand">
            {item}
          </li>
        ))}
      </List>
    </div>
  );
}

function toPlainText(summary: ConversationSummary): string {
  const section = (title: string, items: string[]) =>
    `${title}\n${items.map((item, i) => `${i + 1}. ${item}`).join('\n')}`;
  return [
    'SnapKAM call summary',
    section('Key issues', summary.keyIssues),
    section('Recommendations', summary.recommendations),
    section('Next steps', summary.nextSteps),
  ].join('\n\n');
}

/** End-of-call summary: key issues, recommendations and next steps. */
export function SummaryCard({ summary }: { summary: ConversationSummary }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(toPlainText(summary));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable (insecure context or denied): nothing to recover */
    }
  };

  return (
    <section
      aria-labelledby="summary-title"
      className="animate-fade-up shadow-card rounded-3xl border border-brand/30 bg-card p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="summary-title" className="text-lg font-semibold">
          Call summary
        </h2>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-2 rounded-full border border-line bg-card-muted px-4 py-1.5 text-sm font-medium transition hover:border-brand"
        >
          {copied ? (
            <CheckCheck className="h-4 w-4 text-success" aria-hidden="true" />
          ) : (
            <Copy className="h-4 w-4" aria-hidden="true" />
          )}
          {copied ? 'Copied' : 'Copy summary'}
        </button>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <SummarySection title="Key issues" items={summary.keyIssues} icon={TriangleAlert} />
        <SummarySection
          title="Recommendations"
          items={summary.recommendations}
          icon={Target}
          ordered
        />
        <SummarySection title="Next steps" items={summary.nextSteps} icon={ListChecks} />
      </div>
    </section>
  );
}
