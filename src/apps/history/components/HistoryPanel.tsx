import type { HistoryFileInfo } from '@/types/tauri-commands';
import EmptyState from './EmptyState';
import HistoryFileList from './HistoryFileList';

interface HistoryPanelProps {
  files: HistoryFileInfo[];
  isLoading: boolean;
  error: string | null;
  isDarkMode: boolean;
}

export default function HistoryPanel({
  files,
  isLoading,
  error,
  isDarkMode,
}: HistoryPanelProps) {
  return (
    <section
      className={`rounded-3xl border p-6 backdrop-blur-3xl shadow-2xl ${
        isDarkMode
          ? 'bg-slate-900/80 border-slate-400/20'
          : 'bg-white/80 border-slate-200'
      }`}
    >
      <div className="flex items-center justify-between mb-4.5">
        <h2
          className={`text-[1.15rem] font-semibold ${
            isDarkMode ? 'text-slate-100' : 'text-slate-900'
          }`}
        >
          기록 목록
        </h2>
        {files.length > 0 && (
          <span
            className={`text-[0.85rem] ${
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            {files.length}개
          </span>
        )}
      </div>

      {isLoading ? (
        <div
          className={`text-center py-7 ${
            isDarkMode ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          로딩 중...
        </div>
      ) : error ? (
        <div
          className={`text-center py-7 ${
            isDarkMode ? 'text-red-400' : 'text-red-600'
          }`}
        >
          오류: {error}
        </div>
      ) : files.length === 0 ? (
        <EmptyState isDarkMode={isDarkMode} />
      ) : (
        <HistoryFileList files={files} isDarkMode={isDarkMode} />
      )}
    </section>
  );
}
