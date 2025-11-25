import { relaunch } from '@tauri-apps/api/process';
import { checkUpdate, installUpdate } from '@tauri-apps/api/updater';
import { useState, useEffect, useCallback } from 'react';

interface UpdateInfo {
  version: string;
  body?: string;
}

interface UseUpdaterReturn {
  updateAvailable: boolean;
  updateInfo: UpdateInfo | null;
  checking: boolean;
  downloading: boolean;
  error: string | null;
  checkForUpdate: () => Promise<void>;
  downloadAndInstall: () => Promise<void>;
  dismiss: () => void;
}

export function useUpdater(): UseUpdaterReturn {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [checking, setChecking] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const checkForUpdate = useCallback(async () => {
    if (checking) return;

    setChecking(true);
    setError(null);

    try {
      const { shouldUpdate, manifest } = await checkUpdate();

      if (shouldUpdate && manifest) {
        setUpdateAvailable(true);
        setUpdateInfo({
          version: manifest.version,
          body: manifest.body,
        });
      } else {
        setUpdateAvailable(false);
        setUpdateInfo(null);
      }
    } catch (err) {
      console.error('Update check failed:', err);
      setError(err instanceof Error ? err.message : 'Update check failed');
    } finally {
      setChecking(false);
    }
  }, [checking]);

  const downloadAndInstall = useCallback(async () => {
    if (downloading) return;

    setDownloading(true);
    setError(null);

    try {
      await installUpdate();
      await relaunch();
    } catch (err) {
      console.error('Update install failed:', err);
      setError(err instanceof Error ? err.message : 'Update install failed');
      setDownloading(false);
    }
  }, [downloading]);

  const dismiss = useCallback(() => {
    setDismissed(true);
    setUpdateAvailable(false);
  }, []);

  // Check for updates on mount (after 3 second delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      void checkForUpdate();
    }, 3000);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    updateAvailable: updateAvailable && !dismissed,
    updateInfo,
    checking,
    downloading,
    error,
    checkForUpdate,
    downloadAndInstall,
    dismiss,
  };
}
