import React from "react";
import type { Components } from "react-markdown";
import type { ListItem, Code, InlineCode } from "mdast";
import * as Checkbox from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";

interface UseMarkdownComponentsProps {
  isDarkMode: boolean;
  isSaving: boolean;
  handleTaskCheckboxToggle: (listItem: ListItem, nextChecked: boolean) => Promise<void>;
}

export function useMarkdownComponents({
  isDarkMode,
  isSaving,
  handleTaskCheckboxToggle,
}: UseMarkdownComponentsProps): Components {
  return React.useMemo<Components>(
    () => ({
      // 전체적으로 폰트 크기 축소
      h1: ({ node, children, ...props }) => (
        <h1
          {...props}
          className={`mb-3 text-base font-semibold ${
            isDarkMode ? "text-slate-100" : "text-slate-900"
          }`}
        >
          {children}
        </h1>
      ),
      h2: ({ node, children, ...props }) => (
        <h2
          {...props}
          className={`mb-2 mt-3 text-sm font-semibold ${
            isDarkMode ? "text-slate-200" : "text-slate-800"
          }`}
        >
          {children}
        </h2>
      ),
      h3: ({ node, children, ...props }) => (
        <h3
          {...props}
          className={`mb-1.5 mt-2 text-xs font-semibold ${
            isDarkMode ? "text-slate-200" : "text-slate-800"
          }`}
        >
          {children}
        </h3>
      ),
      ul: ({ node, children, ...props }) => (
        <ul
          {...props}
          className="mb-1.5 ml-4 list-disc space-y-0.5 text-[13px] leading-5"
        >
          {children}
        </ul>
      ),
      ol: ({ node, children, ...props }) => (
        <ol
          {...props}
          className="mb-1.5 ml-4 list-decimal space-y-0.5 text-[13px] leading-5"
        >
          {children}
        </ol>
      ),
      li: ({ node, children, ...props }) => {
        const listItem = node as unknown as ListItem | undefined;
        if (typeof listItem?.checked === "boolean") {
          return (
            <li
              {...props}
              className="flex items-start gap-2 leading-5 text-[13px]"
              style={{ listStyle: "none" }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <Checkbox.Root
                className={`mt-1 flex h-4 w-4 items-center justify-center rounded border text-xs transition ${
                  isDarkMode
                    ? "border-white/20 bg-white/5 data-[state=checked]:border-emerald-300 data-[state=checked]:bg-emerald-500/20"
                    : "border-slate-300 bg-white data-[state=checked]:border-emerald-500 data-[state=checked]:bg-emerald-500/15"
                } ${isSaving ? "opacity-60" : ""}`}
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
                      isDarkMode ? "text-emerald-300" : "text-emerald-600"
                    }`}
                    strokeWidth={3}
                  />
                </Checkbox.Indicator>
              </Checkbox.Root>
              <div className="flex-1 select-text">{children}</div>
            </li>
          );
        }
        return (
          <li {...props} className="leading-5 text-[13px]">
            {children}
          </li>
        );
      },
      p: ({ node, children, ...props }) => (
        <p {...props} className="mb-1.5 text-[13px] leading-5">
          {children}
        </p>
      ),
      a: ({ node, children, href, ...props }) => (
        <a
          {...props}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sky-500 underline decoration-sky-500/50 underline-offset-2 hover:text-sky-400"
        >
          {children}
        </a>
      ),
      code: ({ node, className, children, ...props }) => {
        const codeNode = node as unknown as Code | InlineCode | undefined;
        const isInline = codeNode?.type === "inlineCode";
        if (isInline) {
          return (
            <code
              {...props}
              className={`rounded bg-slate-900/10 px-1.5 py-0.5 text-[11px] ${
                isDarkMode ? "bg-slate-50/10 text-slate-100" : ""
              }`}
            >
              {children}
            </code>
          );
        }
        const language = className || "";
        return (
          <pre
            className={`my-3 overflow-x-auto rounded-md bg-slate-900/80 p-3 text-xs text-slate-100 ${
              !isDarkMode ? "bg-slate-900/90" : ""
            }`}
          >
            <code className={language} {...props}>
              {children}
            </code>
          </pre>
        );
      },
      blockquote: ({ node, children, ...props }) => (
        <blockquote
          {...props}
          className={`my-3 border-l-2 pl-3 ${
            isDarkMode
              ? "border-slate-500 text-slate-200"
              : "border-slate-300 text-slate-700"
          }`}
        >
          {children}
        </blockquote>
      ),
      table: ({ node, children, ...props }) => (
        <div className="my-3 overflow-x-auto">
          <table
            {...props}
            className={`w-full border-collapse text-[13px] leading-5 ${
              isDarkMode ? "text-slate-200" : "text-slate-800"
            }`}
          >
            {children}
          </table>
        </div>
      ),
      thead: ({ node, children, ...props }) => (
        <thead
          {...props}
          className={isDarkMode ? "bg-white/5 text-slate-100" : "bg-slate-100"}
        >
          {children}
        </thead>
      ),
      tbody: ({ node, children, ...props }) => (
        <tbody {...props}>{children}</tbody>
      ),
      th: ({ node, children, ...props }) => (
        <th
          {...props}
          className="border border-slate-200/30 px-3 py-2 text-left text-[13px] font-semibold"
        >
          {children}
        </th>
      ),
      td: ({ node, children, ...props }) => (
        <td
          {...props}
          className="border border-slate-200/30 px-3 py-2 align-top text-[13px]"
        >
          {children}
        </td>
      ),
      del: ({ node, children, ...props }) => (
        <del className="text-slate-400 decoration-2" {...props}>
          {children}
        </del>
      ),
    }),
    [handleTaskCheckboxToggle, isDarkMode, isSaving]
  );
}
