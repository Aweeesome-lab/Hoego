import React from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import * as Select from "@radix-ui/react-select";
import remarkGfm from "remark-gfm";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import type { AiSummaryEntry } from "@/lib/tauri";
import { Response } from "@/components/ai/response";
import { ThinkingIndicator } from "@/components/ai/thinking";

interface AiPanelProps {
  isDarkMode: boolean;
  isAiPanelExpanded: boolean;
  isGeneratingAiFeedback: boolean;
  streamingAiText: string;
  summariesError: string | null;
  aiSummaries: AiSummaryEntry[];
  aiSelectValue: string | undefined;
  selectedSummaryIndex: number;
  setSelectedSummaryIndex: (index: number) => void;
  selectedSummary: AiSummaryEntry | null;
  getSummaryLabel: (summary: AiSummaryEntry) => string;
  markdownComponents: Components;
}

export function AiPanel({
  isDarkMode,
  isAiPanelExpanded,
  isGeneratingAiFeedback,
  streamingAiText,
  summariesError,
  aiSummaries,
  aiSelectValue,
  selectedSummaryIndex,
  setSelectedSummaryIndex,
  selectedSummary,
  getSummaryLabel,
  markdownComponents,
}: AiPanelProps) {
  if (!isAiPanelExpanded) return null;

  return (
    <section
      className={`flex flex-1 flex-col overflow-hidden border-r ${
        isDarkMode
          ? "bg-[#111625] text-slate-100 border-white/10"
          : "bg-white text-slate-900 border-slate-200"
      }`}
    >
      <div className="flex h-12 items-center justify-between border-b border-slate-200/20 px-3.5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.25em]">
          정리하기(feedback)
        </span>
        <div className="flex items-center gap-3">
          {aiSummaries.length > 0 && aiSelectValue !== undefined && (
            <Select.Root
              value={aiSelectValue}
              onValueChange={(v) => setSelectedSummaryIndex(Number(v))}
            >
              <Select.Trigger
                className={`inline-flex h-8 items-center justify-between gap-2 rounded-md border px-2.5 text-xs ${
                  isDarkMode
                    ? "border-white/10 bg-[#0a0d13] text-slate-100"
                    : "border-slate-200 bg-white text-slate-700"
                }`}
                aria-label="요약 선택"
              >
                <Select.Value placeholder="버전" />
                <Select.Icon>
                  <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                </Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Content
                  className={`z-50 overflow-hidden rounded-md border bg-white text-slate-800 shadow ${
                    isDarkMode
                      ? "border-white/10 bg-[#0a0d13] text-slate-100"
                      : "border-slate-200 bg-white text-slate-800"
                  }`}
                  position="popper"
                  sideOffset={6}
                >
                  <Select.ScrollUpButton className="flex items-center justify-center p-1">
                    <ChevronUp className="h-3.5 w-3.5 opacity-60" />
                  </Select.ScrollUpButton>
                  <Select.Viewport className="p-1">
                    {aiSummaries.map((summary, index) => (
                      <Select.Item
                        key={summary.path}
                        value={String(index)}
                        className={`relative flex cursor-pointer select-none items-center gap-2 rounded px-2 py-1.5 text-xs outline-none transition hover:bg-slate-100/70 data-[state=checked]:font-semibold ${
                          isDarkMode
                            ? "hover:bg-white/10"
                            : "hover:bg-slate-100"
                        }`}
                      >
                        <Select.ItemText>
                          #{aiSummaries.length - index}{" "}
                          {getSummaryLabel(summary)}
                        </Select.ItemText>
                        <Select.ItemIndicator className="ml-auto">
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
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-3.5 py-3">
        <div className="space-y-4">
          {isGeneratingAiFeedback ? (
            <Response isDarkMode={isDarkMode}>
              {streamingAiText ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={markdownComponents}
                >
                  {streamingAiText}
                </ReactMarkdown>
              ) : (
                <ThinkingIndicator isDarkMode={isDarkMode} />
              )}
            </Response>
          ) : summariesError ? (
            <Response isDarkMode={isDarkMode} className="border-red-500/30">
              <p className="text-sm font-semibold text-red-400">
                AI 피드백을 불러오지 못했어요.
              </p>
              <p className="text-xs text-red-300">{summariesError}</p>
            </Response>
          ) : aiSummaries.length === 0 ? (
            <Response isDarkMode={isDarkMode}>
              <p
                className={`text-sm ${
                  isDarkMode ? "text-slate-200" : "text-slate-500"
                }`}
              >
                오늘 작성된 AI 피드백이 없습니다. "AI 피드백" 버튼을 눌러 요약을 생성해보세요.
              </p>
            </Response>
          ) : (
            <Response isDarkMode={isDarkMode}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {selectedSummary?.content?.trim() ||
                  "요약 내용이 없습니다."}
              </ReactMarkdown>
            </Response>
          )}
        </div>
      </div>
    </section>
  );
}
