import { Pencil, Eye } from 'lucide-react';
import React from 'react';

import { MarkdownPreview } from '@/components/markdown';

interface RetrospectPanelProps {
  isDarkMode: boolean;
  isRetrospectPanelExpanded: boolean;
  retrospectContent: string;
  setRetrospectContent: (content: string) => void;
  retrospectRef: React.RefObject<HTMLTextAreaElement>;
  isSavingRetrospect: boolean;
  isEditingRetrospect: boolean;
  setIsEditingRetrospect: (isEditing: boolean) => void;
}

export function RetrospectPanel({
  isDarkMode,
  isRetrospectPanelExpanded,
  retrospectContent,
  setRetrospectContent,
  retrospectRef,
  isSavingRetrospect,
  isEditingRetrospect,
  setIsEditingRetrospect,
}: RetrospectPanelProps) {
  if (!isRetrospectPanelExpanded) return null;

  return (
    <section
      className={`flex flex-1 flex-col overflow-hidden ${
        isDarkMode ? 'bg-[#0f141f] text-slate-100' : 'bg-white text-slate-900'
      }`}
    >
      {/* Header */}
      <div
        className={`flex h-14 items-center justify-between border-b px-6 ${
          isDarkMode ? 'border-white/10' : 'border-slate-200/50'
        }`}
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
            onClick={() => setIsEditingRetrospect(!isEditingRetrospect)}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition ${
              isDarkMode
                ? 'border-white/10 bg-[#05070c] text-slate-200 hover:border-white/30'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'
            }`}
            title={isEditingRetrospect ? '미리보기' : '편집'}
          >
            {isEditingRetrospect ? (
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
            content={
              retrospectContent ||
              (isEditingRetrospect
                ? ''
                : '## ✍️ 회고 미리보기\n\n내용을 작성하면 이 영역에서 마크다운이 적용된 회고를 실시간으로 확인할 수 있어요.')
            }
            isEditing={isEditingRetrospect}
            onContentChange={setRetrospectContent}
            editorRef={retrospectRef}
            isDarkMode={isDarkMode}
            className={isEditingRetrospect ? 'px-4 py-4' : ''}
          />
        </div>
      </div>
    </section>
  );
}
