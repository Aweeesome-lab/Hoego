import React from 'react';

import { MarkdownPreview } from '@/components/markdown';

interface RetrospectPanelProps {
  isDarkMode: boolean;
  isRetrospectPanelExpanded: boolean;
  retrospectContent: string;
  isSavingRetrospect: boolean;
}

export function RetrospectPanel({
  isDarkMode,
  isRetrospectPanelExpanded,
  retrospectContent,
  isSavingRetrospect,
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
          회고하기
        </span>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden px-6 py-4 pb-24">
        <div className="relative h-full w-full">
          <MarkdownPreview
            content={
              retrospectContent ||
              '## ✍️ 회고 미리보기\n\n내용을 작성하면 이 영역에서 마크다운이 적용된 회고를 실시간으로 확인할 수 있어요.'
            }
            isDarkMode={isDarkMode}
          />
        </div>
      </div>
    </section>
  );
}
