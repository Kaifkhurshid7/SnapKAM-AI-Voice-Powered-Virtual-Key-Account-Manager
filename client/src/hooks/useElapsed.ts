import { useEffect, useState } from 'react';

/** Format seconds as mm:ss. */
export function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Whole seconds elapsed between `startedAt` and `endedAt` (or now, while the call is live).
 * Returns 0 before a call starts.
 */
export function useElapsedSeconds(startedAt: number | null, endedAt: number | null): number {
  const [now, setNow] = useState(() => Date.now());
  const running = startedAt !== null && endedAt === null;

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [running]);

  if (startedAt === null) return 0;
  return Math.max(0, Math.floor(((endedAt ?? now) - startedAt) / 1000));
}
