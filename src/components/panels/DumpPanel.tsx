import React from 'react';

import type { Components } from 'react-markdown';

import { DumpPanelHeader } from './DumpPanelHeader';
import { DumpContentArea } from './DumpContentArea';

interface DumpPanelProps {
  isDarkMode: boolean;
  isEditing: boolean;
  dumpContent: string;
  setDumpContent: (content: string) => void;
  markdownRef: React.RefObject<HTMLDivElement>;
  editorRef: React.RefObject<HTMLTextAreaElement>;
  appendTimestampToLine: (line: string) => string;
  markdownComponents: Components;
  currentDateLabel?: string;
  onToggleEdit: () => void;
  isSaving: boolean;
  isHistoryMode?: boolean;
}

export const DumpPanel = React.memo(function DumpPanel({
  isDarkMode,
  isEditing,
  dumpContent,
  setDumpContent,
  markdownRef,
  editorRef,
  appendTimestampToLine,
  markdownComponents,
  currentDateLabel,
  onToggleEdit,
  isSaving,
  isHistoryMode = false,
}: DumpPanelProps) {
  return (
    <section
      className={`flex flex-1 flex-col overflow-hidden border-r ${
        isDarkMode
          ? 'bg-[#0f141f] text-slate-100 border-white/10'
          : 'bg-white text-slate-900 border-slate-200/50'
      }`}
    >
      <DumpPanelHeader
        isDarkMode={isDarkMode}
        isSaving={isSaving}
        isEditing={isEditing}
        onToggleEdit={onToggleEdit}
        currentDateLabel={currentDateLabel}
        isHistoryMode={isHistoryMode}
      />
      <DumpContentArea
        isDarkMode={isDarkMode}
        isEditing={isEditing}
        dumpContent={dumpContent}
        setDumpContent={setDumpContent}
        markdownRef={markdownRef}
        editorRef={editorRef}
        appendTimestampToLine={appendTimestampToLine}
        markdownComponents={markdownComponents}
      />
    </section>
  );
});
