/**
 * Table 컴포넌트
 */

import type { BaseComponentProps } from '../types';

/**
 * 테이블 래퍼
 */
export function Table({ children, isDarkMode }: BaseComponentProps) {
  return (
    <div className="my-6 overflow-x-auto">
      <table
        className={`
          min-w-full divide-y
          ${isDarkMode ? 'divide-gray-700' : 'divide-gray-300'}
        `}
      >
        {children}
      </table>
    </div>
  );
}

/**
 * 테이블 헤더
 */
export function TableHead({ children, isDarkMode }: BaseComponentProps) {
  return (
    <thead
      className={`
        ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}
      `}
    >
      {children}
    </thead>
  );
}

/**
 * 테이블 바디
 */
export function TableBody({ children }: BaseComponentProps) {
  return <tbody className="divide-y divide-gray-200">{children}</tbody>;
}

/**
 * 테이블 행
 */
export function TableRow({ children, isDarkMode }: BaseComponentProps) {
  return (
    <tr
      className={`
        ${isDarkMode
          ? 'hover:bg-gray-800/50'
          : 'hover:bg-gray-50'
        }
        transition-colors
      `}
    >
      {children}
    </tr>
  );
}

/**
 * 테이블 헤더 셀
 */
export function TableHeaderCell({ children, isDarkMode }: BaseComponentProps) {
  return (
    <th
      className={`
        px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider
        ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}
      `}
    >
      {children}
    </th>
  );
}

/**
 * 테이블 데이터 셀
 */
export function TableCell({ children, isDarkMode }: BaseComponentProps) {
  return (
    <td
      className={`
        px-4 py-3 text-sm
        ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}
      `}
    >
      {children}
    </td>
  );
}
