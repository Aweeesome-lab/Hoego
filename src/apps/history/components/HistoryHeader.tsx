import { FolderOpen, RefreshCw } from 'lucide-react';

import { HistoryFilter } from './HistoryFilter';

import { Button } from '@/components/ui/button';

interface HistoryHeaderProps {
  directory: string;
  onRefresh: () => void;
  onOpenFolder: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  isDarkMode: boolean;
}

export default function HistoryHeader({
  directory,
  onRefresh,
  onOpenFolder,
  searchTerm,
  onSearchChange,
  isDarkMode,
}: HistoryHeaderProps) {
  return (
    <header className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-5">
        <div>
          <h1
            className={`text-[1.9rem] font-bold m-0 ${
              isDarkMode ? 'text-slate-50' : 'text-slate-900'
            }`}
          >
            데일리 트래킹
          </h1>
          <p
            className={`mt-2 text-[0.9rem] break-all ${
              isDarkMode ? 'text-slate-400/75' : 'text-slate-500'
            }`}
          >
            {directory}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenFolder}
            className={
              isDarkMode
                ? 'border-slate-400/30 bg-slate-400/10 text-slate-100 hover:bg-slate-400/20 hover:border-slate-400/50'
                : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'
            }
          >
            <FolderOpen className="h-4 w-4 mr-2" />
            폴더 열기
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className={
              isDarkMode
                ? 'border-slate-400/30 bg-slate-400/10 text-slate-100 hover:bg-slate-400/20 hover:border-slate-400/50'
                : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'
            }
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            새로고침
          </Button>
        </div>
      </div>

      <HistoryFilter
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        isDarkMode={isDarkMode}
      />
    </header>
  );
}
