import { Pencil, Eye } from 'lucide-react';
import React from 'react';

interface RetrospectPanelHeaderProps {
  isDarkMode: boolean;
  isSavingRetrospect: boolean;
  isEditing: boolean;
  setIsEditing: (isEditing: boolean) => void;
}

export const RetrospectPanelHeader = React.memo(function RetrospectPanelHeader({
  isDarkMode,
  isSavingRetrospect,
  isEditing,
  setIsEditing,
}: RetrospectPanelHeaderProps) {
  return (
    <div
      className={`flex h-14 items-center justify-between border-b px-6 ${isDarkMode ? 'border-white/10' : 'border-slate-200/50'}`}
    >
      <span className="text-[11px] font-semibold uppercase tracking-[0.2em]">
        회고하기(retrospect)
      </span>
      <div className="flex items-center gap-2">
        {isSavingRetrospect && (
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
          onClick={() => setIsEditing(!isEditing)}
          className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition ${
            isDarkMode
              ? 'border-white/10 bg-[#05070c] text-slate-200 hover:border-white/30'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'
          }`}
          title={isEditing ? '미리보기' : '편집'}
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
