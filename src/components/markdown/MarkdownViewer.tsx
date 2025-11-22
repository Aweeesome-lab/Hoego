/**
 * Markdown Viewer - 메인 렌더러 컴포넌트
 */

'use client';

import ReactMarkdown from 'react-markdown';

import { useComponents } from './hooks/useComponents';
import { rehypePlugins, remarkPlugins } from './plugins';
import type { MarkdownViewerProps } from './types';

/**
 * 마크다운 뷰어 컴포넌트
 *
 * @param content - 렌더링할 마크다운 텍스트
 * @param className - 추가 CSS 클래스
 * @param isDarkMode - 다크모드 활성화 여부
 * @param onContentChange - 콘텐츠 변경 핸들러 (체크박스 토글 시)
 */
export function MarkdownViewer({
  content,
  className = '',
  isDarkMode = false,
  onContentChange,
}: MarkdownViewerProps) {
  const components = useComponents({ isDarkMode, onContentChange });

  return (
    <div
      className={`
        prose prose-sm max-w-none
        ${isDarkMode ? 'prose-invert' : ''}
        ${className}
      `}
    >
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
