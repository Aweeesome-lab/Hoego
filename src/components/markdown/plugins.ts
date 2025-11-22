/**
 * Markdown 플러그인 설정
 */

import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

import type { PluggableList } from 'unified';

/**
 * Remark 플러그인 (파싱 단계)
 * - remarkGfm: GitHub Flavored Markdown (테이블, 체크박스, 취소선 등)
 * - remarkMath: LaTeX 수식 지원
 * - remarkBreaks: 자연스러운 줄바꿈
 */
export const remarkPlugins: PluggableList = [
  remarkGfm,
  remarkMath,
  remarkBreaks,
];

/**
 * 체크박스와 Task List를 허용하는 커스텀 sanitize 스키마
 */
const customSanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    // 체크박스 input 허용
    input: [
      ...(defaultSchema.attributes?.input || []),
      ['type', 'checkbox'],
      ['checked', 'checked'],
      ['disabled', 'disabled'],
      'className',
    ],
    // Task list를 위한 className 허용
    ul: [...(defaultSchema.attributes?.ul || []), 'className'],
    li: [...(defaultSchema.attributes?.li || []), 'className'],
  },
};

/**
 * Rehype 플러그인 (렌더링 단계)
 * - rehypeRaw: HTML 태그 허용
 * - rehypeKatex: KaTeX로 수식 렌더링
 * - rehypeSanitize: XSS 방지 (커스텀 스키마)
 */
export const rehypePlugins: PluggableList = [
  rehypeRaw,
  rehypeKatex,
  [rehypeSanitize, customSanitizeSchema],
];
