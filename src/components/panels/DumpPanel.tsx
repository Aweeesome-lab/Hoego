import { Pencil, Eye } from 'lucide-react';
import React from 'react';

import type { Position } from 'unist';

import { MarkdownPreview } from '@/components/markdown';

interface DumpPanelProps {
  isDarkMode: boolean;
  isEditing: boolean;
  dumpContent: string;
  setDumpContent: (content: string) => void;
  markdownRef: React.RefObject<HTMLDivElement>;
  editorRef: React.RefObject<HTMLTextAreaElement>;
  appendTimestampToLine: (line: string) => string;
  currentDateLabel?: string;
  onToggleEdit: () => void;
  isSaving: boolean;
  onTaskToggle?: (position: Position, checked: boolean) => Promise<void>;
}

export const DumpPanel = React.memo(function DumpPanel({
  isDarkMode,
  isEditing,
  dumpContent,
  setDumpContent,
  markdownRef,
  editorRef,
  appendTimestampToLine,
  currentDateLabel,
  onToggleEdit,
  isSaving,
  onTaskToggle,
}: DumpPanelProps) {
  return (
    <section
      className={`flex flex-1 flex-col overflow-hidden border-r ${
        isDarkMode
          ? 'bg-[#0f141f] text-slate-100 border-white/10'
          : 'bg-white text-slate-900 border-slate-200/50'
      }`}
    >
      {/* Header */}
      <div
        className={`flex h-14 items-center justify-between border-b px-6 ${
          isDarkMode ? 'border-white/10' : 'border-slate-200/50'
        }`}
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

      {/* Content Area */}
      <div className="flex-1 overflow-hidden px-6 py-4">
        <div className="relative h-full w-full">
          <MarkdownPreview
            content={dumpContent}
            isEditing={isEditing}
            onContentChange={setDumpContent}
            editorRef={editorRef}
            onEnterKey={appendTimestampToLine}
            isDarkMode={isDarkMode}
            previewRef={markdownRef}
            isSaving={isSaving}
            onTaskToggle={onTaskToggle}
            className={isEditing ? 'px-4 py-4' : ''}
          />
        </div>
      </div>
    </section>
  );
});
