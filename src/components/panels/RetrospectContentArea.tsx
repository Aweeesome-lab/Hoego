import React from 'react';
import remarkGfm from 'remark-gfm';

import type { Components } from 'react-markdown';

import { MemoizedReactMarkdown } from '@/components/markdown';

interface RetrospectContentAreaProps {
  isDarkMode: boolean;
  isEditing: boolean;
  retrospectContent: string;
  setRetrospectContent: (content: string) => void;
  retrospectRef: React.RefObject<HTMLTextAreaElement>;
  markdownComponents: Components;
}

export const RetrospectContentArea = React.memo(function RetrospectContentArea({
  isDarkMode,
  isEditing,
  retrospectContent,
  setRetrospectContent,
  retrospectRef,
  markdownComponents,
}: RetrospectContentAreaProps) {
  return (
    <div className="flex-1 overflow-hidden px-6 py-4">
      <div className="relative h-full w-full">
        {/* 편집 모드 - textarea */}
        <textarea
          ref={retrospectRef}
          value={retrospectContent}
          onChange={(e) => setRetrospectContent(e.target.value)}
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
          placeholder="AI의 피드백을 보고 떠오르는 생각을 자유롭게 적어보세요..."
        />

        {/* 미리보기 모드 - markdown */}
        <div
          className={`absolute inset-0 overflow-y-auto overflow-x-hidden px-4 py-4 text-[13px] prose prose-sm max-w-none ${
            isDarkMode ? 'prose-invert text-slate-100' : 'text-slate-900'
          } ${isEditing ? 'hidden' : ''}`}
          style={{ paddingBottom: '120px' }}
        >
          <MemoizedReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={markdownComponents}
          >
            {retrospectContent.trim()
              ? retrospectContent
              : '## ✍️ 회고 미리보기\n\n내용을 작성하면 이 영역에서 마크다운이 적용된 회고를 실시간으로 확인할 수 있어요.'}
          </MemoizedReactMarkdown>
        </div>
      </div>
    </div>
  );
});
