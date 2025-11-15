import { useState, useEffect, useCallback } from 'react';

import type { HistoryOverview } from '@/types/tauri-commands';

import { listHistory, openHistoryFolder, onHistoryUpdated } from '@/lib/tauri';

export interface UseHistoryReturn {
  overview: HistoryOverview | null;
  isLoading: boolean;
  error: string | null;
  loadHistory: () => Promise<void>;
  openFolder: () => Promise<void>;
}

export function useHistory(): UseHistoryReturn {
  const [overview, setOverview] = useState<HistoryOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await listHistory();
      setOverview(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      if (import.meta.env.DEV) {
        console.error('[hoego] Failed to load history:', err);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const openFolder = useCallback(async () => {
    try {
      await openHistoryFolder();
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('[hoego] Failed to open history folder:', err);
      }
    }
  }, []);

  useEffect(() => {
    void loadHistory();

    // Listen for history updates
    let unsubscribe: (() => void) | null = null;
    onHistoryUpdated((data) => {
      if (data) {
        setOverview(data);
      }
    })
      .then((unsub) => {
        unsubscribe = unsub;
      })
      .catch((err) => {
        if (import.meta.env.DEV) {
          console.error('[hoego] Failed to subscribe to history updates:', err);
        }
      });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [loadHistory]);

  return { overview, isLoading, error, loadHistory, openFolder };
}
