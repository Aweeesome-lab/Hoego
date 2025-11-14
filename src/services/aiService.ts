/**
 * AI Service
 *
 * AI 요약 및 피드백 관련 비즈니스 로직을 캡슐화합니다.
 * Tauri 백엔드와의 통신을 추상화하고 타입 안전성을 제공합니다.
 */

import { invoke as tauriInvoke } from "@tauri-apps/api/tauri";
import type { AiSummaryInfo } from "@/types/tauri-commands";

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
  return tauriInvoke<AiSummaryEntry[]>("list_ai_summaries", { limit });
}

/**
 * AI 요약 초안을 생성합니다
 * @returns 생성된 AI 요약
 */
export async function createAiSummaryDraft(): Promise<AiSummaryEntry> {
  return tauriInvoke<AiSummaryEntry>("create_ai_summary_draft");
}

/**
 * AI 피드백을 생성합니다
 * @returns 생성된 AI 피드백
 */
export async function generateAiFeedback(): Promise<AiSummaryEntry> {
  return tauriInvoke<AiSummaryEntry>("generate_ai_feedback");
}

/**
 * AI 피드백을 스트리밍 방식으로 생성합니다
 * @returns 스트리밍 시작 완료
 */
export async function generateAiFeedbackStream(): Promise<void> {
  return tauriInvoke<void>("generate_ai_feedback_stream");
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
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  } catch {
    return "시간 없음";
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
      const dateKey = date.toISOString().split("T")[0]; // YYYY-MM-DD

      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(summary);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("[aiService] Invalid timestamp for summary:", summary);
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
  order: "asc" | "desc" = "desc"
): AiSummaryEntry[] {
  return [...summaries].sort((a, b) => {
    try {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      const comparison = timeB - timeA;
      return order === "asc" ? -comparison : comparison;
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
export function getSummaryPreview(
  content: string,
  maxLength = 100
): string {
  if (!content || content.trim().length === 0) {
    return "내용 없음";
  }

  const trimmed = content.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return trimmed.slice(0, maxLength) + "...";
}
