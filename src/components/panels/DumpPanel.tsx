import { Pencil, Check } from 'lucide-react';
import React from 'react';
import remarkGfm from 'remark-gfm';

import type { Components } from 'react-markdown';

import { MemoizedReactMarkdown } from '@/components/markdown';

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
  currentDateLabel?: string; // 현재 보고 있는 날짜 라벨

  // 편집 버튼 관련 props
  setIsEditing: (value: boolean) => void;
  saveTodayMarkdown: (content: string) => Promise<void>;
  lastSavedRef: React.MutableRefObject<string>;
  loadMarkdown: () => Promise<void>;
  isSaving: boolean;
  setIsSaving: (value: boolean) => void;
  isHistoryMode?: boolean;
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
  currentDateLabel,
  setIsEditing,
  saveTodayMarkdown,
  lastSavedRef,
  loadMarkdown,
  isSaving: _isSaving,
  setIsSaving,
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
      <div className={`flex h-14 items-center justify-between border-b px-6 ${isDarkMode ? 'border-white/10' : 'border-slate-200/50'}`}>
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
          {isEditing ? (
            <button
              type="button"
              onClick={() => {
                void (async () => {
                  // 편집 종료: 현재 줄에 타임스탬프 부착 후 저장/종료
                  let contentToSave = editingContent;
                  const el = editorRef.current;
                  if (el) {
                    const start = el.selectionStart;
                    const end = el.selectionEnd;
                    const before = editingContent.slice(0, start);
                    const after = editingContent.slice(end);
                    const lineStart = before.lastIndexOf('\n') + 1;
                    const currentLine = before.slice(lineStart);
                    const stampedLine = appendTimestampToLine(currentLine);
                    const newContent =
                      editingContent.slice(0, lineStart) + stampedLine + after;
                    if (newContent !== editingContent) {
                      setEditingContent(newContent);
                      contentToSave = newContent;
                    }
                  }
                  try {
                    setIsSaving(true);
                    if (contentToSave !== lastSavedRef.current) {
                      await saveTodayMarkdown(contentToSave);
                      lastSavedRef.current = contentToSave;
                    }
                    await loadMarkdown();
                  } catch (error) {
                    if (import.meta.env.DEV)
                      console.error('[hoego] 저장 실패:', error);
                  } finally {
                    setIsSaving(false);
                    setIsEditing(false);
                  }
                })();
              }}
              className={`flex h-8 items-center rounded-full border px-3 text-xs font-semibold ${
                isDarkMode
                  ? 'border-white/10 bg-[#0a0d13]/80 text-slate-200'
                  : 'border-slate-200 bg-white text-slate-700'
              }`}
            >
              <Check className="mr-1.5 h-3.5 w-3.5" /> 완료
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (isHistoryMode) return;
                setEditingContent(markdownContent);
                setIsEditing(true);
              }}
              disabled={isHistoryMode}
              className={`flex h-8 w-8 items-center justify-center rounded-full border ${
                isHistoryMode
                  ? isDarkMode
                    ? 'border-white/5 bg-[#0a0d13]/50 text-slate-600 cursor-not-allowed'
                    : 'border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed'
                  : isDarkMode
                    ? 'border-white/10 bg-[#0a0d13]/80 text-slate-300 hover:bg-white/10'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
              }`}
              onMouseDown={(e) => e.stopPropagation()}
              title={isHistoryMode ? '히스토리는 읽기 전용입니다' : '편집 모드 열기'}
              aria-label={isHistoryMode ? '히스토리는 읽기 전용입니다' : '편집 모드 열기'}
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-hidden px-6 py-4">
        <div
          ref={markdownRef}
          className={`h-full w-full ${
            isEditing ? '' : 'overflow-y-auto overflow-x-hidden'
          }`}
          onMouseDown={(e) => e.stopPropagation()}
          style={{ pointerEvents: 'auto', paddingBottom: '120px' }}
          role="article"
          aria-label="마크다운 콘텐츠"
        >
          {isEditing ? (
            <textarea
              ref={editorRef}
              value={editingContent}
              onChange={(e) => setEditingContent(e.target.value)}
              className={`w-full h-full min-h-[260px] resize-none border text-[13px] leading-5 outline-none ${
                isDarkMode
                  ? 'border-white/10 bg-[#05070c] text-slate-100 placeholder:text-slate-500'
                  : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400'
              }`}
              style={{
                fontFamily:
                  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                padding: 12,
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
