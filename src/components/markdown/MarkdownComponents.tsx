import * as Checkbox from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

import type { ListItem } from 'mdast';
import type { Components } from 'react-markdown';
import { LinkPreviewCard } from './LinkPreviewCard';

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
      ul: ({ children, ...props }) => (
        <ul
          {...props}
          className="mb-2 ml-5 list-disc text-[13px] leading-normal break-words marker:text-slate-400"
        >
          {children}
        </ul>
      ),
      ol: ({ children, ...props }) => (
        <ol
          {...props}
          className="mb-2 ml-5 list-decimal text-[13px] leading-normal break-words marker:text-slate-400"
        >
          {children}
        </ol>
      ),
      li: ({ node, children, ...props }) => {
        const listItem = node as unknown as ListItem | undefined;
        if (typeof listItem?.checked === 'boolean') {
          return (
            <li
              {...props}
              className="!list-none !-ml-5 flex items-start gap-2 leading-normal text-[13px] break-words"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <Checkbox.Root
                className={`mt-[3px] flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition cursor-pointer ${
                  isDarkMode
                    ? 'border-white/30 bg-white/5 data-[state=checked]:border-emerald-400 data-[state=checked]:bg-emerald-500/30'
                    : 'border-slate-300 bg-white data-[state=checked]:border-emerald-500 data-[state=checked]:bg-emerald-100'
                } ${isSaving ? 'opacity-60' : 'hover:border-emerald-400'}`}
                checked={Boolean(listItem.checked)}
                disabled={isSaving}
                onCheckedChange={(value) => {
                  const next = value === true;
                  if (next !== Boolean(listItem.checked)) {
                    void handleTaskCheckboxToggle(listItem, next);
                  }
                }}
                aria-label="작업 완료 여부"
              >
                <Checkbox.Indicator>
                  <Check
                    className={`h-3 w-3 ${
                      isDarkMode ? 'text-emerald-300' : 'text-emerald-600'
                    }`}
                    strokeWidth={3}
                  />
                </Checkbox.Indicator>
              </Checkbox.Root>
              <span
                className={`flex-1 select-text break-words ${
                  listItem.checked ? 'text-slate-400 line-through' : ''
                }`}
              >
                {children}
              </span>
            </li>
          );
        }
        return (
          <li {...props} className="leading-normal text-[13px] break-words">
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
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
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
        let calloutType: 'note' | 'warning' | 'tip' | 'info' | 'default' = 'default';

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
