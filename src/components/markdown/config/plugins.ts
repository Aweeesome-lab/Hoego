import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';

import type { PluggableList } from 'unified';

/**
 * 기본 remark 플러그인 목록
 * - remarkGfm: GitHub Flavored Markdown 지원
 * - remarkMath: 수학 공식 지원
 * - remarkBreaks: 자연스러운 줄바꿈 처리
 */
export const DEFAULT_REMARK_PLUGINS: PluggableList = [
  remarkGfm,
  remarkMath,
  remarkBreaks,
];

/**
 * 기본 rehype 플러그인 목록
 * - rehypeRaw: 원시 HTML 지원
 * - rehypeKatex: KaTeX 수식 렌더링
 * - rehypeSanitize: XSS 방지 (커스텀 스키마 적용)
 */
export const DEFAULT_REHYPE_PLUGINS: PluggableList = [
  rehypeRaw,
  rehypeKatex,
  [rehypeSanitize, getCustomSanitizeSchema()],
];

/**
 * Task list 체크박스를 허용하는 커스텀 sanitize 스키마
 */
function getCustomSanitizeSchema() {
  return {
    ...defaultSchema,
    attributes: {
      ...defaultSchema.attributes,
      input: [
        ...(defaultSchema.attributes?.input || []),
        ['type', 'checkbox'],
        ['checked', 'checked'],
        ['disabled', 'disabled'],
        'className',
      ],
    },
  };
}
