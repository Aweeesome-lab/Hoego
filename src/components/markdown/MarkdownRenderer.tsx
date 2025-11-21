import 'katex/dist/katex.min.css';

import React from 'react';
import ReactMarkdown from 'react-markdown';

import { DEFAULT_REMARK_PLUGINS, DEFAULT_REHYPE_PLUGINS } from './config';
import { useMarkdownComponents } from './hooks';

import type { MarkdownRendererProps } from './types';

/**
 * 마크다운 렌더러
 *
 * react-markdown을 사용하여 마크다운 콘텐츠를 렌더링합니다.
 * - 자동 플러그인 적용 (GFM, Math, Breaks, KaTeX, Sanitize)
 * - 커스텀 컴포넌트 렌더러
 * - Task list 체크박스 토글 지원
 * - 다크모드 지원
 *
 * @param content - 렌더링할 마크다운 콘텐츠
 * @param isDarkMode - 다크모드 여부
 * @param onTaskToggle - Task list 체크박스 토글 핸들러
 * @param className - 추가 CSS 클래스
 * @param isSaving - 저장 중 상태
 */
export const MarkdownRenderer = React.memo(function MarkdownRenderer({
  content,
  isDarkMode = false,
  onTaskToggle,
  className = '',
  isSaving = false,
}: MarkdownRendererProps) {
  const components = useMarkdownComponents({
    isDarkMode,
    isSaving,
    onTaskToggle,
  });

  return (
    <ReactMarkdown
      className={`markdown-renderer ${className}`}
      remarkPlugins={DEFAULT_REMARK_PLUGINS}
      rehypePlugins={DEFAULT_REHYPE_PLUGINS}
      components={components}
    >
      {content}
    </ReactMarkdown>
  );
});
