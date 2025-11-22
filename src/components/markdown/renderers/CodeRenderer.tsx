import React, { useState, Suspense, lazy } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import {
  oneDark,
  oneLight,
} from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Check, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

import type { CodeRendererProps } from '../types';

// Lazy load MermaidRenderer for performance
const MermaidRenderer = lazy(() =>
  import('./MermaidRenderer').then((module) => ({
    default: module.MermaidRenderer,
  }))
);

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
export const CodeRenderer = React.memo(function CodeRenderer({
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
  const [copied, setCopied] = useState(false);

  // Check if this is a Mermaid diagram
  if (language === 'mermaid') {
    return (
      <Suspense
        fallback={
          <div
            className={`my-4 p-4 rounded-lg flex items-center justify-center ${
              isDarkMode ? 'bg-slate-800/50 text-slate-400' : 'bg-slate-50 text-slate-600'
            }`}
          >
            <span className="text-sm">Loading diagram...</span>
          </div>
        }
      >
        <MermaidRenderer code={codeString} isDarkMode={isDarkMode} />
      </Suspense>
    );
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeString);
      setCopied(true);
      toast.success('Code copied to clipboard!', {
        duration: 2000,
        position: 'bottom-right',
      });

      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy code', {
        duration: 2000,
        position: 'bottom-right',
      });
      console.error('Failed to copy code:', error);
    }
  };

  return (
    <div className="relative group" role="region" aria-label={`Code block${language ? ` in ${language}` : ''}`}>
      {/* Language Badge */}
      {language && (
        <div
          className={`absolute top-3 left-3 z-10 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${
            isDarkMode
              ? 'bg-slate-700/80 text-slate-300'
              : 'bg-slate-200/80 text-slate-700'
          }`}
          aria-label={`Code language: ${language}`}
        >
          {language}
        </div>
      )}

      {/* Copy Button */}
      <button
        onClick={handleCopy}
        aria-label={copied ? 'Code copied' : 'Copy code to clipboard'}
        aria-live="polite"
        className={`absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
          isDarkMode
            ? 'bg-slate-700/80 hover:bg-slate-600/80 text-slate-300 hover:text-white'
            : 'bg-slate-200/80 hover:bg-slate-300/80 text-slate-700 hover:text-slate-900'
        } ${copied ? 'scale-95' : 'scale-100 opacity-0 group-hover:opacity-100'}`}
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5" />
            <span>Copied!</span>
          </>
        ) : (
          <>
            <Copy className="w-3.5 h-3.5" />
            <span>Copy</span>
          </>
        )}
      </button>

      {/* Code Block */}
      <SyntaxHighlighter
        style={isDarkMode ? oneDark : oneLight}
        language={language || 'text'}
        PreTag="div"
        showLineNumbers={true}
        customStyle={{
          margin: '1rem 0',
          borderRadius: '0.5rem',
          fontSize: '12px',
          paddingTop: '2rem', // Space for language badge and copy button
        }}
        codeTagProps={{
          style: {
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          },
        }}
        lineNumberStyle={{
          minWidth: '3em',
          paddingRight: '1em',
          opacity: 0.5,
          userSelect: 'none',
        }}
      >
        {codeString}
      </SyntaxHighlighter>
    </div>
  );
});
