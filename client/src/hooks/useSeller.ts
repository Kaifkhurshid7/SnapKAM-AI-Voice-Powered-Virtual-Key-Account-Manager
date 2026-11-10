import { useEffect, useState } from 'react';
import { fetchSeller } from '../lib/api';
import type { SellerResponse } from '../types/api';

export interface UseSeller {
  data: SellerResponse | null;
  loading: boolean;
  error: string | null;
}

/** Load the mock seller profile and diagnosis for the dashboard. */
export function useSeller(): UseSeller {
  const [data, setData] = useState<SellerResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchSeller(controller.signal)
      .then(setData)
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Could not load seller data.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  return { data, loading, error };
}
