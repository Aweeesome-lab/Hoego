import { useUpdater } from '../hooks/useUpdater';

export function UpdateDialog() {
  const {
    updateAvailable,
    updateInfo,
    downloading,
    downloadAndInstall,
    dismiss,
  } = useUpdater();

  if (!updateAvailable) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-sm mx-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          업데이트 가능
        </h3>

        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          새 버전{' '}
          <span className="font-mono font-bold">{updateInfo?.version}</span>이
          있습니다.
        </p>

        {updateInfo?.body && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 max-h-32 overflow-y-auto">
            {updateInfo.body}
          </p>
        )}

        <div className="flex gap-2 justify-end">
          <button
            onClick={dismiss}
            disabled={downloading}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            나중에
          </button>
          <button
            onClick={() => void downloadAndInstall()}
            disabled={downloading}
            className="px-4 py-2 text-sm bg-matcha text-white rounded hover:bg-matcha-dark disabled:opacity-50"
          >
            {downloading ? '다운로드 중...' : '지금 업데이트'}
          </button>
        </div>
      </div>
    </div>
  );
}
