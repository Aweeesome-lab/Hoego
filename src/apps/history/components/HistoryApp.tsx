import { useTheme } from '@/hooks';
import { useHistory } from '@/hooks/useHistory';
import HistoryHeader from './HistoryHeader';
import HistoryPanel from './HistoryPanel';

export default function HistoryApp() {
  const { isDarkMode } = useTheme();
  const { overview, isLoading, error, loadHistory, openFolder } = useHistory();

  return (
    <div
      className={`min-h-screen ${
        isDarkMode
          ? 'bg-gradient-to-b from-gray-800 via-gray-900 to-slate-900'
          : 'bg-gradient-to-b from-gray-100 via-gray-50 to-white'
      } ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}
    >
      <div className="max-w-3xl mx-auto px-7 py-9 flex flex-col gap-6">
        <HistoryHeader
          directory={overview?.directory ?? ''}
          onRefresh={loadHistory}
          onOpenFolder={openFolder}
          isDarkMode={isDarkMode}
        />
        <HistoryPanel
          files={overview?.files ?? []}
          isLoading={isLoading}
          error={error}
          isDarkMode={isDarkMode}
        />
      </div>
    </div>
  );
}
