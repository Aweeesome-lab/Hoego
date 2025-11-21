import { Sparkles, Loader2, Shield, Square } from 'lucide-react';
import React from 'react';

import type { AiSummaryEntry } from '@/lib/tauri';
import type { PipelineStage } from '@/store';

import { Response } from '@/components/ai/response';
import { ThinkingIndicator } from '@/components/ai/thinking';
import { MarkdownRenderer } from '@/components/markdown';
import { ModelSelector } from '@/components/ModelSelector';
import { useAppStore } from '@/store';

interface FeedbackPanelProps {
  isDarkMode: boolean;
  isFeedbackPanelExpanded: boolean;
  isPipelineRunning: boolean;
  pipelineStage: PipelineStage;
  streamingAiText: string;
  summariesError: string | null;
  aiSummaries: AiSummaryEntry[];
  selectedSummary: AiSummaryEntry | null;
  // Unified pipeline handler
  handleRunPipeline: () => void;
  handleCancelPipeline: () => void;
}

export const FeedbackPanel = React.memo(function FeedbackPanel({
  isDarkMode,
  isFeedbackPanelExpanded,
  isPipelineRunning,
  pipelineStage,
  streamingAiText,
  summariesError,
  aiSummaries,
  selectedSummary,
  handleRunPipeline,
  handleCancelPipeline,
}: FeedbackPanelProps) {
  // Get PII masking stats from store (실시간 생성 중)
  const piiMaskingStats = useAppStore((state) => state.piiMaskingStats);

  // 선택된 피드백의 개인정보 보호 여부 (저장된 파일)
  const selectedSummaryPiiMasked = selectedSummary?.piiMasked;

  // 표시할 개인정보 보호 정보: 실시간 생성 중이면 stats, 아니면 선택된 파일의 메타데이터
  const showPiiInfo = isPipelineRunning
    ? piiMaskingStats
    : selectedSummaryPiiMasked !== undefined
      ? { piiDetected: selectedSummaryPiiMasked }
      : null;

  if (!isFeedbackPanelExpanded) return null;

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
          : 'bg-white text-slate-900 border-slate-200/50'
      }`}
    >
      <div
        className={`flex h-14 items-center justify-between border-b px-6 ${isDarkMode ? 'border-white/10' : 'border-slate-200/50'}`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] flex-shrink-0">
            정리하기(feedback)
          </span>
          {/* 개인정보 보호 배지 (개발 모드 전용) */}
          {import.meta.env.DEV && showPiiInfo && (
            <div
              className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-medium ${
                showPiiInfo.piiDetected
                  ? isDarkMode
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-amber-100 text-amber-700 border border-amber-300'
                  : isDarkMode
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-emerald-100 text-emerald-700 border border-emerald-300'
              }`}
              title={
                'originalLength' in showPiiInfo
                  ? `개인정보 ${showPiiInfo.piiDetected ? '감지 및 보호됨' : '없음'} | 원본: ${showPiiInfo.originalLength}자 → 보호 처리: ${showPiiInfo.maskedLength}자`
                  : `이 피드백은 개인정보 ${showPiiInfo.piiDetected ? '보호 처리됨' : '보호 없이 생성됨'}`
              }
            >
              <Shield className="h-2.5 w-2.5 flex-shrink-0" />
              <span className="hidden xl:inline whitespace-nowrap">
                {showPiiInfo.piiDetected ? '개인정보 보호됨' : '개인정보 없음'}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Model Selector */}
          <ModelSelector isDarkMode={isDarkMode} />
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
          {/* Cancel Button (only shown when pipeline is running) */}
          {isPipelineRunning && (
            <button
              onClick={handleCancelPipeline}
              title="생성 중지"
              className={`rounded-full p-2 transition-colors border ${
                isDarkMode
                  ? 'border-red-500/30 hover:bg-red-500/10 text-red-400 hover:text-red-300 hover:border-red-500/50'
                  : 'border-red-300 hover:bg-red-50 text-red-600 hover:text-red-700 hover:border-red-400'
              }`}
            >
              <Square className="h-4 w-4 fill-current" />
            </button>
          )}
        </div>
      </div>
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4"
        style={{ paddingBottom: '120px' }}
      >
        <div className="space-y-4 max-w-full">
          {isPipelineRunning ? (
            <Response isDarkMode={isDarkMode}>
              {streamingAiText ? (
                <MarkdownRenderer
                  content={streamingAiText}
                  isDarkMode={isDarkMode}
                />
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
                오늘 작성된 AI 피드백이 없습니다. &ldquo;AI 피드백&rdquo; 버튼을
                눌러 요약을 생성해보세요.
              </p>
            </Response>
          ) : (
            <Response isDarkMode={isDarkMode}>
              <MarkdownRenderer
                content={
                  selectedSummary?.content?.trim() || '요약 내용이 없습니다.'
                }
                isDarkMode={isDarkMode}
              />
            </Response>
          )}
        </div>
      </div>
    </section>
  );
});
