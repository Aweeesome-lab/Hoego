import React from 'react';

import type { HeadingRendererProps } from '../types';

/**
 * 마크다운 헤딩 렌더러 (h1~h6)
 *
 * 레벨에 따라 크기와 스타일이 차별화됩니다.
 * - h1: 가장 큰 제목
 * - h6: 가장 작은 제목
 * - 다크모드 지원
 *
 * @param level - 헤딩 레벨 (1-6)
 * @param children - 헤딩 내용
 * @param isDarkMode - 다크모드 여부
 */
export function HeadingRenderer({
  level,
  children,
  isDarkMode,
  ...props
}: HeadingRendererProps &
  Omit<React.HTMLAttributes<HTMLElement>, 'level' | 'children'>) {
  const Tag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

  const styles: Record<number, string> = {
    1: `mb-4 mt-6 first:mt-0 text-xl font-bold leading-tight ${
      isDarkMode ? 'text-slate-100' : 'text-slate-900'
    }`,
    2: `mb-3 mt-5 first:mt-0 text-lg font-semibold leading-snug ${
      isDarkMode ? 'text-slate-100' : 'text-slate-800'
    }`,
    3: `mb-2 mt-4 first:mt-0 text-base font-semibold leading-normal ${
      isDarkMode ? 'text-slate-200' : 'text-slate-800'
    }`,
    4: `mb-2 mt-3 first:mt-0 text-sm font-semibold leading-normal ${
      isDarkMode ? 'text-slate-200' : 'text-slate-700'
    }`,
    5: `mb-1 mt-3 first:mt-0 text-[13px] font-semibold leading-normal ${
      isDarkMode ? 'text-slate-300' : 'text-slate-700'
    }`,
    6: `mb-1 mt-2 first:mt-0 text-xs font-medium leading-normal ${
      isDarkMode ? 'text-slate-400' : 'text-slate-600'
    }`,
  };

  return React.createElement(
    Tag,
    { ...props, className: styles[level] },
    children
  );
}
