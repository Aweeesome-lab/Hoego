/**
 * Text 컴포넌트 (p, strong, em, del, hr)
 */

import type { BaseComponentProps } from '../types';

/**
 * 단락 (Paragraph) - antigravity 스타일
 */
export function Paragraph({ children, isDarkMode }: BaseComponentProps) {
  return (
    <p className={`
      mb-4 leading-relaxed
      ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}
    `}>
      {children}
    </p>
  );
}

/**
 * 강조 (Bold)
 */
export function Strong({ children }: BaseComponentProps) {
  return <strong className="font-semibold">{children}</strong>;
}

/**
 * 기울임 (Italic)
 */
export function Emphasis({ children }: BaseComponentProps) {
  return <em className="italic">{children}</em>;
}

/**
 * 취소선 (Strikethrough)
 */
export function Delete({ children, isDarkMode }: BaseComponentProps) {
  return (
    <del className={`
      line-through opacity-75
      ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}
    `}>
      {children}
    </del>
  );
}

/**
 * 수평선 (Horizontal Rule)
 */
export function HorizontalRule({ isDarkMode }: BaseComponentProps) {
  return (
    <hr className={`
      my-8 border-t
      ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}
    `} />
  );
}
