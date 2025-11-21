import { Pencil, Eye } from 'lucide-react';
import React from 'react';

interface DumpPanelHeaderProps {
  isDarkMode: boolean;
  isSaving: boolean;
  isEditing: boolean;
  onToggleEdit: () => void;
  currentDateLabel?: string;
}

export const DumpPanelHeader = React.memo(function DumpPanelHeader({
  isDarkMode,
  isSaving,
  isEditing,
  onToggleEdit,
  currentDateLabel,
}: DumpPanelHeaderProps) {
  return (
    <div
      className={`flex h-14 items-center justify-between border-b px-6 ${isDarkMode ? 'border-white/10' : 'border-slate-200/50'}`}
    >
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em]">
          쏟아내기(dump)
        </span>
        {currentDateLabel && (
          <span
            className={`text-[10px] font-normal normal-case tracking-normal ${
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            · {currentDateLabel}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {isSaving && (
          <span
            className={`rounded-full px-3 py-1 text-[10px] ${
              isDarkMode
                ? 'bg-white/10 text-slate-200'
                : 'bg-slate-200 text-slate-700'
            }`}
          >
            저장 중
          </span>
        )}
        <button
          type="button"
          onClick={onToggleEdit}
          className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition ${
            isDarkMode
              ? 'border-white/10 bg-[#05070c] text-slate-200 hover:border-white/30'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'
          }`}
          title={isEditing ? '미리보기' : '편집'}
          aria-label={isEditing ? '미리보기' : '편집'}
        >
          {isEditing ? (
            <Eye className="h-4 w-4" />
          ) : (
            <Pencil className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
});
