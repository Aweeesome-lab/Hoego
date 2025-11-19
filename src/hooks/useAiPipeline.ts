import { useCallback, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

import { generateAiFeedbackStream, listAiSummaries } from '@/lib/tauri';
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

  // Refs for streaming
  const streamingBufferRef = useRef('');
  const streamingTimerRef = useRef<number | null>(null);
  const streamingCleanupRef = useRef<(() => void) | null>(null);

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
    // Clear previous content
    setStreamingAiText('');
    streamingBufferRef.current = '';

    // Event subscription: delta/complete/error
    const unsubs: Array<() => void> = [];
    const cleanup = () => {
      unsubs.forEach((u) => {
        try {
          u();
        } catch {}
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
      }>('ai_feedback_stream_complete', async () => {
        cleanup();
        await loadAiSummaries();
        setSelectedSummaryIndex(0);
        setPipelineStage('done');
        setIsPipelineRunning(false);
      });
      unsubs.push(unComplete);

      const unError = await listen<{ message: string }>(
        'ai_feedback_stream_error',
        (e) => {
          cleanup();
          const msg = e.payload?.message || '알 수 없는 오류';
          toast.error(`AI 피드백 생성에 실패했습니다: ${msg}`);
          setPipelineStage('idle');
          setIsPipelineRunning(false);
        }
      );
      unsubs.push(unError);

      // Convert date format from YYYYMMDD to YYYY-MM-DD if needed
      const formattedDate = targetDate
        ? formatDateForBackend(targetDate)
        : undefined;

      // Pass targetDate to the backend (undefined means today)
      await generateAiFeedbackStream(formattedDate);
    } catch (error) {
      if (import.meta.env.DEV)
        console.error('[hoego] AI 피드백 스트리밍 시작 실패', error);
      toast.error(
        `AI 피드백 생성에 실패했습니다: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
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
  ]);

  /**
   * Main pipeline handler
   * Generates structured AI feedback (streaming)
   */
  const handleRunPipeline = useCallback(async () => {
    if (isPipelineRunning) return;

    setIsPipelineRunning(true);
    setPipelineStage('analyzing');

    try {
      // Generate streaming feedback
      await generateFeedback();

      // Note: Pipeline completion is handled in the 'ai_feedback_stream_complete' event
    } catch (error) {
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
    loadAiSummaries();
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
    getSummaryLabel,
  };
}
