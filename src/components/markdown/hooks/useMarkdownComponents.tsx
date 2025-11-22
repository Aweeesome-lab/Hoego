import React, { isValidElement, useMemo } from 'react';

import {
  HeadingRenderer,
  ParagraphRenderer,
  StrongRenderer,
  EmRenderer,
  DelRenderer,
  HrRenderer,
  UnorderedListRenderer,
  OrderedListRenderer,
  ListItemRenderer,
  TaskListItemRenderer,
  CodeRenderer,
  BlockquoteRenderer,
  TableRenderer,
  TableHeaderRenderer,
  TableBodyRenderer,
  TableRowRenderer,
  TableHeaderCellRenderer,
  TableDataCellRenderer,
  LinkRenderer,
  ImageRenderer,
} from '../renderers';
import {
  FootnoteReferenceRenderer,
  FootnoteDefinitionRenderer,
} from '../renderers/FootnoteRenderer';

import type { TaskListItem } from '../types';
import type { Components } from 'react-markdown';
import type { Position } from 'unist';

interface UseMarkdownComponentsOptions {
  isDarkMode: boolean;
  isSaving?: boolean;
  onTaskToggle?: (position: Position, checked: boolean) => Promise<void>;
}

/**
 * 마크다운 렌더링에 사용할 Components 객체를 생성하는 훅
 *
 * 모든 렌더러를 조합하여 react-markdown에 전달할 Components를 반환합니다.
 * - 각 렌더러에 필요한 props 전달
 * - Task list 체크박스 토글 핸들러 연결
 * - 다크모드 지원
 *
 * @param options.isDarkMode - 다크모드 여부
 * @param options.isSaving - 저장 중 상태
 * @param options.onTaskToggle - Task list 체크박스 토글 핸들러
 */
export function useMarkdownComponents({
  isDarkMode,
  isSaving = false,
  onTaskToggle,
}: UseMarkdownComponentsOptions): Components {
  return useMemo(
    () => ({
      // Headings
      h1: ({ children }) => (
        <HeadingRenderer level={1} isDarkMode={isDarkMode}>
          {children}
        </HeadingRenderer>
      ),
      h2: ({ children }) => (
        <HeadingRenderer level={2} isDarkMode={isDarkMode}>
          {children}
        </HeadingRenderer>
      ),
      h3: ({ children }) => (
        <HeadingRenderer level={3} isDarkMode={isDarkMode}>
          {children}
        </HeadingRenderer>
      ),
      h4: ({ children }) => (
        <HeadingRenderer level={4} isDarkMode={isDarkMode}>
          {children}
        </HeadingRenderer>
      ),
      h5: ({ children }) => (
        <HeadingRenderer level={5} isDarkMode={isDarkMode}>
          {children}
        </HeadingRenderer>
      ),
      h6: ({ children }) => (
        <HeadingRenderer level={6} isDarkMode={isDarkMode}>
          {children}
        </HeadingRenderer>
      ),

      // Text elements
      p: ({ children }) => (
        <ParagraphRenderer isDarkMode={isDarkMode}>
          {children}
        </ParagraphRenderer>
      ),
      strong: ({ children }) => (
        <StrongRenderer isDarkMode={isDarkMode}>{children}</StrongRenderer>
      ),
      em: ({ children }) => <EmRenderer>{children}</EmRenderer>,
      del: ({ children }) => <DelRenderer>{children}</DelRenderer>,
      hr: () => <HrRenderer isDarkMode={isDarkMode} />,

      // Lists
      ul: ({ children }) => {
        // Task list 감지
        const childArray = Array.isArray(children) ? children : [children];
        const isTaskList = childArray.some((child) => {
          if (isValidElement(child)) {
            const props = child.props as { node?: { checked?: boolean } };
            return props.node?.checked !== undefined;
          }
          return false;
        });

        return (
          <UnorderedListRenderer
            isDarkMode={isDarkMode}
            isTaskList={isTaskList}
          >
            {children}
          </UnorderedListRenderer>
        );
      },
      ol: ({ children }) => (
        <OrderedListRenderer isDarkMode={isDarkMode}>
          {children}
        </OrderedListRenderer>
      ),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      li: ({ children, node, ...props }: any) => {
        const listItem = node as unknown as TaskListItem;

        // Method 1: Check props.checked (react-markdown v8+)
        const { checked } = props;
        let isTaskList = checked !== null && checked !== undefined;
        let isChecked = Boolean(checked);

        // Method 2: Check node properties (remark-gfm adds to AST)
        if (!isTaskList && listItem.checked !== undefined) {
          isTaskList = true;
          isChecked = Boolean(listItem.checked);
        }

        // Method 3: Check children for checkbox (fallback)
        if (!isTaskList) {
          const childArray = React.Children.toArray(children);
          const checkboxChild = childArray.find((child) => {
            if (React.isValidElement(child) && child.type === 'input') {
              const childProps = child.props as any;
              return childProps.type === 'checkbox';
            }
            return false;
          });

          if (checkboxChild && React.isValidElement(checkboxChild)) {
            isTaskList = true;
            const checkboxProps = checkboxChild.props as any;
            isChecked = Boolean(checkboxProps.checked);
          }
        }

        if (isTaskList) {
          return (
            <TaskListItemRenderer
              checked={isChecked}
              onToggle={async () => {
                if (onTaskToggle && listItem.position) {
                  await onTaskToggle(listItem.position, !isChecked);
                }
              }}
              isDarkMode={isDarkMode}
              disabled={isSaving}
            >
              {children}
            </TaskListItemRenderer>
          );
        }

        // Regular list item
        return <ListItemRenderer>{children}</ListItemRenderer>;
      },

      // DON'T override input - let it render so li can detect it in children
      // TaskListItemRenderer will filter it out later

      // Code
      code: ({ children, className }) => {
        const match = /language-(\w+)/.exec(className || '');
        const language = match ? match[1] : undefined;
        const inline = !className;

        return (
          <CodeRenderer
            language={language}
            inline={inline}
            isDarkMode={isDarkMode}
          >
            {String(children).replace(/\n$/, '')}
          </CodeRenderer>
        );
      },

      // Blockquote
      blockquote: ({ children }) => (
        <BlockquoteRenderer isDarkMode={isDarkMode}>
          {children}
        </BlockquoteRenderer>
      ),

      // Table
      table: ({ children }) => (
        <TableRenderer isDarkMode={isDarkMode}>{children}</TableRenderer>
      ),
      thead: ({ children }) => (
        <TableHeaderRenderer isDarkMode={isDarkMode}>
          {children}
        </TableHeaderRenderer>
      ),
      tbody: ({ children }) => (
        <TableBodyRenderer>{children}</TableBodyRenderer>
      ),
      tr: ({ children }) => (
        <TableRowRenderer isDarkMode={isDarkMode}>{children}</TableRowRenderer>
      ),
      th: ({ children }) => (
        <TableHeaderCellRenderer isDarkMode={isDarkMode}>
          {children}
        </TableHeaderCellRenderer>
      ),
      td: ({ children }) => (
        <TableDataCellRenderer isDarkMode={isDarkMode}>
          {children}
        </TableDataCellRenderer>
      ),

      // Links and Images
      a: ({ children, href }) => (
        <LinkRenderer href={href} isDarkMode={isDarkMode}>
          {children}
        </LinkRenderer>
      ),
      img: (props) => <ImageRenderer isDarkMode={isDarkMode} {...props} />,

      // Footnotes
      sup: ({ children, ...props }) => {
        // Check if this is a footnote reference (has data-footnote-ref attribute)
        if ('data-footnote-ref' in props || props.id?.startsWith('fnref-')) {
          return (
            <FootnoteReferenceRenderer isDarkMode={isDarkMode} {...props}>
              {children}
            </FootnoteReferenceRenderer>
          );
        }
        // Regular superscript
        return <sup {...props}>{children}</sup>;
      },
      section: ({ children, ...props }) => {
        // Check if this is the footnotes section
        if ('data-footnotes' in props) {
          return (
            <FootnoteDefinitionRenderer isDarkMode={isDarkMode} {...props}>
              {children}
            </FootnoteDefinitionRenderer>
          );
        }
        // Regular section
        return <section {...props}>{children}</section>;
      },
    }),
    [isDarkMode, isSaving, onTaskToggle]
  );
}
