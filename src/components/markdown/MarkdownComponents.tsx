import * as Checkbox from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import {
  oneDark,
  oneLight,
} from 'react-syntax-highlighter/dist/esm/styles/prism';

import { LinkPreviewCard } from './LinkPreviewCard';

import type { ListItem } from 'mdast';
import type { Components } from 'react-markdown';

interface UseMarkdownComponentsProps {
  isDarkMode: boolean;
  isSaving: boolean;
  handleTaskCheckboxToggle: (
    listItem: ListItem,
    nextChecked: boolean
  ) => Promise<void>;
}

export function useMarkdownComponents({
  isDarkMode,
  isSaving,
  handleTaskCheckboxToggle,
}: UseMarkdownComponentsProps): Components {
  return React.useMemo<Components>(
    () => ({
      // Typography - H1~H6 크기 차별화
      h1: ({ children, ...props }) => (
        <h1
          {...props}
          className={`mb-4 mt-6 first:mt-0 text-xl font-bold leading-tight ${
            isDarkMode ? 'text-slate-100' : 'text-slate-900'
          }`}
        >
          {children}
        </h1>
      ),
      h2: ({ children, ...props }) => (
        <h2
          {...props}
          className={`mb-3 mt-5 first:mt-0 text-lg font-semibold leading-snug ${
            isDarkMode ? 'text-slate-100' : 'text-slate-800'
          }`}
        >
          {children}
        </h2>
      ),
      h3: ({ children, ...props }) => (
        <h3
          {...props}
          className={`mb-2 mt-4 first:mt-0 text-base font-semibold leading-normal ${
            isDarkMode ? 'text-slate-200' : 'text-slate-800'
          }`}
        >
          {children}
        </h3>
      ),
      h4: ({ children, ...props }) => (
        <h4
          {...props}
          className={`mb-2 mt-3 first:mt-0 text-sm font-semibold leading-normal ${
            isDarkMode ? 'text-slate-200' : 'text-slate-700'
          }`}
        >
          {children}
        </h4>
      ),
      h5: ({ children, ...props }) => (
        <h5
          {...props}
          className={`mb-1 mt-3 first:mt-0 text-[13px] font-semibold leading-normal ${
            isDarkMode ? 'text-slate-300' : 'text-slate-700'
          }`}
        >
          {children}
        </h5>
      ),
      h6: ({ children, ...props }) => (
        <h6
          {...props}
          className={`mb-1 mt-2 first:mt-0 text-xs font-medium leading-normal ${
            isDarkMode ? 'text-slate-400' : 'text-slate-600'
          }`}
        >
          {children}
        </h6>
      ),
      ul: ({ children, node, ...props }) => {
        // Check if this is a task list (contains task list items)
        const nodeChildren = (node as unknown as { children?: ListItem[] })
          ?.children;
        const isTaskList =
          Array.isArray(nodeChildren) &&
          nodeChildren.some((child) => typeof child?.checked === 'boolean');
        return (
          <ul
            {...props}
            className={
              isTaskList
                ? 'mb-2 ml-0 list-none text-[13px] leading-relaxed break-words space-y-1'
                : 'mb-2 ml-5 list-disc text-[13px] leading-relaxed break-words marker:text-slate-400 space-y-1'
            }
            style={{ marginTop: 0, paddingLeft: 0 }}
          >
            {children}
          </ul>
        );
      },
      ol: ({ children, ...props }) => (
        <ol
          {...props}
          className="mb-2 ml-5 list-decimal text-[13px] leading-normal break-words marker:text-slate-400"
          style={{ marginTop: 0 }}
        >
          {children}
        </ol>
      ),
      li: ({ node, children, ...props }) => {
        const listItem = node as unknown as ListItem | undefined;
        const liStyle = { marginTop: '2px', marginBottom: '2px' };

        // Task list item (has checkbox)
        if (typeof listItem?.checked === 'boolean') {
          const isChecked = Boolean(listItem.checked);

          return (
            <li
              {...props}
              className="task-list-item !list-none !ml-0 !pl-0 flex items-start gap-2.5 leading-relaxed text-[13px] break-words transition-opacity duration-150"
              style={{ ...liStyle, listStyle: 'none', paddingLeft: 0 }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <Checkbox.Root
                className={`mt-[3px] flex h-[18px] w-[18px] min-w-[18px] flex-shrink-0 items-center justify-center rounded-[4px] border-[1.5px] transition-all duration-200 cursor-pointer ${
                  isDarkMode
                    ? 'border-slate-500 bg-slate-800/60 data-[state=checked]:border-emerald-400 data-[state=checked]:bg-gradient-to-br data-[state=checked]:from-emerald-500 data-[state=checked]:to-emerald-600 data-[state=checked]:shadow-lg data-[state=checked]:shadow-emerald-500/25'
                    : 'border-slate-300 bg-white shadow-sm data-[state=checked]:border-emerald-500 data-[state=checked]:bg-gradient-to-br data-[state=checked]:from-emerald-500 data-[state=checked]:to-emerald-600 data-[state=checked]:shadow-lg data-[state=checked]:shadow-emerald-500/20'
                } ${
                  isSaving
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:border-emerald-400 hover:scale-105 active:scale-95 data-[state=checked]:hover:shadow-emerald-500/40'
                }`}
                checked={isChecked}
                disabled={isSaving}
                onCheckedChange={(value) => {
                  const nextChecked = value === true;
                  if (nextChecked !== isChecked && !isSaving) {
                    void handleTaskCheckboxToggle(listItem, nextChecked);
                  }
                }}
                onClick={(e) => {
                  // Prevent double-triggering
                  e.stopPropagation();
                }}
                aria-label={isChecked ? '작업 완료됨' : '작업 미완료'}
                aria-checked={isChecked}
              >
                <Checkbox.Indicator className="animate-in zoom-in-75 duration-150">
                  <Check
                    className="h-3.5 w-3.5 text-white drop-shadow-sm"
                    strokeWidth={3}
                  />
                </Checkbox.Indicator>
              </Checkbox.Root>
              <span
                className={`flex-1 select-text break-words transition-all duration-200 ${
                  isChecked
                    ? `line-through decoration-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`
                    : isDarkMode
                      ? 'text-slate-200'
                      : 'text-slate-700'
                }`}
              >
                {children}
              </span>
            </li>
          );
        }

        // Regular list item
        return (
          <li
            {...props}
            className="leading-relaxed text-[13px] break-words"
            style={liStyle}
          >
            {children}
          </li>
        );
      },
      p: ({ children, ...props }) => (
        <p {...props} className="mb-3 text-[13px] leading-relaxed break-words">
          {children}
        </p>
      ),
      a: ({ children, href, ...props }) => {
        // Check if it's a standalone link (should show preview card)
        const isStandaloneLink =
          href &&
          typeof children === 'string' &&
          children === href &&
          href.match(/^https?:\/\//);

        if (isStandaloneLink) {
          return (
            <LinkPreviewCard href={href} isDarkMode={isDarkMode}>
              {children}
            </LinkPreviewCard>
          );
        }

        // Regular inline link
        return (
          <a
            {...props}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-500 underline decoration-sky-500/50 underline-offset-2 hover:text-sky-400 break-all"
          >
            {children}
          </a>
        );
      },
      code: ({ className, children, ...props }) => {
        // 인라인 코드: className이 없거나 language- 프리픽스가 없으면 인라인
        const isInline = !className || !className.includes('language-');

        if (isInline) {
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

        const match = /language-(\w+)/.exec(className || '');
        const language = match ? match[1] : '';
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
      },
      blockquote: ({ children, ...props }) => {
        // 전체 텍스트 추출해서 callout 타입 감지
        const extractText = (node: React.ReactNode): string => {
          if (typeof node === 'string') return node;
          if (Array.isArray(node)) return node.map(extractText).join('');
          if (React.isValidElement(node)) {
            const props = node.props as { children?: React.ReactNode };
            return extractText(props.children);
          }
          return '';
        };

        const fullText = extractText(children);
        let calloutType: 'note' | 'warning' | 'tip' | 'info' | 'default' =
          'default';

        if (/^Note:/i.test(fullText)) calloutType = 'note';
        else if (/^Warning:/i.test(fullText)) calloutType = 'warning';
        else if (/^Tip:/i.test(fullText)) calloutType = 'tip';
        else if (/^Info:/i.test(fullText)) calloutType = 'info';

        const styles = {
          note: isDarkMode
            ? 'border-blue-400 bg-blue-900/30 text-blue-100'
            : 'border-blue-400 bg-blue-50 text-blue-900',
          warning: isDarkMode
            ? 'border-amber-400 bg-amber-900/30 text-amber-100'
            : 'border-amber-400 bg-amber-50 text-amber-900',
          tip: isDarkMode
            ? 'border-emerald-400 bg-emerald-900/30 text-emerald-100'
            : 'border-emerald-400 bg-emerald-50 text-emerald-900',
          info: isDarkMode
            ? 'border-purple-400 bg-purple-900/30 text-purple-100'
            : 'border-purple-400 bg-purple-50 text-purple-900',
          default: isDarkMode
            ? 'border-slate-500 bg-slate-800/40 text-slate-200'
            : 'border-slate-300 bg-slate-50 text-slate-700',
        };

        return (
          <blockquote
            {...props}
            className={`my-3 border-l-4 pl-4 pr-3 py-2 rounded-r text-[13px] break-words ${styles[calloutType]}`}
          >
            {children}
          </blockquote>
        );
      },
      table: ({ children, ...props }) => (
        <div className="my-4 overflow-x-auto max-w-full rounded-lg border border-slate-200/30">
          <table
            {...props}
            className={`w-full border-collapse text-[13px] leading-relaxed break-words ${
              isDarkMode ? 'text-slate-200' : 'text-slate-800'
            }`}
          >
            {children}
          </table>
        </div>
      ),
      thead: ({ children, ...props }) => (
        <thead
          {...props}
          className={
            isDarkMode
              ? 'bg-white/5 text-slate-100'
              : 'bg-slate-100 text-slate-900'
          }
        >
          {children}
        </thead>
      ),
      tbody: ({ children, ...props }) => <tbody {...props}>{children}</tbody>,
      th: ({ children, ...props }) => (
        <th
          {...props}
          className="border-b border-slate-200/30 px-4 py-3 text-left text-[13px] font-semibold break-words"
        >
          {children}
        </th>
      ),
      td: ({ children, ...props }) => (
        <td
          {...props}
          className="border-b border-slate-200/20 px-4 py-3 align-top text-[13px] break-words"
        >
          {children}
        </td>
      ),
      del: ({ children, ...props }) => (
        <del className="text-slate-400 line-through decoration-2" {...props}>
          {children}
        </del>
      ),
      strong: ({ children, ...props }) => (
        <strong
          {...props}
          className={`font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}
        >
          {children}
        </strong>
      ),
      em: ({ children, ...props }) => (
        <em {...props} className="italic">
          {children}
        </em>
      ),
      hr: ({ ...props }) => (
        <hr
          {...props}
          className={`my-6 border-t ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}
        />
      ),
    }),
    [handleTaskCheckboxToggle, isDarkMode, isSaving]
  );
}
