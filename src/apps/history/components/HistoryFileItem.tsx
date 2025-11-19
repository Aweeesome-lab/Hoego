import { useState } from 'react';

import type { HistoryFileInfo } from '@/types/tauri-commands';

interface HistoryFileItemProps {
  file: HistoryFileInfo;
  isDarkMode: boolean;
}

export default function HistoryFileItem({
  file,
  isDarkMode,
}: HistoryFileItemProps) {
  const [copyButtonText, setCopyButtonText] = useState('경로 복사');

  const handleCopyPath = () => {
    void (async () => {
      if (!file.path) return;
      try {
        await navigator.clipboard.writeText(file.path);
        setCopyButtonText('복사 완료!');
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('[hoego] 클립보드 복사 실패', error);
        }
        setCopyButtonText('복사 실패');
      }
      setTimeout(() => {
        setCopyButtonText('경로 복사');
      }, 1200);
    })();
  };

  return (
    <li
      className={`flex flex-col gap-3.5 p-5 rounded-2xl border transition-all hover:translate-y-[-2px] hover:shadow-lg ${
        isDarkMode
          ? 'bg-slate-800/70 border-slate-600/30 hover:border-slate-400/40'
          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xl'
      }`}
    >
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <span
            className={`text-[0.9rem] font-semibold ${
              isDarkMode ? 'text-sky-300' : 'text-sky-600'
            }`}
          >
            {file.date}
          </span>
          <p
            className={`mt-1 text-[1.05rem] font-semibold overflow-hidden text-ellipsis whitespace-nowrap ${
              isDarkMode ? 'text-slate-100' : 'text-slate-900'
            }`}
          >
            {file.title || file.filename}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleCopyPath}
            className={`text-[0.8rem] px-3 py-1.5 rounded-lg border transition-all ${
              isDarkMode
                ? 'border-slate-400/30 bg-slate-400/15 text-slate-100 hover:bg-slate-400/25 hover:border-slate-400/45'
                : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {copyButtonText}
          </button>
        </div>
      </header>

      {file.preview && (
        <p
          className={`text-[0.9rem] leading-relaxed ${
            isDarkMode ? 'text-slate-300' : 'text-slate-600'
          }`}
        >
          {file.preview}
        </p>
      )}

      {file.path && (
        <p
          className={`text-[0.78rem] break-all ${
            isDarkMode ? 'text-slate-500' : 'text-slate-400'
          }`}
        >
          {file.path}
        </p>
      )}
    </li>
  );
}
