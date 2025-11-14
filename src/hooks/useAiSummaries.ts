import { useCallback, useRef } from 'react';
import toast from 'react-hot-toast';

import type { AiSummaryEntry } from '@/lib/tauri';

import { listAiSummaries } from '@/lib/tauri';
import { useAppStore } from '@/store';

const DEFAULT_AI_SUMMARY_LIMIT = 10;

export function useAiSummaries() {
  // Zustand store selectors
  const aiSummaries = useAppStore((state) => state.aiSummaries);
  const selectedSummaryIndex = useAppStore(
    (state) => state.selectedSummaryIndex
  );
  const summariesError = useAppStore((state) => state.summariesError);
  const isGeneratingAiFeedback = useAppStore(
    (state) => state.isGeneratingAiFeedback
  );
  const streamingAiText = useAppStore((state) => state.streamingAiText);

  const setAiSummaries = useAppStore((state) => state.setAiSummaries);
  const setSelectedSummaryIndex = useAppStore(
    (state) => state.setSelectedSummaryIndex
  );
  const setSummariesError = useAppStore((state) => state.setSummariesError);
  const setIsGeneratingAiFeedback = useAppStore(
    (state) => state.setIsGeneratingAiFeedback
  );
  const setStreamingAiText = useAppStore((state) => state.setStreamingAiText);

  // Refs (not in Zustand)
  const streamingBufferRef = useRef('');
  const streamingTimerRef = useRef<number | null>(null);
  const streamingCleanupRef = useRef<(() => void) | null>(null);

  const loadAiSummaries = useCallback(async () => {
    try {
      setSummariesError(null);
      const summaries = await listAiSummaries(DEFAULT_AI_SUMMARY_LIMIT);
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
  }, [setAiSummaries, setSelectedSummaryIndex, setSummariesError]);

  const handleGenerateAiFeedback = useCallback(async () => {
    if (isGeneratingAiFeedback) return;
    setIsGeneratingAiFeedback(true);
    setStreamingAiText('');
    streamingBufferRef.current = '';

    // 이벤트 구독: 델타/완료/에러
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
      setIsGeneratingAiFeedback(false);
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
      });
      unsubs.push(unComplete);

      const unError = await listen<{ message: string }>(
        'ai_feedback_stream_error',
        (e) => {
          cleanup();
          const msg = e.payload?.message || '알 수 없는 오류';
          toast.error(`AI 피드백 생성에 실패했습니다: ${msg}`);
        }
      );
      unsubs.push(unError);

      const { generateAiFeedbackStream } = await import('@/lib/tauri');
      await generateAiFeedbackStream();
    } catch (error) {
      if (import.meta.env.DEV)
        console.error('[hoego] AI 피드백 스트리밍 시작 실패', error);
      toast.error(
        `AI 피드백 생성에 실패했습니다: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      cleanup();
    }
  }, [isGeneratingAiFeedback, loadAiSummaries]);

  const getSummaryLabel = useCallback((summary: AiSummaryEntry) => {
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
  }, []);

  return {
    aiSummaries,
    selectedSummaryIndex,
    setSelectedSummaryIndex,
    summariesError,
    isGeneratingAiFeedback,
    streamingAiText,
    streamingCleanupRef,
    loadAiSummaries,
    handleGenerateAiFeedback,
    getSummaryLabel,
  };
}
