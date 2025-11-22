/**
 * Blockquote 컴포넌트 (Antigravity Style Callouts)
 */

import React from 'react';
import type { BaseComponentProps } from '../types';

/**
 * Callout 타입 감지 및 스타일 적용
 * IMPORTANT, WARNING, NOTE 등을 감지하여 다른 스타일 적용
 */
export function Blockquote({ children, isDarkMode }: BaseComponentProps) {
  // children에서 첫 번째 요소의 텍스트 추출
  const firstChild = React.Children.toArray(children)[0];
  let calloutType: 'important' | 'warning' | 'note' | null = null;

  // 첫 번째 paragraph의 텍스트 확인
  if (React.isValidElement(firstChild) && firstChild.type === 'p') {
    const text = extractText(firstChild.props.children);
    const upperText = text.toUpperCase().trim();

    if (upperText.startsWith('IMPORTANT')) {
      calloutType = 'important';
    } else if (upperText.startsWith('WARNING')) {
      calloutType = 'warning';
    } else if (upperText.startsWith('NOTE')) {
      calloutType = 'note';
    }
  }

  // Callout 스타일 (antigravity)
  if (calloutType) {
    const styles = {
      important: {
        border: 'border-l-4 border-purple-500',
        bg: isDarkMode ? 'bg-purple-950/20' : 'bg-purple-50/50',
        header: isDarkMode ? 'text-purple-400' : 'text-purple-600',
        text: isDarkMode ? 'text-gray-200' : 'text-gray-800',
      },
      warning: {
        border: 'border-l-4 border-yellow-500',
        bg: isDarkMode ? 'bg-yellow-950/20' : 'bg-yellow-50/50',
        header: isDarkMode ? 'text-yellow-400' : 'text-yellow-700',
        text: isDarkMode ? 'text-gray-200' : 'text-gray-800',
      },
      note: {
        border: 'border-l-4 border-blue-500',
        bg: isDarkMode ? 'bg-blue-950/20' : 'bg-blue-50/50',
        header: isDarkMode ? 'text-blue-400' : 'text-blue-600',
        text: isDarkMode ? 'text-gray-200' : 'text-gray-800',
      },
    };

    const style = styles[calloutType];

    return (
      <div
        className={`
          my-4 px-4 py-3
          ${style.border}
          ${style.bg}
          ${style.text}
          rounded-r
        `}
      >
        {children}
      </div>
    );
  }

  // 기본 blockquote 스타일
  const borderColor = isDarkMode ? 'border-gray-600' : 'border-gray-400';
  const bgColor = isDarkMode ? 'bg-gray-800/30' : 'bg-gray-100/50';
  const textColor = isDarkMode ? 'text-gray-300' : 'text-gray-700';

  return (
    <blockquote
      className={`
        my-4 pl-4 pr-4 py-3
        border-l-4 ${borderColor}
        ${bgColor}
        ${textColor}
        rounded-r
      `}
    >
      {children}
    </blockquote>
  );
}

/**
 * children에서 텍스트 추출 (재귀)
 */
function extractText(children: any): string {
  if (typeof children === 'string') return children;
  if (Array.isArray(children)) return children.map(extractText).join('');
  if (children?.props?.children) return extractText(children.props.children);
  return '';
}
