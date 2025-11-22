/**
 * Markdown 컴포넌트 매핑 Hook
 */

import React, { useMemo } from 'react';

import type { MarkdownComponents } from '../types';

// Components
import { Blockquote } from '../components/Blockquote';
import { Code } from '../components/Code';
import {
  FootnoteBackReference,
  FootnoteReference,
  FootnoteSection,
} from '../components/Footnote';
import { Heading } from '../components/Heading';
import { Img, Link } from '../components/Link';
import { ListItem, OrderedList, UnorderedList } from '../components/List';
import { Mermaid } from '../components/Mermaid';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '../components/Table';
import { TaskListItem } from '../components/TaskList';
import { Delete, Emphasis, HorizontalRule, Paragraph, Strong } from '../components/Text';

interface UseComponentsOptions {
  isDarkMode?: boolean;
  onContentChange?: (content: string) => void;
}

/**
 * React-Markdown에서 사용할 커스텀 컴포넌트 매핑
 * 각 markdown 요소를 우리의 커스텀 컴포넌트로 연결
 */
export function useComponents({
  isDarkMode = false,
  onContentChange,
}: UseComponentsOptions = {}): MarkdownComponents {
  return useMemo<MarkdownComponents>(
    () => ({
      // Headings
      h1: (props) => {
        return Heading({ ...props, level: 1, isDarkMode });
      },
      h2: (props) => {
        return Heading({ ...props, level: 2, isDarkMode });
      },
      h3: (props) => {
        return Heading({ ...props, level: 3, isDarkMode });
      },
      h4: (props) => {
        return Heading({ ...props, level: 4, isDarkMode });
      },
      h5: (props) => {
        return Heading({ ...props, level: 5, isDarkMode });
      },
      h6: (props) => {
        return Heading({ ...props, level: 6, isDarkMode });
      },

      // Text
      p: (props) => {
        return Paragraph({ ...props, isDarkMode });
      },
      strong: (props) => {
        return Strong(props);
      },
      em: (props) => {
        return Emphasis(props);
      },
      del: (props) => {
        return Delete({ ...props, isDarkMode });
      },
      hr: (props) => {
        return HorizontalRule({ ...props, isDarkMode });
      },

      // Lists
      ul: (props) => {
        return UnorderedList({ ...props, isDarkMode });
      },
      ol: (props) => {
        return OrderedList({ ...props, isDarkMode });
      },
      li: (props: any) => {
        // Task list 아이템인지 확인
        const isTaskList = props.checked !== undefined && props.checked !== null;
        if (isTaskList) {
          return TaskListItem({ ...props, isDarkMode });
        }
        return ListItem({ ...props, isDarkMode });
      },

      // Code
      code: (props) => {
        return Code({ ...props, isDarkMode });
      },

      // Special: Mermaid diagrams
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
        return React.createElement('pre', null, props.children);
      },

      // Links and Images (a태그는 각주에서도 사용하므로 조건 분기)
      a: (props) => {
        const isFootnoteBackRef = (props as any).node?.properties?.className?.includes(
          'footnote-backref',
        );
        if (isFootnoteBackRef) {
          return FootnoteBackReference({ ...props, isDarkMode });
        }
        return Link({ ...props, isDarkMode });
      },
      img: (props) => {
        return Img(props);
      },

      // Blockquote
      blockquote: (props) => {
        return Blockquote({ ...props, isDarkMode });
      },

      // Tables
      table: (props) => {
        return Table({ ...props, isDarkMode });
      },
      thead: (props) => {
        return TableHead({ ...props, isDarkMode });
      },
      tbody: (props) => {
        return TableBody({ ...props, isDarkMode });
      },
      tr: (props) => {
        return TableRow({ ...props, isDarkMode });
      },
      th: (props) => {
        return TableHeaderCell({ ...props, isDarkMode });
      },
      td: (props) => {
        return TableCell({ ...props, isDarkMode });
      },

      // Footnotes
      section: (props) => {
        if ((props as any).node?.properties?.className?.includes('footnotes')) {
          return FootnoteSection({ ...props, isDarkMode });
        }
        return React.createElement('section', null, props.children);
      },
      sup: (props) => {
        const isFootnoteRef = (props as any).node?.properties?.className?.includes(
          'footnote-ref',
        );
        if (isFootnoteRef) {
          return FootnoteReference({ ...props, isDarkMode });
        }
        return React.createElement('sup', null, props.children);
      },
    }),
    [isDarkMode, onContentChange],
  );
}
