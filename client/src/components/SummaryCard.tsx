import {
  CheckCheck,
  Copy,
  Download,
  FileText,
  ListChecks,
  MessageCircleQuestion,
  Target,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';
import { forwardRef, useState } from 'react';
import type { ConversationSummary } from '../types/api';

interface SummaryCardProps {
  summary: ConversationSummary | null;
  /** True while the closing summary is being generated after a hang-up. */
  loading: boolean;
}

function SummarySection({
  title,
  items,
  icon: Icon,
  ordered = false,
}: {
  title: string;
  items: string[];
  icon: LucideIcon;
  ordered?: boolean;
}) {
  const List = ordered ? 'ol' : 'ul';
  return (
    <div className="rounded-2xl border border-line bg-card-muted p-4">
      <h3 className="flex items-center gap-2 font-semibold">
        <Icon className="h-5 w-5 text-brand" aria-hidden="true" />
        {title}
      </h3>
      <List
        className={`mt-3 space-y-2 pl-5 text-sm leading-relaxed ${ordered ? 'list-decimal' : 'list-disc'}`}
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
    `Primary concern\n${summary.primaryConcern}`,
    section('Identified issues', summary.keyIssues),
    section('Recommended actions', summary.recommendations),
    section('Suggested next steps', summary.nextSteps),
  ].join('\n\n');
}

/** Save text as a file in the browser without a server round trip. */
function downloadText(filename: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/** End-of-call summary: primary concern, identified issues, recommended actions and next steps. */
export const SummaryCard = forwardRef<HTMLElement, SummaryCardProps>(function SummaryCard(
  { summary, loading },
  ref,
) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!summary) return;
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
      ref={ref}
      aria-labelledby="summary-title"
      className="shadow-card h-full scroll-mt-24 rounded-3xl border border-line bg-card p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="summary-title" className="flex items-center gap-2 text-lg font-semibold">
            <FileText className="h-5 w-5 text-brand" aria-hidden="true" />
            Conversation summary
          </h2>
          <p className="mt-1 text-sm text-muted">Key takeaways from the call.</p>
        </div>

        {summary && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => downloadText('snapkam-call-summary.txt', toPlainText(summary))}
              className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-1.5 text-sm font-semibold text-brand-fg transition hover:brightness-110 active:scale-95"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Download
            </button>
            <button
              type="button"
              onClick={copy}
              className="inline-flex items-center gap-2 rounded-full border border-line bg-card-muted px-4 py-1.5 text-sm font-medium transition hover:border-brand active:scale-95"
            >
              {copied ? (
                <CheckCheck className="h-4 w-4 text-success" aria-hidden="true" />
              ) : (
                <Copy className="h-4 w-4" aria-hidden="true" />
              )}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        )}
      </div>

      {summary ? (
        <div className="animate-fade-up mt-5 space-y-3" aria-live="polite">
          <div className="rounded-2xl border border-brand/30 bg-brand-soft p-4">
            <h3 className="flex items-center gap-2 font-semibold">
              <MessageCircleQuestion className="h-5 w-5 text-brand" aria-hidden="true" />
              Primary concern
            </h3>
            <p className="mt-2 text-sm leading-relaxed">{summary.primaryConcern}</p>
          </div>
          <SummarySection
            title="Identified issues"
            items={summary.keyIssues}
            icon={TriangleAlert}
          />
          <SummarySection
            title="Recommended actions"
            items={summary.recommendations}
            icon={Target}
            ordered
          />
          <SummarySection
            title="Suggested next steps"
            items={summary.nextSteps}
            icon={ListChecks}
          />
        </div>
      ) : (
        <div
          className="mt-5 flex min-h-56 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line px-6 text-center"
          role="status"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-brand">
            <FileText
              className={loading ? 'h-6 w-6 animate-pulse' : 'h-6 w-6'}
              aria-hidden="true"
            />
          </span>
          <p className="font-medium">{loading ? 'Preparing your summary...' : 'No summary yet'}</p>
          <p className="text-sm text-muted">
            {loading
              ? 'Pulling together the key issues and next steps from your call.'
              : 'Your summary appears here when the call ends, with the main concern, issues, actions and next steps.'}
          </p>
        </div>
      )}
    </section>
  );
});
