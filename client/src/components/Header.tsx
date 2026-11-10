import { AudioLines, ChevronDown, Moon, Store, Sun } from 'lucide-react';
import type { Theme } from '../hooks/useTheme';

interface HeaderProps {
  theme: Theme;
  onToggleTheme: () => void;
  storeName: string | null;
}

export function Header({ theme, onToggleTheme, storeName }: HeaderProps) {
  const next = theme === 'dark' ? 'light' : 'dark';

  return (
    <header className="sticky top-0 z-10 border-b border-line bg-surface/80 backdrop-blur">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-brand-fg shadow-card">
            <AudioLines className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="leading-tight">
            <p className="text-lg font-bold tracking-tight">SnapKAM</p>
            <p className="hidden text-xs text-muted sm:block">
              Voice-first Virtual Key Account Manager
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Single mock account today; a native select keeps it keyboard and screen-reader friendly. */}
          {storeName && (
            <label className="relative inline-flex items-center">
              <span className="sr-only">Seller account</span>
              <Store
                className="pointer-events-none absolute left-3.5 h-4 w-4 text-brand"
                aria-hidden="true"
              />
              <select
                defaultValue={storeName}
                className="max-w-[11rem] cursor-pointer appearance-none truncate rounded-full border border-line bg-card py-2 pl-10 pr-9 text-sm font-medium outline-none transition hover:border-brand focus:border-brand sm:max-w-none"
              >
                <option value={storeName}>{storeName}</option>
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-3 h-4 w-4 text-muted"
                aria-hidden="true"
              />
            </label>
          )}
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={`Switch to ${next} theme`}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-card transition hover:border-brand"
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Moon className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
