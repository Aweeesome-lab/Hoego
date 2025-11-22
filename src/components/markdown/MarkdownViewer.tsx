/**
 * Markdown Viewer - 최소한의 설정으로 마크다운 렌더링
 */

'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export interface MarkdownViewerProps {
  content: string;
  className?: string;
  isDarkMode?: boolean;
}

/**
 * 마크다운 뷰어 컴포넌트
 *
 * - @tailwindcss/typography prose 클래스 사용
 * - remark-gfm으로 GitHub Flavored Markdown 지원
 * - 커스텀 컴포넌트 없이 기본 렌더링
 */
export function MarkdownViewer({
  content,
  className = '',
  isDarkMode = false,
}: MarkdownViewerProps) {
  return (
    <div
      className={`
        prose prose-sm max-w-none
        ${isDarkMode ? 'prose-invert' : ''}
        ${className}
      `}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
