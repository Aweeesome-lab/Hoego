/**
 * Footnote 컴포넌트
 */

import type { BaseComponentProps } from '../types';

/**
 * 각주 참조 (본문에서 각주로 링크)
 */
export function FootnoteReference({
  children,
  node,
  isDarkMode,
}: BaseComponentProps) {
  const id = node?.properties?.id || '';
  const href = node?.properties?.href || '';

  return (
    <sup>
      <a
        id={id}
        href={href}
        className={`
          font-medium
          ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}
          hover:underline
        `}
      >
        {children}
      </a>
    </sup>
  );
}

/**
 * 각주 역참조 (각주에서 본문으로 돌아가는 링크)
 */
export function FootnoteBackReference({
  children,
  node,
  isDarkMode,
}: BaseComponentProps) {
  const href = node?.properties?.href || '';

  return (
    <a
      href={href}
      className={`
        ml-1
        ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}
        hover:underline
      `}
      aria-label="Back to content"
    >
      {children}
    </a>
  );
}

/**
 * 각주 섹션 전체
 */
export function FootnoteSection({ children, isDarkMode }: BaseComponentProps) {
  return (
    <section
      className={`
        mt-8 pt-4 border-t
        ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}
      `}
    >
      <h2
        className={`
          text-sm font-semibold mb-2
          ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}
        `}
      >
        Footnotes
      </h2>
      <ol className="text-sm space-y-1">{children}</ol>
    </section>
  );
}

/**
 * 개별 각주 아이템
 */
export function FootnoteItem({ children, node, isDarkMode }: BaseComponentProps) {
  const id = node?.properties?.id || '';

  return (
    <li
      id={id}
      className={`
        ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}
      `}
    >
      {children}
    </li>
  );
}
