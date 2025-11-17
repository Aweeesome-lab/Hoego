import { Sparkles, Loader2 } from 'lucide-react';
import React from 'react';
import remarkGfm from 'remark-gfm';

import type { AiSummaryEntry } from '@/lib/tauri';
import type { PipelineStage } from '@/store';
import type { Components } from 'react-markdown';

import { Response } from '@/components/ai/response';
import { ThinkingIndicator } from '@/components/ai/thinking';
import { MemoizedReactMarkdown } from '@/components/markdown';

interface AiPanelProps {
  isDarkMode: boolean;
  isAiPanelExpanded: boolean;
  isPipelineRunning: boolean;
  pipelineStage: PipelineStage;
  streamingAiText: string;
  summariesError: string | null;
  aiSummaries: AiSummaryEntry[];
  selectedSummary: AiSummaryEntry | null;
  markdownComponents: Components;
  // Unified pipeline handler
  handleRunPipeline: () => void;
}

export const AiPanel = React.memo(function AiPanel({
  isDarkMode,
  isAiPanelExpanded,
  isPipelineRunning,
  pipelineStage,
  streamingAiText,
  summariesError,
  aiSummaries,
  selectedSummary,
  markdownComponents,
  handleRunPipeline,
}: AiPanelProps) {
  if (!isAiPanelExpanded) return null;

  // Get button label based on pipeline stage
  const getButtonLabel = () => {
    switch (pipelineStage) {
      case 'analyzing':
        return '분석 중...';
      case 'done':
        return 'AI 피드백';
      case 'error':
        return 'AI 피드백 (재시도)';
      default:
        return 'AI 피드백';
    }
  };

  return (
    <section
      className={`flex flex-1 flex-col overflow-hidden border-r ${
        isDarkMode
          ? 'bg-[#111625] text-slate-100 border-white/10'
          : 'bg-white text-slate-900 border-slate-200'
      }`}
    >
      <div className="flex h-12 items-center justify-between border-b border-slate-200/20 px-3.5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.25em]">
          정리하기(feedback)
        </span>
        <div className="flex items-center gap-2">
          {/* Unified AI Pipeline Button */}
          <button
            onClick={handleRunPipeline}
            disabled={isPipelineRunning}
            title={getButtonLabel()}
            className={`rounded-full p-2 transition-colors border ${
              isDarkMode
                ? 'border-white/20 hover:bg-white/10 text-slate-300 hover:text-slate-100 hover:border-white/30 disabled:text-slate-600 disabled:border-white/10 disabled:cursor-not-allowed'
                : 'border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 hover:border-slate-300 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed'
            }`}
          >
            {isPipelineRunning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-3.5 py-3">
        <div className="space-y-4">
          {isPipelineRunning ? (
            <Response isDarkMode={isDarkMode}>
              {streamingAiText ? (
                <MemoizedReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={markdownComponents}
                >
                  {streamingAiText}
                </MemoizedReactMarkdown>
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
                  isDarkMode ? 'text-slate-200' : 'text-slate-500'
                }`}
              >
                오늘 작성된 AI 피드백이 없습니다. "AI 피드백" 버튼을 눌러 요약을
                생성해보세요.
              </p>
            </Response>
          ) : (
            <Response isDarkMode={isDarkMode}>
              <MemoizedReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {selectedSummary?.content?.trim() || '요약 내용이 없습니다.'}
              </MemoizedReactMarkdown>
            </Response>
          )}
        </div>
      </div>
    </section>
  );
});
