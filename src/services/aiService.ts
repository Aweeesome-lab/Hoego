/**
 * AI Service
 *
 * AI 요약 및 피드백 관련 비즈니스 로직을 캡슐화합니다.
 * Tauri 백엔드와의 통신을 추상화하고 타입 안전성을 제공합니다.
 */

import { invoke as tauriInvoke } from '@tauri-apps/api/tauri';

import type { AiSummaryInfo } from '@/types/tauri-commands';
import { CloudLLMClient } from '@/lib/cloud-llm';
import {
  STRUCTURED_FEEDBACK_PROMPT,
  STRUCTURED_FEEDBACK_SYSTEM_PROMPT,
} from '@/constants/aiPrompts';

// ============================================================================
// Types
// ============================================================================

export type AiSummaryEntry = AiSummaryInfo;

// Constants
const DEFAULT_AI_SUMMARY_LIMIT = 10;

// ============================================================================
// AI Summary Operations
// ============================================================================

/**
 * AI 요약 목록을 가져옵니다
 * @param limit 가져올 요약 개수 (기본값: 10)
 * @returns AI 요약 목록
 */
export async function getAiSummaries(
  limit = DEFAULT_AI_SUMMARY_LIMIT
): Promise<AiSummaryEntry[]> {
  return tauriInvoke<AiSummaryEntry[]>('list_ai_summaries', { limit });
}

/**
 * AI 요약 초안을 생성합니다
 * @returns 생성된 AI 요약
 */
export async function createAiSummaryDraft(): Promise<AiSummaryEntry> {
  return tauriInvoke<AiSummaryEntry>('create_ai_summary_draft');
}

/**
 * AI 피드백을 생성합니다
 * @returns 생성된 AI 피드백
 */
export async function generateAiFeedback(): Promise<AiSummaryEntry> {
  return tauriInvoke<AiSummaryEntry>('generate_ai_feedback');
}

/**
 * AI 피드백을 스트리밍 방식으로 생성합니다
 * @returns 스트리밍 시작 완료
 */
export async function generateAiFeedbackStream(): Promise<void> {
  return tauriInvoke<void>('generate_ai_feedback_stream');
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * AI 요약의 라벨을 생성합니다
 * @param summary AI 요약 정보
 * @returns 포맷팅된 라벨 문자열
 */
export function getSummaryLabel(summary: AiSummaryEntry): string {
  try {
    const date = new Date(summary.timestamp);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch {
    return '시간 없음';
  }
}

/**
 * AI 요약을 날짜별로 그룹화합니다
 * @param summaries AI 요약 목록
 * @returns 날짜별로 그룹화된 AI 요약 맵
 */
export function groupSummariesByDate(
  summaries: AiSummaryEntry[]
): Map<string, AiSummaryEntry[]> {
  const grouped = new Map<string, AiSummaryEntry[]>();

  summaries.forEach((summary) => {
    try {
      const date = new Date(summary.timestamp);
      const dateKey = date.toISOString().split('T')[0] ?? ''; // YYYY-MM-DD

      if (dateKey && !grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      if (dateKey) {
        grouped.get(dateKey)?.push(summary);
      }
    } catch (_error) {
      if (import.meta.env.DEV) {
        console.error('[aiService] Invalid timestamp for summary:', summary);
      }
    }
  });

  return grouped;
}

/**
 * AI 요약을 시간순으로 정렬합니다
 * @param summaries AI 요약 목록
 * @param order 정렬 순서 ('asc' | 'desc')
 * @returns 정렬된 AI 요약 목록
 */
export function sortSummariesByTime(
  summaries: AiSummaryEntry[],
  order: 'asc' | 'desc' = 'desc'
): AiSummaryEntry[] {
  return [...summaries].sort((a, b) => {
    try {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      const comparison = timeB - timeA;
      return order === 'asc' ? -comparison : comparison;
    } catch {
      return 0;
    }
  });
}

/**
 * AI 요약 내용의 미리보기를 생성합니다
 * @param content 요약 내용
 * @param maxLength 최대 길이 (기본값: 100)
 * @returns 미리보기 문자열
 */
export function getSummaryPreview(content: string, maxLength = 100): string {
  if (!content || content.trim().length === 0) {
    return '내용 없음';
  }

  const trimmed = content.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength)}...`;
}

// ============================================================================
// Structured Feedback Generation
// ============================================================================

/**
 * 구조화된 AI 피드백을 생성합니다
 * @param dumpContent 덤프 내용
 * @param recentHistory 최근 3-7일 덤프 (선택적)
 * @returns 구조화된 피드백 (마크다운 형식)
 */
export async function generateStructuredFeedback(
  dumpContent: string,
  recentHistory?: string[]
): Promise<string> {
  // Empty content check
  if (!dumpContent || dumpContent.trim().length === 0) {
    throw new Error('피드백을 생성할 내용이 없습니다.');
  }

  // Minimum content check
  if (dumpContent.trim().length < 50) {
    throw new Error('내용이 너무 짧습니다. 최소 50자 이상 작성해주세요.');
  }

  // Check if API key exists
  const hasKey = await CloudLLMClient.hasApiKey('openai');
  if (!hasKey) {
    throw new Error(
      'OpenAI API 키가 설정되지 않았습니다. 설정에서 API 키를 등록해주세요.'
    );
  }

  // Build user prompt with structured context
  let userPrompt = STRUCTURED_FEEDBACK_PROMPT;
  userPrompt += `\n\n---\n\n## 분석 대상\n\n**오늘의 덤프:**\n${dumpContent}`;

  // Add recent history with analysis instructions
  if (recentHistory && recentHistory.length > 0) {
    userPrompt += `\n\n---\n\n## 패턴 분석을 위한 최근 ${recentHistory.length}일 데이터\n\n`;
    userPrompt += `**분석 지침:**\n`;
    userPrompt += `1. 오늘 덤프와 비교하여 **반복되는 감정/행동/상황** 식별\n`;
    userPrompt += `2. **빈도와 변화 추이** 파악 (예: "지난 5일 중 4일", "3일 연속 증가")\n`;
    userPrompt += `3. **트리거 패턴** 발견 (같은 상황 → 같은 반응)\n`;
    userPrompt += `4. **대처 효과** 평가 (이전 대처 방식이 효과적이었는가)\n\n`;

    recentHistory.forEach((history, index) => {
      userPrompt += `**Day -${recentHistory.length - index}:**\n${history}\n\n`;
    });

    userPrompt += `\n**중요**: 위 데이터에서 **실제 발견한 구체적 패턴**만 언급하세요. 추측 금지.\n`;
  }

  userPrompt += `\n\n---\n\n## 출력 요구사항\n\n`;
  userPrompt += `반드시 5가지 섹션을 포함하세요:\n`;
  userPrompt += `1. 📋 To-do (데이터 기반 즉시 실행 가능한 행동 2-3개)\n`;
  userPrompt += `2. 💡 인사이트 (근본 원인 분석 2-3문장)\n`;
  userPrompt += `3. 🔁 반복 패턴 (실제 데이터 비교, 없으면 생략)\n`;
  userPrompt += `4. 🎯 개선 방향 (실질적이고 구체적인 중기 제안)\n`;
  userPrompt += `5. 💬 제안 (인사이트 기반 넛지 1-2문장)\n\n`;
  userPrompt += `**톤**: 전문적이지만 친근하게. 판단하지 않고 이해하는 태도.`;

  try {
    // Call AI API with stronger model for deeper analysis
    const response = await CloudLLMClient.complete({
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      model: 'gpt-4o', // Use stronger model for deeper analysis
      temperature: 0.6, // Slightly lower for more focused analysis
      max_tokens: 2500, // More tokens for detailed analysis
      system_prompt: STRUCTURED_FEEDBACK_SYSTEM_PROMPT,
    });

    const feedbackContent = response.content.trim();

    // Validate response
    if (!feedbackContent || feedbackContent.length === 0) {
      throw new Error('AI 피드백 생성 결과가 비어있습니다.');
    }

    return feedbackContent;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[aiService] Structured feedback 생성 실패:', error);
    }

    const errorMessage = error instanceof Error ? error.message : String(error);

    // User-friendly error messages
    if (errorMessage.includes('API key')) {
      throw new Error('API 키 오류입니다. 설정을 확인해주세요.');
    } else if (
      errorMessage.includes('network') ||
      errorMessage.includes('fetch')
    ) {
      throw new Error('네트워크 오류입니다. 인터넷 연결을 확인해주세요.');
    } else if (errorMessage.includes('rate limit')) {
      throw new Error(
        'API 호출 한도를 초과했습니다. 잠시 후 다시 시도해주세요.'
      );
    } else {
      throw new Error(`피드백 생성에 실패했습니다: ${errorMessage}`);
    }
  }
}
