import React from "react";
import { createPortal } from "react-dom";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import * as Select from "@radix-ui/react-select";
import remarkGfm from "remark-gfm";
import { Check, ChevronDown, ChevronUp, NotebookPen, Columns } from "lucide-react";
import type { RetrospectPanelProps } from "./types/RetrospectPanelProps";
import { RETROSPECT_VIEW_OPTIONS } from "./constants/retrospect-view-options";

export function RetrospectPanel({
  isDarkMode,
  isRetrospectPanelExpanded,
  retrospectContent,
  setRetrospectContent,
  retrospectRef,
  isSavingRetrospect,
  isTemplatePickerOpen,
  setIsTemplatePickerOpen,
  templateTriggerRef,
  templateDropdownRef,
  templateDropdownPosition,
  retrospectiveTemplates,
  customRetrospectiveTemplates,
  handleApplyRetrospectiveTemplate,
  retrospectViewMode,
  setRetrospectViewMode,
  activeRetrospectViewOption,
  markdownComponents,
}: RetrospectPanelProps) {
  if (!isRetrospectPanelExpanded) return null;

  return (
    <section
      className={`flex flex-1 flex-col overflow-hidden ${
        isDarkMode
          ? "bg-[#0f141f] text-slate-100"
          : "bg-white text-slate-900"
      }`}
    >
      <div className="flex h-12 items-center justify-between border-b border-slate-200/20 px-3.5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em]">
          회고하기(retrospect)
        </span>
        <div className="flex items-center gap-2">
          {isSavingRetrospect && (
            <span
              className={`rounded-full px-3 py-1 text-[10px] ${
                isDarkMode
                  ? "bg-white/10 text-slate-200"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              저장 중
            </span>
          )}
          <div className="flex items-center gap-1.5">
            <button
              ref={templateTriggerRef}
              type="button"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => setIsTemplatePickerOpen((prev) => !prev)}
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-sm transition ${
                isDarkMode
                  ? "border-white/10 bg-[#05070c] text-slate-200 hover:border-white/30"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
              }`}
              title="검증된 회고 템플릿 삽입"
            >
              <NotebookPen className="h-4 w-4" />
              <ChevronDown className="h-3 w-3 opacity-70" />
            </button>
            <Select.Root
              value={retrospectViewMode}
              onValueChange={(value) =>
                setRetrospectViewMode(value as "edit" | "preview" | "split")
              }
            >
              <Select.Trigger
                className={`inline-flex h-8 w-10 items-center justify-center rounded-full border px-2 text-sm transition ${
                  isDarkMode
                    ? "border-white/10 bg-[#05070c] text-slate-200 hover:border-white/30"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
                }`}
                aria-label="회고 보기 모드"
                title="회고 보기 모드"
              >
                <span className="flex items-center justify-center text-current">
                  {activeRetrospectViewOption?.icon ?? (
                    <Columns className="h-4 w-4" />
                  )}
                </span>
              </Select.Trigger>
              <Select.Portal>
                <Select.Content
                  className={`z-50 overflow-hidden rounded-lg border shadow ${
                    isDarkMode
                      ? "border-white/10 bg-[#05070c] text-slate-100"
                      : "border-slate-200 bg-white text-slate-900"
                  }`}
                  position="popper"
                  sideOffset={6}
                >
                  <Select.ScrollUpButton className="flex items-center justify-center p-1">
                    <ChevronUp className="h-3.5 w-3.5 opacity-60" />
                  </Select.ScrollUpButton>
                  <Select.Viewport className="p-1">
                    {RETROSPECT_VIEW_OPTIONS.map((option) => (
                      <Select.Item
                        key={option.value}
                        value={option.value}
                        className={`relative flex cursor-pointer select-none flex-col gap-1 rounded px-3 py-2 text-xs transition hover:bg-slate-100 data-[state=checked]:font-semibold ${
                          isDarkMode ? "hover:bg-white/10" : ""
                        }`}
                      >
                        <Select.ItemText>
                          <span className="inline-flex items-center gap-1 text-xs font-semibold">
                            {option.icon}
                            {option.label}
                          </span>
                        </Select.ItemText>
                        <span
                          className={`text-[11px] ${
                            isDarkMode ? "text-slate-400" : "text-slate-500"
                          }`}
                        >
                          {option.description}
                        </span>
                        <Select.ItemIndicator className="absolute right-2 top-2">
                          <Check className="h-3.5 w-3.5" />
                        </Select.ItemIndicator>
                      </Select.Item>
                    ))}
                  </Select.Viewport>
                  <Select.ScrollDownButton className="flex items-center justify-center p-1">
                    <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                  </Select.ScrollDownButton>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          </div>
        </div>
      </div>
      {isTemplatePickerOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={templateDropdownRef}
            onMouseDown={(e) => e.stopPropagation()}
            className={`fixed z-[9999] overflow-hidden rounded-xl border shadow-xl ${
              isDarkMode
                ? "border-white/10 bg-[#05070c] text-slate-100"
                : "border-slate-200 bg-white text-slate-900"
            }`}
            style={{
              top: templateDropdownPosition.top,
              left: templateDropdownPosition.left,
              width: templateDropdownPosition.width,
            }}
          >
            <div
              className={`border-b px-3 py-2 text-[11px] ${
                isDarkMode
                  ? "border-white/5 text-slate-400"
                  : "border-slate-100 text-slate-500"
              }`}
            >
              <p className="font-semibold uppercase tracking-[0.25em] text-[10px]">
                검증된 회고 템플릿
              </p>
              <p className="tracking-normal">
                KPT · 4Ls · Start/Stop + 커스텀 템플릿
              </p>
            </div>
            <div className="max-h-[360px] overflow-y-auto p-2">
              {retrospectiveTemplates.map((template) => {
                const isCustom = customRetrospectiveTemplates.some(
                  (custom) => custom.id === template.id
                );
                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() =>
                      handleApplyRetrospectiveTemplate(template.id)
                    }
                    className={`mb-2 w-full rounded-lg border px-3 py-2 text-left transition last:mb-0 ${
                      isDarkMode
                        ? "border-white/10 bg-[#080b11] text-slate-100 hover:border-white/30 hover:bg-white/5"
                        : "border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-xs font-semibold">
                          {template.name}
                        </p>
                        <p
                          className={`text-[11px] leading-4 ${
                            isDarkMode
                              ? "text-slate-400"
                              : "text-slate-500"
                          }`}
                        >
                          {template.description}
                        </p>
                      </div>
                      <span className="flex flex-col items-end gap-1">
                        <span
                          className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            isDarkMode
                              ? "bg-white/5 text-slate-200"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {template.focus}
                        </span>
                        {isCustom && (
                          <span
                            className={`whitespace-nowrap rounded-full px-1.5 py-0.5 text-[9px] tracking-wide ${
                              isDarkMode
                                ? "bg-emerald-500/20 text-emerald-300"
                                : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            커스텀
                          </span>
                        )}
                      </span>
                    </div>
                    <div
                      className={`mt-2 rounded-md border px-2 py-1 text-[11px] leading-4 whitespace-pre-line ${
                        isDarkMode
                          ? "border-white/5 bg-[#0f141f] text-slate-200"
                          : "border-slate-200 bg-slate-50 text-slate-600"
                      }`}
                    >
                      {template.example}
                    </div>
                    <div className="mt-2 text-right text-[11px] font-semibold text-sky-500">
                      삽입하기 ↵
                    </div>
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}
      <div className="flex-1 overflow-hidden px-3.5 py-2.5">
        <div
          className={`h-full w-full ${
            retrospectViewMode === "split"
              ? "grid gap-3 lg:grid-cols-2"
              : "flex flex-col"
          }`}
        >
          {retrospectViewMode !== "preview" && (
            <div className="h-full w-full overflow-y-auto">
              <textarea
                ref={retrospectRef}
                value={retrospectContent}
                onChange={(e) => setRetrospectContent(e.target.value)}
                className={`h-full w-full min-h-[260px] resize-none border-0 text-[13px] leading-5 outline-none ${
                  isDarkMode
                    ? "bg-[#05070c] text-slate-100 placeholder:text-slate-500"
                    : "bg-white text-slate-900 placeholder:text-slate-400"
                }`}
                style={{
                  fontFamily:
                    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  padding: 12,
                }}
                placeholder="AI의 피드백을 보고 떠오르는 생각을 자유롭게 적어보세요..."
              />
            </div>
          )}
          {retrospectViewMode !== "edit" && (
            <div
              className={`h-full w-full overflow-y-auto rounded-xl border px-4 py-3 text-[13px] ${
                isDarkMode
                  ? "border-white/10 bg-[#05070c] text-slate-100"
                  : "border-slate-200 bg-slate-50 text-slate-900"
              }`}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {retrospectContent.trim()
                  ? retrospectContent
                  : "## ✍️ 회고 미리보기\n\n템플릿을 삽입하거나 내용을 작성하면 이 영역에서 마크다운이 적용된 회고를 실시간으로 확인할 수 있어요."}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
