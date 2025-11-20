import { Calendar, ChevronDown, ChevronRight, Settings } from 'lucide-react';
import React from 'react';

import type { HistoryFileInfo } from '@/types/tauri-commands';

interface SidebarProps {
  isDarkMode: boolean;
  isOpen: boolean;
  historyFiles: HistoryFileInfo[];
  isLoadingHistory: boolean;
  onToggle: () => void;
  onHomeClick?: () => void;
  onSettingsClick?: () => void;
  onHistoryFileClick?: (file: HistoryFileInfo) => void;
}

// Helper function to format year from date string (YYYYMMDD)
function formatYear(dateStr: string): string {
  return `${dateStr.substring(0, 4)}년`;
}

// Helper function to format month from date string (YYYYMMDD)
function formatMonth(dateStr: string): string {
  try {
    const monthNum = parseInt(dateStr.substring(4, 6), 10);
    return `${monthNum}월`;
  } catch {
    return `${dateStr.substring(4, 6)}월`;
  }
}

// Helper function to get year key (YYYY)
function getYearKey(dateStr: string): string {
  return dateStr.substring(0, 4);
}

// Helper function to get month key (YYYYMM)
function getMonthKey(dateStr: string): string {
  return dateStr.substring(0, 6); // YYYYMM
}

interface YearGroup {
  [monthKey: string]: HistoryFileInfo[];
}

interface GroupedByYear {
  [yearKey: string]: YearGroup;
}

export const Sidebar = React.memo(function Sidebar({
  isDarkMode,
  isOpen,
  historyFiles,
  isLoadingHistory,
  onHomeClick,
  onSettingsClick,
  onHistoryFileClick,
}: SidebarProps) {
  const [expandedYears, setExpandedYears] = React.useState<Set<string>>(
    new Set()
  );
  const [expandedMonths, setExpandedMonths] = React.useState<Set<string>>(
    new Set()
  );

  // Group files by year and month
  const groupedFiles = React.useMemo((): GroupedByYear => {
    const grouped: GroupedByYear = {};

    historyFiles.forEach((file) => {
      const yearKey = getYearKey(file.date);
      const monthKey = getMonthKey(file.date);

      if (!grouped[yearKey]) {
        grouped[yearKey] = {};
      }
      if (!grouped[yearKey][monthKey]) {
        grouped[yearKey][monthKey] = [];
      }
      grouped[yearKey][monthKey].push(file);
    });

    // Sort years in descending order (most recent first)
    const sortedYears: GroupedByYear = {};

    Object.entries(grouped)
      .sort(([a], [b]) => b.localeCompare(a))
      .forEach(([year, yearGroup]) => {
        const sortedYearGroup: YearGroup = {};

        Object.entries(yearGroup)
          .sort(([a], [b]) => b.localeCompare(a))
          .forEach(([month, files]) => {
            sortedYearGroup[month] = [...files].sort((a, b) =>
              b.date.localeCompare(a.date)
            );
          });

        sortedYears[year] = sortedYearGroup;
      });

    return sortedYears;
  }, [historyFiles]);

  const toggleYear = (yearKey: string) => {
    setExpandedYears((prev) => {
      const next = new Set(prev);
      if (next.has(yearKey)) {
        next.delete(yearKey);
      } else {
        next.add(yearKey);
      }
      return next;
    });
  };

  const toggleMonth = (monthKey: string) => {
    setExpandedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(monthKey)) {
        next.delete(monthKey);
      } else {
        next.add(monthKey);
      }
      return next;
    });
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={`fixed left-0 top-0 h-full w-56 z-40 flex flex-col ${
        isDarkMode ? 'bg-slate-900/98' : 'bg-white/98'
      } border-r ${isDarkMode ? 'border-white/10' : 'border-slate-200/50'}`}
    >
      {/* 헤더 */}
      <div className={`flex h-14 shrink-0 items-center gap-2 px-6 border-b ${isDarkMode ? 'border-white/10' : 'border-slate-200/50'}`}>
        <div
          className={`w-6 h-6 rounded-md flex items-center justify-center ${
            isDarkMode ? 'bg-slate-800' : 'bg-slate-100'
          }`}
        >
          <span
            className={`text-xs font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}
          >
            H
          </span>
        </div>
        <span
          className={`text-xs font-medium tracking-wide ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}
        >
          Hoego
        </span>
      </div>

      {/* 메뉴 섹션 */}
      <div className="flex-1 overflow-y-auto py-2">
        {/* Today 버튼 */}
        <button
          type="button"
          onClick={onHomeClick}
          className={`w-full flex items-center gap-2 px-6 py-2 mb-1 text-left transition-all duration-150 ${
            isDarkMode
              ? 'hover:bg-slate-800/60 text-slate-300 hover:text-slate-100'
              : 'hover:bg-slate-100/80 text-slate-700 hover:text-slate-900'
          }`}
        >
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          <span className="text-xs font-medium">Today</span>
        </button>

        {/* History 섹션 헤더 */}
        <div
          className={`px-6 pt-4 pb-2 text-[10px] font-semibold uppercase tracking-wider ${
            isDarkMode ? 'text-slate-500' : 'text-slate-400'
          }`}
        >
          History
        </div>

        {/* Year and Month grouped history */}
        <div>
          {isLoadingHistory ? (
            <div
              className={`px-6 py-2 text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}
            >
              Loading...
            </div>
          ) : historyFiles.length === 0 ? (
            <div
              className={`px-6 py-2 text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}
            >
              No history yet
            </div>
          ) : (
            <div className="space-y-0.5">
              {Object.entries(groupedFiles).map(([yearKey, yearGroup]) => (
                <div key={yearKey}>
                  {/* Year header */}
                  <button
                    type="button"
                    onClick={() => toggleYear(yearKey)}
                    className={`w-full flex items-center gap-1.5 px-6 py-2 text-left transition-all duration-150 ${
                      isDarkMode
                        ? 'hover:bg-slate-800/60 text-slate-300'
                        : 'hover:bg-slate-100/80 text-slate-700'
                    }`}
                  >
                    {expandedYears.has(yearKey) ? (
                      <ChevronDown className="h-3 w-3 shrink-0" />
                    ) : (
                      <ChevronRight className="h-3 w-3 shrink-0" />
                    )}
                    <Calendar className="h-3 w-3 shrink-0" />
                    <span className="text-xs font-medium">
                      {formatYear(yearKey)}
                    </span>
                    <span
                      className={`ml-auto text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}
                    >
                      {Object.values(yearGroup).reduce(
                        (sum, files) => sum + files.length,
                        0
                      )}
                    </span>
                  </button>

                  {/* Months within year */}
                  {expandedYears.has(yearKey) && (
                    <div className="ml-4 space-y-0.5">
                      {Object.entries(yearGroup).map(([monthKey, files]) => (
                        <div key={monthKey}>
                          <button
                            type="button"
                            onClick={() => toggleMonth(monthKey)}
                            className={`w-full flex items-center gap-1.5 px-6 py-1.5 text-left transition-all duration-150 ${
                              isDarkMode
                                ? 'hover:bg-slate-800/60 text-slate-400'
                                : 'hover:bg-slate-100/80 text-slate-600'
                            }`}
                          >
                            {expandedMonths.has(monthKey) ? (
                              <ChevronDown className="h-2.5 w-2.5 shrink-0" />
                            ) : (
                              <ChevronRight className="h-2.5 w-2.5 shrink-0" />
                            )}
                            <span className="text-[11px] font-medium">
                              {formatMonth(monthKey)}
                            </span>
                            <span
                              className={`ml-auto text-[10px] ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}
                            >
                              {files.length}
                            </span>
                          </button>

                          {/* Files within month */}
                          {expandedMonths.has(monthKey) && (
                            <div className="ml-4 space-y-0.5 py-0.5">
                              {files.map((file) => (
                                <button
                                  key={file.filename}
                                  type="button"
                                  onClick={() => onHistoryFileClick?.(file)}
                                  className={`w-full text-left px-2 py-1 rounded transition-all duration-150 truncate ${
                                    isDarkMode
                                      ? 'hover:bg-slate-800/60 text-slate-500 hover:text-slate-300'
                                      : 'hover:bg-slate-100/80 text-slate-500 hover:text-slate-700'
                                  }`}
                                  title={file.title}
                                >
                                  <div className="text-[11px] truncate">
                                    {file.title}
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Settings 버튼 (하단 고정) */}
      <div className={`flex h-14 shrink-0 items-center border-t ${isDarkMode ? 'border-white/10' : 'border-slate-200/50'}`}>
        <button
          type="button"
          onClick={onSettingsClick}
          className={`w-full flex items-center gap-2 px-6 py-2 transition-all duration-150 ${
            isDarkMode
              ? 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
              : 'hover:bg-slate-100/80 text-slate-600 hover:text-slate-800'
          }`}
        >
          <Settings className="h-3.5 w-3.5 shrink-0" />
          <span className="text-xs font-medium">설정</span>
        </button>
      </div>
    </div>
  );
});
