import React from 'react';
import remarkGfm from 'remark-gfm';

import type { Components } from 'react-markdown';

import { MemoizedReactMarkdown } from '@/components/markdown';

interface DumpContentAreaProps {
  isDarkMode: boolean;
  isEditing: boolean;
  dumpContent: string;
  setDumpContent: (content: string) => void;
  markdownRef: React.RefObject<HTMLDivElement>;
  editorRef: React.RefObject<HTMLTextAreaElement>;
  appendTimestampToLine: (line: string) => string;
  markdownComponents: Components;
}

export const DumpContentArea = React.memo(function DumpContentArea({
  isDarkMode,
  isEditing,
  dumpContent,
  setDumpContent,
  markdownRef,
  editorRef,
  appendTimestampToLine,
  markdownComponents,
}: DumpContentAreaProps) {
  return (
    <div className="flex-1 overflow-hidden px-6 py-4">
      <div
        ref={markdownRef}
        className="relative h-full w-full"
        onMouseDown={(e) => e.stopPropagation()}
        style={{ pointerEvents: 'auto' }}
        role="article"
        aria-label="마크다운 콘텐츠"
      >
        {/* 편집 모드 - textarea */}
        <textarea
          ref={editorRef}
          value={dumpContent}
          onChange={(e) => setDumpContent(e.target.value)}
          className={`absolute inset-0 resize-none border-0 text-[13px] leading-5 outline-none px-4 py-4 ${
            isDarkMode
              ? 'bg-[#05070c] text-slate-100 placeholder:text-slate-500'
              : 'bg-white text-slate-900 placeholder:text-slate-400'
          } ${isEditing ? '' : 'hidden'}`}
          style={{
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            paddingBottom: '120px',
          }}
          placeholder="# 오늘\n\n작업을 기록해보세요."
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.stopPropagation();
            }
            if (
              e.key === 'Enter' &&
              !e.shiftKey &&
              !e.metaKey &&
              !e.ctrlKey &&
              !e.altKey
            ) {
              const el = editorRef.current;
              if (!el) return;
              e.preventDefault();

              const start = el.selectionStart;
              const end = el.selectionEnd;
              const before = dumpContent.slice(0, start);
              const after = dumpContent.slice(end);
              const lineStart = before.lastIndexOf('\n') + 1;
              const currentLine = before.slice(lineStart);

              const stampedLine = appendTimestampToLine(currentLine);

              const nextPrefix = '';
              const newContent = `${
                dumpContent.slice(0, lineStart) + stampedLine
              }\n${nextPrefix}${after}`;
              const newCaret =
                lineStart + stampedLine.length + 1 + nextPrefix.length;

              setDumpContent(newContent);
              setTimeout(() => {
                const ta = editorRef.current;
                if (ta) ta.setSelectionRange(newCaret, newCaret);
              }, 0);
            }
          }}
        />

        {/* 미리보기 모드 - markdown */}
        <div
          className={`absolute inset-0 overflow-y-auto overflow-x-hidden px-4 py-4 text-[13px] prose prose-sm max-w-none ${
            isDarkMode ? 'prose-invert text-slate-200' : 'text-slate-700'
          } ${isEditing ? 'hidden' : ''}`}
          style={{ paddingBottom: '120px' }}
        >
          <MemoizedReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={markdownComponents}
          >
            {dumpContent || '# 오늘\n\n작업을 기록해보세요.'}
          </MemoizedReactMarkdown>
        </div>
      </div>
    </div>
  );
});
