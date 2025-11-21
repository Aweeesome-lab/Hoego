import { Search } from 'lucide-react';

import { Input } from '@/components/ui/input';

interface HistoryFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  isDarkMode: boolean;
}

export function HistoryFilter({
  searchTerm,
  onSearchChange,
  isDarkMode,
}: HistoryFilterProps) {
  return (
    <div className="flex items-center gap-3 w-full md:w-auto">
      <div className="relative flex-1 md:w-64">
        <Search
          className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${
            isDarkMode ? 'text-slate-400' : 'text-slate-500'
          }`}
        />
        <Input
          type="text"
          placeholder="기록 검색..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className={`pl-9 h-9 text-sm ${
            isDarkMode
              ? 'bg-slate-800/50 border-slate-700 text-slate-200 placeholder:text-slate-500 focus-visible:ring-slate-600'
              : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'
          }`}
        />
      </div>
      {/* Date filter could be added here in the future */}
      {/* <Button
        variant="outline"
        size="icon-sm"
        className={isDarkMode ? 'border-slate-700 text-slate-400' : ''}
      >
        <Calendar className="h-4 w-4" />
      </Button> */}
    </div>
  );
}
