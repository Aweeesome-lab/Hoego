import { useCallback, useRef } from 'react';
import toast from 'react-hot-toast';

import { CloudLLMClient } from '@/lib/cloud-llm';
import { generateAiFeedbackStream, listAiSummaries } from '@/lib/tauri';
import { useAppStore } from '@/store';

const DEFAULT_AI_SUMMARY_LIMIT = 10;

/**
 * Unified AI Pipeline Hook
 * Combines categorization and feedback generation into a single sequential pipeline
 *
 * Pipeline Flow:
 * 1. Stage: Categorizing - AI categorizes the dump content
 * 2. Stage: Generating Feedback - AI generates feedback (streaming) based on categorized content
 */
export function useAiPipeline() {
  // Zustand store selectors
  const aiSummaries = useAppStore((state) => state.aiSummaries);
  const selectedSummaryIndex = useAppStore((state) => state.selectedSummaryIndex);
  const summariesError = useAppStore((state) => state.summariesError);
  const isPipelineRunning = useAppStore((state) => state.isGeneratingAiFeedback);
  const pipelineStage = useAppStore((state) => state.pipelineStage);
  const streamingAiText = useAppStore((state) => state.streamingAiText);

  const setAiSummaries = useAppStore((state) => state.setAiSummaries);
  const setSelectedSummaryIndex = useAppStore((state) => state.setSelectedSummaryIndex);
  const setSummariesError = useAppStore((state) => state.setSummariesError);
  const setIsPipelineRunning = useAppStore((state) => state.setIsGeneratingAiFeedback);
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

  /**
   * Stage 1: Categorize dump content (with UI display)
   * @param content Current markdown content
   * @returns Categorized markdown content
   */
  const categorizeDump = useCallback(async (content: string): Promise<string> => {
    // Empty content check
    if (!content || content.trim().length === 0) {
      toast.error('카테고리화할 내용이 없습니다.');
      return content;
    }

    // Minimum content check (at least 50 characters)
    if (content.trim().length < 50) {
      toast.error('내용이 너무 짧습니다. 최소 50자 이상 작성해주세요.');
      return content;
    }

    try {
      // Check if API key exists
      const hasKey = await CloudLLMClient.hasApiKey('openai');
      if (!hasKey) {
        toast.error('OpenAI API 키가 설정되지 않았습니다. 설정에서 API 키를 등록해주세요.');
        return content;
      }

      // Call AI categorization
      const response = await CloudLLMClient.complete({
        messages: [
          {
            role: 'user',
            content: buildCategorizationPrompt(content),
          },
        ],
        model: 'gpt-4o-mini', // Fast and cost-effective
        temperature: 0.1, // Very low for consistent formatting
        max_tokens: 3000, // More tokens for detailed analysis
        system_prompt: 'You are an expert time analyst specializing in personal productivity. Analyze daily activity dumps with precision, calculate time spent per category, and present data in professional markdown tables.',
      });

      const categorizedSection = response.content.trim();

      // Validate response
      if (!categorizedSection || categorizedSection.length === 0) {
        toast.error('카테고리화 결과가 비어있습니다. 다시 시도해주세요.');
        return content;
      }

      // Display categorization result in UI immediately
      setStreamingAiText(categorizedSection);

      // Return original content without modification
      // Categorization result is only displayed in UI, not saved to file
      return content;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (import.meta.env.DEV) {
        console.error('[hoego] Dump 카테고리화 실패:', err);
      }

      // User-friendly error messages
      if (errorMessage.includes('API key')) {
        toast.error('API 키 오류입니다. 설정을 확인해주세요.');
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        toast.error('네트워크 오류입니다. 인터넷 연결을 확인해주세요.');
      } else if (errorMessage.includes('rate limit')) {
        toast.error('API 호출 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
      } else {
        toast.error(`카테고리화에 실패했습니다: ${errorMessage}`);
      }

      throw err; // Re-throw to stop pipeline
    }
  }, [setStreamingAiText]);

  /**
   * Stage 2: Generate AI feedback (streaming)
   */
  const generateFeedback = useCallback(async () => {
    // Clear previous content and start fresh
    // Only show feedback, not categorization result
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
        setPipelineStage('complete');
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
      setPipelineStage('idle');
      setIsPipelineRunning(false);
      throw error;
    }
  }, [loadAiSummaries, setSelectedSummaryIndex, setPipelineStage, setIsPipelineRunning, setStreamingAiText]);

  /**
   * Main pipeline handler
   * Runs categorization, then feedback generation sequentially
   * @param content Current markdown content
   * @param onContentUpdate Callback to update the content after categorization (not used anymore)
   */
  const handleRunPipeline = useCallback(async (
    content: string,
    onContentUpdate: (categorizedContent: string) => Promise<void>
  ) => {
    if (isPipelineRunning) return;

    setIsPipelineRunning(true);
    setPipelineStage('categorizing');

    try {
      // Stage 1: Categorization (display only, don't save to file)
      await categorizeDump(content);

      // Skip saving - categorization result is only shown in UI

      // Stage 2: AI Feedback (streaming)
      setPipelineStage('generating_feedback');
      await generateFeedback();

      // Note: Pipeline completion is handled in the 'ai_feedback_stream_complete' event
    } catch (error) {
      // Error already handled in individual stages
      setPipelineStage('idle');
      setIsPipelineRunning(false);
    }
  }, [isPipelineRunning, categorizeDump, generateFeedback, setIsPipelineRunning, setPipelineStage]);

  /**
   * Get label for AI summary entry
   */
  const getSummaryLabel = useCallback((summary: { filename: string; createdAt?: string }) => {
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

// ============================================================================
// Helper Functions (from useDumpCategorization)
// ============================================================================

interface ParsedEntry {
  time: string;
  timeInMinutes: number;
  content: string;
  durationMinutes?: number;
  durationText?: string;
}

/**
 * Parse timestamps from content
 */
function parseTimestamps(content: string): ParsedEntry[] {
  const lines = content.split('\n');
  const entries: ParsedEntry[] = [];

  for (const line of lines) {
    // Find (HH:MM:SS) pattern
    const match = line.match(/\((\d{2}):(\d{2}):(\d{2})\)/);
    if (match && match[1] && match[2] && match[3]) {
      const hh = match[1];
      const mm = match[2];
      const ss = match[3];
      const timeInMinutes = parseInt(hh, 10) * 60 + parseInt(mm, 10);
      const cleanContent = line
        .replace(/\s*\(\d{2}:\d{2}:\d{2}\)\s*$/, '')
        .replace(/^\s*[\*\-]\s*/, '')
        .trim();

      entries.push({
        time: `${hh}:${mm}:${ss}`,
        timeInMinutes,
        content: cleanContent,
      });
    }
  }

  return entries;
}

/**
 * Calculate durations between timestamps
 */
function calculateDurations(entries: ParsedEntry[]): ParsedEntry[] {
  const result: ParsedEntry[] = [];

  for (let i = 0; i < entries.length - 1; i++) {
    const current = entries[i];
    const next = entries[i + 1];
    if (current && next) {
      const duration = next.timeInMinutes - current.timeInMinutes;
      result.push({
        ...current,
        durationMinutes: duration,
        durationText: formatDuration(duration),
      });
    }
  }

  // Last entry (no duration)
  const lastEntry = entries[entries.length - 1];
  if (lastEntry) {
    result.push({
      ...lastEntry,
      durationMinutes: 0,
      durationText: '-',
    });
  }

  return result;
}

/**
 * Format duration (minutes → "X시간 Y분")
 */
function formatDuration(minutes: number): string {
  if (minutes <= 0) return '-';

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours > 0 && mins > 0) {
    return `${hours}시간 ${mins}분`;
  } else if (hours > 0) {
    return `${hours}시간`;
  } else {
    return `${mins}분`;
  }
}

/**
 * Build AI categorization prompt (Few-shot learning + time data)
 */
function buildCategorizationPrompt(content: string): string {
  // Parse timestamps and calculate durations
  const parsed = parseTimestamps(content);
  const withDurations = calculateDurations(parsed);

  // Calculate total activity time
  const totalMinutes = withDurations.reduce(
    (sum, entry) => sum + (entry.durationMinutes || 0),
    0
  );
  const totalTime = formatDuration(totalMinutes);

  // Build activity list with time information
  const activitiesWithTime = withDurations
    .map((e, i) => `${i + 1}. [${e.time}] ${e.content} (소요: ${e.durationText})`)
    .join('\n');

  return `당신은 하루 dump 내용을 분석하는 전문 시간 분석가입니다. 사용자의 dump를 분석하여 카테고리별 시간 사용 현황을 정리해주세요.

**분석 원칙:**
1. 아래에 제공된 정확한 시간 정보를 사용하세요 (이미 계산되어 있습니다)
2. 비슷한 활동을 카테고리로 묶어서 시간 집계
3. 마크다운 표 형식으로 카테고리별 시간과 비율 표시
4. 각 카테고리별 세부 활동 목록 작성
5. **중요**: 활동 내용을 분석하여 생산적인 시간과 낭비된 시간을 구분
6. **중요**: 사용자가 개선할 수 있는 구체적이고 실용적인 제안 제공

---

**예시 - 시간이 계산된 활동 목록:**

1. [09:00:00] 오전 9시 기상 (소요: 30분)
2. [09:30:00] 아침 먹고 샤워 (소요: 30분)
3. [10:00:00] 러닝 3km, 발목 통증 (소요: 45분)
4. [10:45:00] 업무 시작 - MVP 개발 (소요: 1시간 45분)
5. [12:30:00] 점심 식사 (소요: 1시간)
6. [13:30:00] 업무 재개 - API 작업 (소요: 2시간 30분)
7. [16:00:00] 유튜브 시청 (소요: -)

**예시 출력:**

## 📋 카테고리별 시간 사용 분석

| 카테고리 | 총 시간 | 비율 |
|---------|---------|------|
| 작업 (개발/업무/빌드) | 4시간 15분 | 60.7% |
| 개인 루틴 (식사/샤워/정리 등) | 1시간 30분 | 21.4% |
| 운동 | 45분 | 10.7% |
| 오락/취미 | 30분 | 7.2% |

### 작업 (개발/업무/빌드) - 4시간 15분
- 업무 시작 - MVP 개발
- 업무 재개 - API 작업

### 개인 루틴 (식사/샤워/정리 등) - 1시간 30분
- 오전 9시 기상
- 아침 먹고 샤워
- 점심 식사

### 운동 - 45분
- 러닝 3km, 발목 통증

### 오락/취미 - 30분
- 유튜브 시청

## 💡 오늘의 인사이트

### ⚡ 생산적인 시간 (High Quality Time)
- 업무 시작 - MVP 개발 (1시간 45분)
- 업무 재개 - API 작업 (2시간 30분)
- 운동 (45분)
→ **총 생산적 시간: 5시간**

### ⚠️ 개선 가능한 시간 (Potential Waste)
- 유튜브 시청 (30분) - 휴식 필요했을 가능성
→ **총 개선 가능 시간: 30분**

### 🎯 개선 제안
1. **휴식이 필요할 때**: 유튜브 대신 짧은 산책이나 스트레칭 추천
2. **에너지 관리**: 오전에 집중 작업, 오후에 가벼운 작업 배치

---

**이제 다음 활동들을 동일한 형식으로 분석해주세요:**

**총 활동 개수:** ${withDurations.length}개
**전체 시간 범위:** ${parsed[0]?.time || '없음'} ~ ${parsed[parsed.length - 1]?.time || '없음'}
**총 활동 시간:** ${totalTime}

**시간이 계산된 활동 목록:**
${activitiesWithTime}

**분석 결과:**`;
}
