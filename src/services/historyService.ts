/**
 * History Service
 *
 * 히스토리 관련 비즈니스 로직을 캡슐화합니다.
 * Tauri 백엔드와의 통신을 추상화하고 타입 안전성을 제공합니다.
 */

import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { invoke as tauriInvoke } from '@tauri-apps/api/tauri';

import type {
  HistoryFileInfo,
  HistoryOverview,
  TodayMarkdown,
  AppendHistoryEntryPayload,
} from '@/types/tauri-commands';

// ============================================================================
// Types
// ============================================================================

export type {
  HistoryFileInfo,
  HistoryOverview,
  TodayMarkdown,
  AppendHistoryEntryPayload,
};

// ============================================================================
// History Operations
// ============================================================================

/**
 * 전체 히스토리 목록을 가져옵니다
 * @returns 히스토리 개요 정보
 */
export async function getHistoryList(): Promise<HistoryOverview> {
  return tauriInvoke<HistoryOverview>('list_history');
}

/**
 * 히스토리 폴더를 파일 탐색기에서 엽니다
 */
export async function openHistoryFolder(): Promise<void> {
  return tauriInvoke<void>('open_history_folder');
}

/**
 * 오늘의 마크다운 내용을 가져옵니다
 * @returns 오늘의 마크다운 데이터
 */
export async function getTodayMarkdown(): Promise<TodayMarkdown> {
  return tauriInvoke<TodayMarkdown>('get_today_markdown');
}

/**
 * 오늘의 마크다운 내용을 저장합니다
 * @param content 저장할 마크다운 내용
 * @throws 저장 실패 시 에러
 */
export async function saveTodayMarkdown(content: string): Promise<void> {
  try {
    await tauriInvoke<void>('save_today_markdown', { content });
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[historyService] saveTodayMarkdown failed:', error);
    }
    throw error;
  }
}

/**
 * 히스토리 항목을 추가합니다
 * @param payload 추가할 히스토리 항목 데이터
 * @throws 추가 실패 시 에러
 */
export async function appendHistoryEntry(
  payload: AppendHistoryEntryPayload
): Promise<void> {
  try {
    await tauriInvoke<void>('append_history_entry', {
      payload: {
        timestamp: payload.timestamp,
        task: payload.task,
        isNewMinute: payload.isNewMinute,
        minuteKey: payload.minuteKey ?? null,
      },
    });
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[historyService] appendHistoryEntry failed:', error);
    }
    throw error;
  }
}

// ============================================================================
// Event Listeners
// ============================================================================

/**
 * 히스토리 업데이트 이벤트를 구독합니다
 * @param callback 히스토리 업데이트 시 호출될 콜백 함수
 * @returns 구독 해제 함수
 */
export async function onHistoryUpdated(
  callback: (overview: HistoryOverview | undefined) => void
): Promise<UnlistenFn> {
  if (typeof callback !== 'function') {
    return () => {};
  }

  try {
    const unlisten = await listen<HistoryOverview>(
      'history_updated',
      (event) => {
        try {
          callback(event.payload);
        } catch (error) {
          if (import.meta.env.DEV) {
            console.error(
              '[historyService] history update handler error:',
              error
            );
          }
        }
      }
    );

    return unlisten;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error(
        '[historyService] failed to listen to history_updated:',
        error
      );
    }
    return () => {};
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 히스토리 파일 정보를 날짜 기준으로 정렬합니다
 * @param files 히스토리 파일 정보 배열
 * @param order 정렬 순서 ('asc' | 'desc')
 * @returns 정렬된 히스토리 파일 정보 배열
 */
export function sortHistoryFiles(
  files: HistoryFileInfo[],
  order: 'asc' | 'desc' = 'desc'
): HistoryFileInfo[] {
  return [...files].sort((a, b) => {
    const comparison = new Date(b.date).getTime() - new Date(a.date).getTime();
    return order === 'asc' ? -comparison : comparison;
  });
}

/**
 * 히스토리 파일을 월별로 그룹화합니다
 * @param files 히스토리 파일 정보 배열
 * @returns 월별로 그룹화된 히스토리 파일 맵
 */
export function groupHistoryFilesByMonth(
  files: HistoryFileInfo[]
): Map<string, HistoryFileInfo[]> {
  const grouped = new Map<string, HistoryFileInfo[]>();

  files.forEach((file) => {
    const date = new Date(file.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!grouped.has(monthKey)) {
      grouped.set(monthKey, []);
    }
    grouped.get(monthKey)!.push(file);
  });

  return grouped;
}
