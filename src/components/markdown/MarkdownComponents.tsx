import * as Checkbox from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import React from 'react';

import type { ListItem, Code, InlineCode } from 'mdast';
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
      // Improved typography with consistent vertical rhythm
      h1: ({ children, ...props }) => (
        <h1
          {...props}
          className={`mb-4 mt-6 first:mt-0 text-base font-semibold leading-tight ${
            isDarkMode ? 'text-slate-100' : 'text-slate-900'
          }`}
        >
          {children}
        </h1>
      ),
      h2: ({ children, ...props }) => (
        <h2
          {...props}
          className={`mb-3 mt-5 first:mt-0 text-sm font-semibold leading-snug ${
            isDarkMode ? 'text-slate-200' : 'text-slate-800'
          }`}
        >
          {children}
        </h2>
      ),
      h3: ({ children, ...props }) => (
        <h3
          {...props}
          className={`mb-2 mt-4 first:mt-0 text-xs font-semibold leading-normal ${
            isDarkMode ? 'text-slate-200' : 'text-slate-800'
          }`}
        >
          {children}
        </h3>
      ),
      ul: ({ children, ...props }) => (
        <ul
          {...props}
          className="mb-3 ml-5 list-disc space-y-1 text-[13px] leading-relaxed break-words marker:text-slate-400"
        >
          {children}
        </ul>
      ),
      ol: ({ children, ...props }) => (
        <ol
          {...props}
          className="mb-3 ml-5 list-decimal space-y-1 text-[13px] leading-relaxed break-words marker:text-slate-400"
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
              className="flex items-start gap-2.5 leading-relaxed text-[13px] break-words"
              style={{ listStyle: 'none', marginLeft: '-1.25rem' }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <Checkbox.Root
                className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border text-xs transition ${
                  isDarkMode
                    ? 'border-white/20 bg-white/5 data-[state=checked]:border-emerald-300 data-[state=checked]:bg-emerald-500/20'
                    : 'border-slate-300 bg-white data-[state=checked]:border-emerald-500 data-[state=checked]:bg-emerald-500/15'
                } ${isSaving ? 'opacity-60' : ''}`}
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
              <div className="flex-1 select-text break-words">{children}</div>
            </li>
          );
        }
        return (
          <li {...props} className="leading-relaxed text-[13px] break-words pl-1">
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
      code: ({ node, className, children, ...props }) => {
        const codeNode = node as unknown as Code | InlineCode | undefined;
        const isInline = codeNode?.type === 'inlineCode';
        if (isInline) {
          return (
            <code
              {...props}
              className={`rounded px-1.5 py-0.5 text-[11px] font-mono break-words ${
                isDarkMode
                  ? 'bg-slate-50/10 text-slate-100'
                  : 'bg-slate-900/10 text-slate-900'
              }`}
            >
              {children}
            </code>
          );
        }
        const language = className || '';
        return (
          <pre
            className={`my-4 overflow-x-auto rounded-lg p-4 text-xs text-slate-100 max-w-full shadow-sm ${
              isDarkMode ? 'bg-slate-900/80' : 'bg-slate-900/90'
            }`}
          >
            <code
              className={`${language} font-mono break-words whitespace-pre-wrap leading-relaxed`}
              {...props}
            >
              {children}
            </code>
          </pre>
        );
      },
      blockquote: ({ children, ...props }) => (
        <blockquote
          {...props}
          className={`my-4 border-l-4 pl-4 py-1 italic break-words ${
            isDarkMode
              ? 'border-slate-600 text-slate-300 bg-slate-800/20'
              : 'border-slate-300 text-slate-700 bg-slate-50'
          }`}
        >
          {children}
        </blockquote>
      ),
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
        <del className="text-slate-400 decoration-2" {...props}>
          {children}
        </del>
      ),
    }),
    [handleTaskCheckboxToggle, isDarkMode, isSaving]
  );
}
