import { Sparkles, Loader2 } from 'lucide-react';
import React from 'react';
import remarkGfm from 'remark-gfm';

import type { Components } from 'react-markdown';

import { MemoizedReactMarkdown } from '@/components/markdown';
import { useDumpCategorization } from '@/hooks/useDumpCategorization';

interface DumpPanelProps {
  isDarkMode: boolean;
  isEditing: boolean;
  markdownRef: React.RefObject<HTMLDivElement>;
  editorRef: React.RefObject<HTMLTextAreaElement>;
  editingContent: string;
  setEditingContent: (content: string) => void;
  appendTimestampToLine: (line: string) => string;
  markdownContent: string;
  markdownComponents: Components;
  onSaveMarkdown: (content: string) => Promise<void>;
}

export const DumpPanel = React.memo(function DumpPanel({
  isDarkMode,
  isEditing,
  markdownRef,
  editorRef,
  editingContent,
  setEditingContent,
  appendTimestampToLine,
  markdownContent,
  markdownComponents,
  onSaveMarkdown,
}: DumpPanelProps) {
  // Categorization hook
  const { isCategorizingDump, categorizeDump } = useDumpCategorization();

  // Handle categorization button click
  const handleCategorizeDump = async () => {
    const contentToUse = isEditing ? editingContent : markdownContent;
    const categorizedContent = await categorizeDump(contentToUse);

    // If categorization was successful (content changed), save it
    if (categorizedContent !== contentToUse) {
      await onSaveMarkdown(categorizedContent);
      if (isEditing) {
        setEditingContent(categorizedContent);
      }
    }
  };

  return (
    <section
      className={`flex flex-1 flex-col overflow-hidden border-r ${
        isDarkMode
          ? 'bg-[#0f141f] text-slate-100 border-white/10'
          : 'bg-white text-slate-900 border-slate-200'
      }`}
    >
      <div className="flex h-12 items-center justify-between border-b border-slate-200/20 px-3.5 text-[11px] font-semibold uppercase tracking-[0.2em]">
        <span>쏟아내기(dump)</span>
        <div className="flex items-center gap-2">
          {/* Categorization button */}
          <button
            onClick={handleCategorizeDump}
            disabled={isCategorizingDump}
            title="AI 카테고리화"
            className={`rounded-full p-2 transition-colors border ${
              isDarkMode
                ? 'border-white/20 hover:bg-white/10 text-slate-300 hover:text-slate-100 hover:border-white/30 disabled:text-slate-600 disabled:border-white/10 disabled:cursor-not-allowed'
                : 'border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 hover:border-slate-300 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed'
            }`}
          >
            {isCategorizingDump ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
          </button>

          {/* Edit badge */}
          {isEditing ? (
            <span
              className={`rounded-full px-3 py-1 text-[10px] ${
                isDarkMode
                  ? 'bg-white/10 text-slate-200'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              편집 중
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex-1 overflow-hidden px-3.5 py-2.5">
        <div
          ref={markdownRef}
          className="h-full w-full overflow-y-auto"
          onMouseDown={(e) => e.stopPropagation()}
          style={{ pointerEvents: 'auto' }}
        >
          {isEditing ? (
            <textarea
              ref={editorRef}
              value={editingContent}
              onChange={(e) => setEditingContent(e.target.value)}
              className={`w-full min-h-[260px] resize-none border text-[13px] leading-5 outline-none ${
                isDarkMode
                  ? 'border-white/10 bg-[#05070c] text-slate-100 placeholder:text-slate-500'
                  : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400'
              }`}
              style={{
                fontFamily:
                  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                padding: 12,
                height: '100%',
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
                  const before = editingContent.slice(0, start);
                  const after = editingContent.slice(end);
                  const lineStart = before.lastIndexOf('\n') + 1;
                  const currentLine = before.slice(lineStart);

                  const stampedLine = appendTimestampToLine(currentLine);

                  const nextPrefix = '';
                  const newContent = `${
                    editingContent.slice(0, lineStart) + stampedLine
                  }\n${nextPrefix}${after}`;
                  const newCaret =
                    lineStart + stampedLine.length + 1 + nextPrefix.length;

                  setEditingContent(newContent);
                  setTimeout(() => {
                    const ta = editorRef.current;
                    if (ta) ta.setSelectionRange(newCaret, newCaret);
                  }, 0);
                }
              }}
            />
          ) : (
            <div
              className={`prose prose-sm max-w-none ${
                isDarkMode ? 'prose-invert text-slate-200' : 'text-slate-700'
              }`}
            >
              <MemoizedReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {markdownContent || '# 오늘\n\n작업을 기록해보세요.'}
              </MemoizedReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </section>
  );
});
