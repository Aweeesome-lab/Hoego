/**
 * MarkdownViewer Component
 *
 * 마크다운 콘텐츠를 HTML로 렌더링하는 컴포넌트
 *
 * 기술 스택:
 * - react-markdown: 마크다운 → React 컴포넌트 변환
 * - remark-gfm: GitHub Flavored Markdown 지원
 * - PrismJS: 코드 구문 강조
 * - Tailwind Typography: 프로즈 스타일링
 *
 * 체크박스 기능:
 * - 컴포넌트 교체 방식으로 커스텀 체크박스 렌더링
 * - TaskCheckbox 컴포넌트로 애니메이션 및 인터랙션 제공
 * - onContentChange 콜백으로 체크 상태 토글
 */

'use client';

import Prism from 'prismjs';
import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// PrismJS 언어 지원
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-typescript';

import { TaskCheckbox } from './TaskCheckbox';

import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface MarkdownViewerProps {
  /** 렌더링할 마크다운 콘텐츠 */
  content: string;
  /** 추가 CSS 클래스 */
  className?: string;
  /** 다크 모드 여부 */
  isDarkMode?: boolean;
  /** 체크박스 토글 시 호출되는 콜백 */
  onContentChange?: (newContent: string) => void;
}

// ============================================================================
// Constants
// ============================================================================

/** Tailwind Typography 클래스 */
const PROSE_CLASSES = [
  'prose prose-slate max-w-none',
  // 헤딩
  'prose-headings:font-semibold prose-headings:tracking-tight',
  'prose-h1:text-2xl prose-h1:border-b prose-h1:border-border prose-h1:pb-2',
  'prose-h2:text-xl prose-h2:border-b prose-h2:border-border prose-h2:pb-1.5',
  'prose-h3:text-lg',
  // 텍스트
  'prose-p:leading-relaxed',
  // 링크
  'prose-a:text-primary prose-a:no-underline hover:prose-a:underline',
  // 인라인 코드
  'prose-code:rounded prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5',
  'prose-code:font-mono prose-code:text-sm',
  'prose-code:before:content-none prose-code:after:content-none',
  // 코드 블록
  'prose-pre:bg-[#1e1e1e] prose-pre:rounded-lg prose-pre:border prose-pre:border-border',
  // 인용문
  'prose-blockquote:border-l-primary prose-blockquote:not-italic prose-blockquote:text-muted-foreground',
  // 리스트
  'prose-ul:list-disc prose-ol:list-decimal',
  'prose-li:marker:text-muted-foreground',
  // 테이블
  'prose-table:border-collapse',
  'prose-th:border prose-th:border-border prose-th:bg-muted prose-th:px-3 prose-th:py-2',
  'prose-td:border prose-td:border-border prose-td:px-3 prose-td:py-2',
  // HR
  'prose-hr:border-border',
].join(' ');

/** 체크박스 토글을 위한 정규식 */
const TASK_LIST_REGEX = /([-*+]\s+)\[([ xX])\]/g;

// ============================================================================
// Hooks
// ============================================================================

/**
 * 체크박스 인덱스 카운터 훅
 * react-markdown의 컴포넌트 렌더링 시 체크박스 인덱스 추적
 */
function useCheckboxIndexCounter() {
  const indexRef = useRef(0);

  const reset = useCallback(() => {
    indexRef.current = 0;
  }, []);

  const getNextIndex = useCallback(() => {
    return indexRef.current++;
  }, []);

  return { reset, getNextIndex };
}

// ============================================================================
// Component
// ============================================================================

export function MarkdownViewer({
  content,
  className,
  isDarkMode = false,
  onContentChange,
}: MarkdownViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { reset: resetCheckboxIndex, getNextIndex } = useCheckboxIndexCounter();

  // 렌더링 전에 인덱스 리셋
  useEffect(() => {
    resetCheckboxIndex();
  }, [content, resetCheckboxIndex]);

  // 렌더링 후 코드 하이라이팅
  useEffect(() => {
    Prism.highlightAll();
  }, [content]);

  // 체크박스 토글 핸들러
  const handleCheckboxChange = useCallback(
    (checkboxIndex: number, newChecked: boolean) => {
      if (!onContentChange) return;

      // 스크롤 위치 저장
      const scrollContainer = containerRef.current?.closest('.overflow-y-auto');
      const scrollTop = scrollContainer?.scrollTop ?? 0;

      // 마크다운에서 해당 인덱스의 체크박스 토글
      let currentIndex = 0;
      const newContent = content.replace(
        TASK_LIST_REGEX,
        (match, prefix: string, _state: string) => {
          if (currentIndex === checkboxIndex) {
            currentIndex++;
            const newState = newChecked ? 'x' : ' ';
            return `${prefix}[${newState}]`;
          }
          currentIndex++;
          return match;
        }
      );

      if (newContent !== content) {
        onContentChange(newContent);

        // 스크롤 위치 복원
        requestAnimationFrame(() => {
          if (scrollContainer) {
            scrollContainer.scrollTop = scrollTop;
          }
        });
      }
    },
    [content, onContentChange]
  );

  // react-markdown 컴포넌트 오버라이드
  const components = useMemo(() => {
    // 렌더링 시작 시 인덱스 리셋
    resetCheckboxIndex();

    return {
      // 체크박스 input을 커스텀 컴포넌트로 교체
      input: (props: React.InputHTMLAttributes<HTMLInputElement>) => {
        if (props.type === 'checkbox') {
          const index = getNextIndex();
          return (
            <TaskCheckbox
              checked={props.checked}
              index={index}
              disabled={!onContentChange}
              onChange={handleCheckboxChange}
            />
          );
        }
        return <input {...props} />;
      },
      // task-list-item li 스타일링
      li: ({
        className: liClassName,
        children,
        ...props
      }: React.LiHTMLAttributes<HTMLLIElement> & { className?: string }) => {
        // task-list-item 클래스가 있으면 특별 스타일 적용
        const isTaskItem = liClassName?.includes('task-list-item');

        return (
          <li
            className={cn(
              liClassName,
              isTaskItem && [
                '!list-none',
                '!pl-0',
                '!ml-0',
                'flex items-start gap-2',
              ]
            )}
            {...props}
          >
            {children}
          </li>
        );
      },
      // 코드 블록에 언어 클래스 추가
      code: ({
        className: codeClassName,
        children,
        ...props
      }: React.HTMLAttributes<HTMLElement> & { className?: string }) => {
        // inline code vs code block 구분
        const match = /language-(\w+)/.exec(codeClassName || '');
        const isInline = !match;

        if (isInline) {
          return (
            <code className={codeClassName} {...props}>
              {children}
            </code>
          );
        }

        return (
          <code
            className={cn(codeClassName, `language-${match[1]}`)}
            {...props}
          >
            {children}
          </code>
        );
      },
    };
  }, [resetCheckboxIndex, getNextIndex, onContentChange, handleCheckboxChange]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'markdown-viewer w-full',
        PROSE_CLASSES,
        isDarkMode && 'prose-invert',
        className
      )}
      role="article"
      aria-label="마크다운 콘텐츠"
    >
      <Markdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </Markdown>
    </div>
  );
}
