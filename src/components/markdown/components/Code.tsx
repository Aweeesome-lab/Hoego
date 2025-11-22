/**
 * Code 컴포넌트 (inline code, code block)
 */

'use client';

import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import {
  oneDark,
  oneLight,
} from 'react-syntax-highlighter/dist/cjs/styles/prism';

import type { CodeProps } from '../types';

/**
 * 코드 렌더러 (인라인 + 블록)
 */
export function Code({
  inline,
  className,
  children,
  isDarkMode,
}: CodeProps) {
  const [copied, setCopied] = useState(false);

  // 언어 추출
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';

  // 코드 내용
  const code = String(children).replace(/\n$/, '');

  // 인라인 코드 (antigravity 스타일)
  if (inline || !language) {
    return (
      <code
        className={`
          px-1.5 py-0.5 rounded
          font-mono text-[13px]
          ${isDarkMode
            ? 'bg-gray-800/60 text-orange-400'
            : 'bg-orange-50 text-orange-600'
          }
        `}
      >
        {children}
      </code>
    );
  }

  // 복사 기능
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // 코드 블록
  return (
    <div className="relative group my-4">
      {/* 언어 뱃지 */}
      <div
        className={`
          absolute top-2 left-3 z-10
          px-2 py-0.5 rounded text-xs font-medium
          ${isDarkMode
            ? 'bg-gray-700 text-gray-300'
            : 'bg-gray-200 text-gray-700'
          }
        `}
      >
        {language}
      </div>

      {/* 복사 버튼 */}
      <button
        onClick={handleCopy}
        className={`
          absolute top-2 right-2 z-10
          px-3 py-1 rounded text-xs font-medium
          opacity-0 group-hover:opacity-100
          transition-opacity duration-200
          ${isDarkMode
            ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
          }
        `}
        aria-label="Copy code"
      >
        {copied ? '✓ Copied!' : 'Copy'}
      </button>

      {/* 코드 블록 */}
      <SyntaxHighlighter
        style={isDarkMode ? oneDark : oneLight}
        language={language}
        PreTag="div"
        className="rounded-lg !mt-0 !mb-0"
        showLineNumbers
        customStyle={{
          margin: 0,
          padding: '2.5rem 1rem 1rem 1rem',
          fontSize: '0.875rem',
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
