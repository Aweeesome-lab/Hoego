/**
 * Markdown 컴포넌트 매핑 Hook
 *
 * 표준 @tailwindcss/typography prose 스타일을 기본으로 사용하고,
 * 특수 기능이 필요한 요소만 커스텀 컴포넌트로 오버라이드
 */

import React, { useMemo } from 'react';

import type { MarkdownComponents } from '../types';

// 특수 기능이 필요한 컴포넌트만 import
import { Code } from '../components/Code';
import { Mermaid } from '../components/Mermaid';
import { TaskListItem } from '../components/TaskList';

interface UseComponentsOptions {
  isDarkMode?: boolean;
  onContentChange?: (content: string) => void;
}

/**
 * React-Markdown 커스텀 컴포넌트 매핑
 *
 * - 대부분의 요소: prose 클래스로 자동 스타일링
 * - 특수 기능만 커스텀: TaskList, Code, Mermaid
 */
export function useComponents({
  isDarkMode = false,
  onContentChange,
}: UseComponentsOptions = {}): MarkdownComponents {
  return useMemo<MarkdownComponents>(
    () => ({
      // Task list container (ul 요소에 contains-task-list 클래스 전달)
      ul: (props: any) => {
        const className = props.className || '';
        const isTaskList = className.includes('contains-task-list');

        if (isTaskList) {
          // Task list는 명시적으로 클래스 전달
          return React.createElement(
            'ul',
            { className: 'contains-task-list' },
            props.children
          );
        }

        // 일반 리스트는 prose 기본 스타일 사용
        return React.createElement('ul', props, props.children);
      },

      // Task list 아이템 (체크박스 토글 기능)
      li: (props: any) => {
        const isTaskList = props.checked !== undefined && props.checked !== null;
        if (isTaskList) {
          return TaskListItem({ ...props, isDarkMode });
        }
        // 일반 리스트는 prose 기본 스타일 사용
        return React.createElement('li', props, props.children);
      },

      // 코드 블록 (syntax highlighting)
      code: (props) => {
        return Code({ ...props, isDarkMode });
      },

      // Mermaid 다이어그램 처리
      pre: (props) => {
        const child = props.children;
        if (
          child &&
          typeof child === 'object' &&
          'type' in child &&
          child.type === 'code'
        ) {
          const codeProps = (child as any).props;
          const className = codeProps?.className || '';
          const language = className.replace('language-', '');

          if (language === 'mermaid') {
            const code = String(codeProps.children || '').trim();
            return Mermaid({ chart: code, isDarkMode });
          }
        }
        // 일반 pre는 prose 기본 스타일 사용
        return React.createElement('pre', props, props.children);
      },
    }),
    [isDarkMode, onContentChange],
  );
}
