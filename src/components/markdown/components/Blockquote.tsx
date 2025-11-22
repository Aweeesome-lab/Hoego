/**
 * Blockquote 컴포넌트
 */

import type { BaseComponentProps } from '../types';

/**
 * 인용구 렌더러
 */
export function Blockquote({ children, isDarkMode }: BaseComponentProps) {
  const borderColor = isDarkMode ? 'border-blue-500' : 'border-blue-600';
  const bgColor = isDarkMode ? 'bg-blue-950/20' : 'bg-blue-50';
  const textColor = isDarkMode ? 'text-gray-300' : 'text-gray-700';

  return (
    <blockquote
      className={`
        my-4 pl-4 pr-4 py-2
        border-l-4 ${borderColor}
        ${bgColor}
        ${textColor}
        italic rounded-r
      `}
    >
      {children}
    </blockquote>
  );
}
