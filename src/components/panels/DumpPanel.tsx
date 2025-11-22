import React from 'react';

import type { Position } from 'unist';

import { MarkdownPreview } from '@/components/markdown';

interface DumpPanelProps {
  isDarkMode: boolean;
  dumpContent: string;
  markdownRef: React.RefObject<HTMLDivElement>;
  currentDateLabel?: string;
  isSaving: boolean;
  onTaskToggle?: (position: Position, checked: boolean) => Promise<void>;
}

export const DumpPanel = React.memo(function DumpPanel({
  isDarkMode,
  dumpContent,
  markdownRef,
  currentDateLabel,
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
            쏟아내기
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
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        <MarkdownPreview
          content={dumpContent}
          isDarkMode={isDarkMode}
          previewRef={markdownRef}
          isSaving={isSaving}
          onTaskToggle={onTaskToggle}
          className="px-10 py-6 pb-24"
        />
      </div>
    </section>
  );
});
