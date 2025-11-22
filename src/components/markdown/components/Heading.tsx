/**
 * Heading 컴포넌트 (h1-h6)
 */

import type { HeadingProps } from '../types';

/**
 * 마크다운 제목 렌더러
 * ID를 자동 생성하여 앵커 링크 지원
 */
export function Heading({ level = 1, children, isDarkMode }: HeadingProps) {
  const Tag = `h${level}` as const;

  // 텍스트 내용에서 ID 생성
  const text = extractText(children);
  const id = text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');

  // 레벨별 스타일
  const styles = {
    1: 'text-3xl font-bold mt-8 mb-4 pb-2 border-b',
    2: 'text-2xl font-bold mt-6 mb-3 pb-2 border-b',
    3: 'text-xl font-semibold mt-5 mb-2',
    4: 'text-lg font-semibold mt-4 mb-2',
    5: 'text-base font-semibold mt-3 mb-2',
    6: 'text-sm font-semibold mt-2 mb-1',
  };

  const borderColor = isDarkMode
    ? 'border-gray-700'
    : 'border-gray-200';

  return (
    <Tag
      id={id}
      className={`
        ${styles[level]}
        ${level <= 2 ? borderColor : ''}
        scroll-mt-16
      `}
    >
      {children}
    </Tag>
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
