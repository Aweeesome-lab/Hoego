import { ChevronDown, ChevronRight, Calendar, FileText } from 'lucide-react';
import React from 'react';

import type { HistoryFileInfo } from '@/types/tauri-commands';

interface HistoryListSectionProps {
  files: HistoryFileInfo[];
  isLoading: boolean;
  isDarkMode: boolean;
  onFileClick?: (file: HistoryFileInfo) => void;
}

export const HistoryListSection = React.memo(function HistoryListSection({
  files,
  isLoading,
  isDarkMode,
  onFileClick,
}: HistoryListSectionProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const recentFiles = React.useMemo(() => {
    return files.slice(0, 5); // Show only recent 5 files
  }, [files]);

  if (isLoading) {
    return (
      <div
        className={`px-6 py-4 border-t ${
          isDarkMode
            ? 'border-slate-700/50 bg-slate-900/30'
            : 'border-slate-200 bg-slate-50/50'
        }`}
      >
        <div className="text-sm text-slate-500">히스토리 로딩 중...</div>
      </div>
    );
  }

  if (files.length === 0) {
    return null;
  }

  return (
    <div
      className={`px-6 py-4 border-t ${
        isDarkMode
          ? 'border-slate-700/50 bg-slate-900/30'
          : 'border-slate-200 bg-slate-50/50'
      }`}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className={`flex items-center justify-between w-full mb-3 group ${
          isDarkMode
            ? 'text-slate-300 hover:text-slate-100'
            : 'text-slate-700 hover:text-slate-900'
        }`}
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          <Calendar className="h-4 w-4" />
          <span className="text-sm font-medium">최근 히스토리</span>
          <span
            className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}
          >
            ({files.length}개)
          </span>
        </div>
      </button>

      {/* File list */}
      {isExpanded && (
        <div className="space-y-1">
          {recentFiles.map((file) => (
            <button
              key={file.filename}
              type="button"
              onClick={() => onFileClick?.(file)}
              className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                isDarkMode
                  ? 'hover:bg-slate-800/50 text-slate-300'
                  : 'hover:bg-slate-100 text-slate-700'
              }`}
            >
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {file.title}
                  </div>
                  {file.preview && (
                    <div
                      className={`text-xs mt-0.5 truncate ${
                        isDarkMode ? 'text-slate-500' : 'text-slate-500'
                      }`}
                    >
                      {file.preview}
                    </div>
                  )}
                  <div
                    className={`text-xs mt-1 ${
                      isDarkMode ? 'text-slate-600' : 'text-slate-400'
                    }`}
                  >
                    {file.date}
                  </div>
                </div>
              </div>
            </button>
          ))}

          {files.length > 5 && (
            <div
              className={`text-xs text-center pt-2 ${
                isDarkMode ? 'text-slate-600' : 'text-slate-400'
              }`}
            >
              {files.length - 5}개 더 있음
            </div>
          )}
        </div>
      )}
    </div>
  );
});
