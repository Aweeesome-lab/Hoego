import { useCallback, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

import {
  cancelAiFeedbackStream,
  generateAiFeedbackStream,
  listAiSummaries,
} from '@/lib/tauri';
import { getSelectedModelOption } from '@/lib/model-selection';
import { useAppStore } from '@/store';

const DEFAULT_AI_SUMMARY_LIMIT = 10;

/**
 * 날짜 형식 변환: YYYYMMDD -> YYYY-MM-DD
 * @param date - YYYYMMDD 형식의 날짜 문자열
 * @returns YYYY-MM-DD 형식의 날짜 문자열
 */
function formatDateForBackend(date: string): string {
  if (date.length === 8) {
    return `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
  }
  return date;
}

/**
 * Unified AI Pipeline Hook
 * Combines categorization and feedback generation into a single sequential pipeline
 *
 * Pipeline Flow:
 * 1. Stage: Categorizing - AI categorizes the dump content
 * 2. Stage: Generating Feedback - AI generates feedback (streaming) based on categorized content
 *
 * @param targetDate - Optional target date (YYYYMMDD or YYYY-MM-DD) for which to generate feedback. Defaults to today.
 */
export function useAiPipeline(targetDate?: string | null) {
  // Zustand store selectors
  const aiSummaries = useAppStore((state) => state.aiSummaries);
  const selectedSummaryIndex = useAppStore(
    (state) => state.selectedSummaryIndex
  );
  const summariesError = useAppStore((state) => state.summariesError);
  const isPipelineRunning = useAppStore(
    (state) => state.isGeneratingAiFeedback
  );
  const pipelineStage = useAppStore((state) => state.pipelineStage);
  const streamingAiText = useAppStore((state) => state.streamingAiText);

  const setAiSummaries = useAppStore((state) => state.setAiSummaries);
  const setSelectedSummaryIndex = useAppStore(
    (state) => state.setSelectedSummaryIndex
  );
  const setSummariesError = useAppStore((state) => state.setSummariesError);
  const setIsPipelineRunning = useAppStore(
    (state) => state.setIsGeneratingAiFeedback
  );
  const setPipelineStage = useAppStore((state) => state.setPipelineStage);
  const setStreamingAiText = useAppStore((state) => state.setStreamingAiText);
  const setPiiMaskingStats = useAppStore((state) => state.setPiiMaskingStats);

  // Refs for streaming
  const streamingBufferRef = useRef('');
  const streamingTimerRef = useRef<number | null>(null);
  const streamingCleanupRef = useRef<(() => void) | null>(null);
  const isCancellingRef = useRef(false); // 취소 상태 추적

  /**
   * Load AI summaries from storage
   */
  const loadAiSummaries = useCallback(async () => {
    try {
      setSummariesError(null);
      // Convert date format from YYYYMMDD to YYYY-MM-DD if needed
      const formattedDate = targetDate
        ? formatDateForBackend(targetDate)
        : undefined;
      const summaries = await listAiSummaries(
        DEFAULT_AI_SUMMARY_LIMIT,
        formattedDate
      );
      setAiSummaries(summaries);
      const currentIndex = useAppStore.getState().selectedSummaryIndex;
      if (!summaries.length) {
        setSelectedSummaryIndex(0);
      } else {
        setSelectedSummaryIndex(Math.min(currentIndex, summaries.length - 1));
      }
    } catch (error) {
      if (import.meta.env.DEV)
        console.error('[hoego] AI summaries 로드 실패', error);
      setSummariesError(error instanceof Error ? error.message : String(error));
      setAiSummaries([]);
      setSelectedSummaryIndex(0);
    }
  }, [targetDate, setAiSummaries, setSelectedSummaryIndex, setSummariesError]);

  /**
   * Generate AI feedback (streaming)
   */
  const generateFeedback = useCallback(async () => {
    // Clear previous content and reset cancellation state
    setStreamingAiText('');
    streamingBufferRef.current = '';
    isCancellingRef.current = false;

    // Event subscription: delta/complete/error
    const unsubs: Array<() => void> = [];
    const cleanup = () => {
      unsubs.forEach((u) => {
        try {
          u();
        } catch (_e) {
          // Ignore unsubscribe errors
        }
      });
      if (streamingTimerRef.current) {
        clearInterval(streamingTimerRef.current);
        streamingTimerRef.current = null;
      }
      streamingBufferRef.current = '';
      setStreamingAiText('');
      streamingCleanupRef.current = null;
    };

    streamingCleanupRef.current = cleanup;

    try {
      const { listen } = await import('@tauri-apps/api/event');

      const unDelta = await listen<{ text: string }>(
        'ai_feedback_stream_delta',
        (e) => {
          const t = e.payload?.text || '';
          if (!t) return;
          streamingBufferRef.current += t;
          if (!streamingTimerRef.current) {
            streamingTimerRef.current = window.setInterval(() => {
              if (!streamingBufferRef.current) return;
              const currentText = useAppStore.getState().streamingAiText;
              const next = currentText + streamingBufferRef.current;
              streamingBufferRef.current = '';
              setStreamingAiText(next);
            }, 50);
          }
        }
      );
      unsubs.push(unDelta);

      const unComplete = await listen<{
        filename: string;
        path: string;
        createdAt?: string;
      }>('ai_feedback_stream_complete', () => {
        void (async () => {
          cleanup();
          await loadAiSummaries();
          setSelectedSummaryIndex(0);
          setPipelineStage('done');
          setIsPipelineRunning(false);
        })();
      });
      unsubs.push(unComplete);

      const unError = await listen<{ message: string }>(
        'ai_feedback_stream_error',
        (e) => {
          cleanup();
          // 취소 중이면 에러 토스트를 표시하지 않음
          if (!isCancellingRef.current) {
            const msg = e.payload?.message || '알 수 없는 오류';
            toast.error(`AI 피드백 생성에 실패했습니다: ${msg}`);
          }
          setPipelineStage('idle');
          setIsPipelineRunning(false);
        }
      );
      unsubs.push(unError);

      const unCancelled = await listen<{ message: string }>(
        'ai_feedback_stream_cancelled',
        () => {
          cleanup();
          toast('사용자에 의해서 피드백 생성이 취소되었습니다');
          setPipelineStage('idle');
          setIsPipelineRunning(false);
          isCancellingRef.current = false; // 취소 상태 리셋
        }
      );
      unsubs.push(unCancelled);

      // PII 마스킹 통계 이벤트 리스너
      const unMaskingStats = await listen<{
        originalLength: number;
        maskedLength: number;
        piiDetected: boolean;
      }>('ai_feedback_masking_stats', (e) => {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.log('[PII Masking Stats]', e.payload);
        }
        setPiiMaskingStats(e.payload);
      });
      unsubs.push(unMaskingStats);

      // Convert date format from YYYYMMDD to YYYY-MM-DD if needed
      const formattedDate = targetDate
        ? formatDateForBackend(targetDate)
        : undefined;

      // Pass targetDate to the backend (undefined means today)
      await generateAiFeedbackStream(formattedDate);
    } catch (error) {
      if (import.meta.env.DEV)
        console.error('[hoego] AI 피드백 스트리밍 시작 실패', error);

      // 취소 중이 아닐 때만 에러 토스트 표시
      if (!isCancellingRef.current) {
        toast.error(
          `AI 피드백 생성에 실패했습니다: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }

      cleanup();
      setPipelineStage('idle');
      setIsPipelineRunning(false);
      throw error;
    }
  }, [
    targetDate,
    loadAiSummaries,
    setSelectedSummaryIndex,
    setPipelineStage,
    setIsPipelineRunning,
    setStreamingAiText,
    setPiiMaskingStats,
  ]);

  /**
   * Main pipeline handler
   * Generates structured AI feedback (streaming)
   */
  const handleRunPipeline = useCallback(async () => {
    if (isPipelineRunning) return;

    // 모델 선택 여부 체크
    const selectedModel = await getSelectedModelOption();
    if (!selectedModel || !selectedModel.isAvailable) {
      toast.error('선택된 AI 모델이 없습니다. 설정에서 모델을 다운로드해주세요.');
      return;
    }

    setIsPipelineRunning(true);
    setPipelineStage('analyzing');

    try {
      // Generate streaming feedback
      await generateFeedback();

      // Note: Pipeline completion is handled in the 'ai_feedback_stream_complete' event
    } catch (_error) {
      // Error already handled in generateFeedback
      setPipelineStage('idle');
      setIsPipelineRunning(false);
    }
  }, [
    isPipelineRunning,
    generateFeedback,
    setIsPipelineRunning,
    setPipelineStage,
  ]);

  /**
   * Cancel the running pipeline
   */
  const handleCancelPipeline = useCallback(async () => {
    if (!isPipelineRunning) return;

    // Set cancelling flag to prevent error toasts during cancellation
    isCancellingRef.current = true;

    // Immediately update state to prevent duplicate cancel requests
    setIsPipelineRunning(false);
    setPipelineStage('idle');

    try {
      await cancelAiFeedbackStream();
      // Cleanup and state updates are handled in the 'ai_feedback_stream_cancelled' event
    } catch (error) {
      if (import.meta.env.DEV)
        console.error('[hoego] AI 피드백 취소 실패', error);
      // Reset cancelling flag on failure
      isCancellingRef.current = false;
      toast.error('AI 피드백 취소에 실패했습니다');
      // Revert state if cancellation failed
      setIsPipelineRunning(true);
      setPipelineStage('analyzing');
    }
  }, [isPipelineRunning, setIsPipelineRunning, setPipelineStage]);

  /**
   * Get label for AI summary entry
   */
  const getSummaryLabel = useCallback(
    (summary: { filename: string; createdAt?: string }) => {
      if (!summary?.createdAt) {
        return summary.filename;
      }
      const date = new Date(summary.createdAt);
      if (Number.isNaN(date.getTime())) {
        return summary.filename;
      }
      const datePart = date.toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
        weekday: 'short',
      });
      const timePart = date.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
      });
      return `${datePart} ${timePart}`;
    },
    []
  );

  /**
   * Auto-load summaries when targetDate changes
   */
  useEffect(() => {
    void loadAiSummaries();
  }, [loadAiSummaries]);

  return {
    // State
    aiSummaries,
    selectedSummaryIndex,
    summariesError,
    isPipelineRunning,
    pipelineStage,
    streamingAiText,
    streamingCleanupRef,

    // Actions
    setSelectedSummaryIndex,
    loadAiSummaries,
    handleRunPipeline,
    handleCancelPipeline,
    getSummaryLabel,
  };
}
