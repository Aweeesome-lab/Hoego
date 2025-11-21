import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import {
  oneDark,
  oneLight,
} from 'react-syntax-highlighter/dist/esm/styles/prism';

import type { CodeRendererProps } from '../types';

/**
 * 코드 렌더러 (인라인 코드 및 코드 블록)
 *
 * - 인라인 코드: 백틱으로 감싼 짧은 코드
 * - 코드 블록: 언어별 구문 강조 지원
 *
 * @param children - 코드 내용
 * @param language - 언어 (코드 블록만)
 * @param inline - 인라인 코드 여부
 * @param isDarkMode - 다크모드 여부
 */
export function CodeRenderer({
  children,
  language,
  inline = false,
  isDarkMode,
  ...props
}: CodeRendererProps & React.HTMLAttributes<HTMLElement>) {
  // 인라인 코드
  if (inline) {
    return (
      <code
        {...props}
        className={`rounded px-1.5 py-0.5 text-[12px] font-mono ${
          isDarkMode
            ? 'bg-white/10 text-orange-300'
            : 'bg-slate-100 text-orange-600'
        }`}
      >
        {children}
      </code>
    );
  }

  // 코드 블록
  const codeString = String(children).replace(/\n$/, '');

  return (
    <SyntaxHighlighter
      style={isDarkMode ? oneDark : oneLight}
      language={language || 'text'}
      PreTag="div"
      customStyle={{
        margin: '1rem 0',
        borderRadius: '0.5rem',
        fontSize: '12px',
      }}
      codeTagProps={{
        style: {
          fontFamily:
            'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        },
      }}
    >
      {codeString}
    </SyntaxHighlighter>
  );
}
