/**
 * Markdown Viewer Component
 *
 * Minimal markdown renderer with:
 * - GitHub Flavored Markdown support (tables, task lists, strikethrough)
 * - Dark mode support
 * - Tailwind typography styling
 */

'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export interface MarkdownViewerProps {
  content: string;
  className?: string;
  isDarkMode?: boolean;
}

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
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
