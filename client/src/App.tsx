import { TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { Header } from './components/Header';
import { InsightsPanel } from './components/InsightsPanel';
import { MetricsPanel } from './components/MetricsPanel';
import { SummaryCard } from './components/SummaryCard';
import { Transcript } from './components/Transcript';
import { VoiceStage } from './components/VoiceStage';
import { useCall } from './hooks/useCall';
import { useSeller } from './hooks/useSeller';
import { useTheme } from './hooks/useTheme';
import type { Language } from './types/api';

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const [language, setLanguage] = useState<Language>('en-IN');
  const seller = useSeller();
  const call = useCall(language);

  const profile = seller.data?.seller ?? null;
  const diagnosis = seller.data?.diagnosis ?? null;

  return (
    <div className="min-h-screen">
      <Header theme={theme} onToggleTheme={toggleTheme} storeName={profile?.storeName ?? null} />

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 sm:py-8">
        {!call.micSupported && (
          <div
            role="status"
            className="flex items-start gap-3 rounded-2xl border border-warning/40 bg-warning-soft px-4 py-3 text-sm text-warning"
          >
            <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <p>
              Voice input is not supported in this browser. For the full voice experience, open
              SnapKAM in Google Chrome or Microsoft Edge. You can still type your replies.
            </p>
          </div>
        )}

        <div className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <VoiceStage
            call={call}
            sellerName={profile?.name.split(' ')[0] ?? null}
            language={language}
            onLanguageChange={setLanguage}
          />
          <Transcript messages={call.messages} sellerName={profile?.name.split(' ')[0] ?? null} />
        </div>

        {call.summary && <SummaryCard summary={call.summary} />}

        <section aria-labelledby="snapshot-title" className="space-y-4">
          <div>
            <h2 id="snapshot-title" className="text-lg font-semibold">
              Account snapshot
            </h2>
            <p className="text-sm text-muted">
              Mock data for {profile?.storeName ?? 'the seller'}, comparing this month with last
              month.
            </p>
          </div>

          {seller.loading && <p className="text-sm text-muted">Loading account data...</p>}
          {seller.error && (
            <p role="alert" className="text-sm text-danger">
              {seller.error} Make sure the server is running.
            </p>
          )}
          {diagnosis && (
            <>
              <MetricsPanel metrics={diagnosis.metrics} />
              <InsightsPanel headline={diagnosis.headline} insights={diagnosis.insights} />
            </>
          )}
        </section>

        <footer className="pb-4 text-center text-xs text-muted">
          SnapKAM uses mock seller data for demonstration purposes only.
        </footer>
      </main>
    </div>
  );
}
