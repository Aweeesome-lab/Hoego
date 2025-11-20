import { listen } from '@tauri-apps/api/event';
import { invoke as tauriInvoke } from '@tauri-apps/api/tauri';
import {
  appWindow,
  LogicalSize,
  LogicalPosition,
  currentMonitor,
} from '@tauri-apps/api/window';

import type {
  HistoryFileInfo,
  HistoryOverview,
  TodayMarkdown,
  AppendHistoryEntryPayload,
  AiSummaryInfo,
} from '@/types/tauri-commands';
import type { UnlistenFn } from '@tauri-apps/api/event';

import { VIEW_MODE_CONFIG } from '@/types/viewMode';

// ============================================================================
// 타입 정의
// ============================================================================

// Re-export types for backward compatibility
export type {
  HistoryFileInfo,
  HistoryOverview,
  TodayMarkdown,
  AppendHistoryEntryPayload,
};

// Legacy type alias
export type AiSummaryEntry = AiSummaryInfo;

// ============================================================================
// 윈도우 제어
// ============================================================================

// Window size constraints
const MIN_WINDOW_WIDTH = 320;
const MIN_WINDOW_HEIGHT = 200;
const DEFAULT_WINDOW_PADDING = 24;

export const hideOverlayWindow = async () => {
  try {
    await appWindow.hide();
  } catch (error) {
    if (import.meta.env.DEV)
      console.error('[hoego] overlay hide failed', error);
    await tauriInvoke<void>('hide_main_window');
  }
};

export const toggleOverlayWindow = async () => {
  try {
    await tauriInvoke<void>('toggle_overlay_window');
  } catch (error) {
    if (import.meta.env.DEV)
      console.error('[hoego] overlay toggle failed', error);
    // 토글 실패 시 기본 hide 시도로 폴백
    await hideOverlayWindow();
  }
};

export const applyWindowPosition = async (position: {
  x: number;
  y: number;
}) => {
  if (
    !position ||
    typeof position.x !== 'number' ||
    Number.isNaN(position.x) ||
    typeof position.y !== 'number' ||
    Number.isNaN(position.y)
  ) {
    return;
  }

  await tauriInvoke<void>('set_window_position', { position });
};

export const readWindowPosition = async () => {
  try {
    return await tauriInvoke<{ x: number; y: number }>('get_window_position');
  } catch (error) {
    if (import.meta.env.DEV)
      console.error('[hoego] failed to fetch window position', error);
    return null;
  }
};

export const resizeWindowTo = async (
  width: number,
  height: number,
  padding = DEFAULT_WINDOW_PADDING
) => {
  if (Number.isNaN(width) || Number.isNaN(height)) return;
  const targetWidth = Math.max(MIN_WINDOW_WIDTH, Math.ceil(width + padding));
  const targetHeight = Math.max(MIN_WINDOW_HEIGHT, Math.ceil(height + padding));
  await appWindow.setSize(new LogicalSize(targetWidth, targetHeight));
};

/**
 * Mini 모드로 전환 (600x80px, 화면 하단 중앙)
 * toggle_overlay 함수의 로직을 참고하여 정확한 위치 계산
 */
export const setMiniMode = async () => {
  try {
    const { width, height } = VIEW_MODE_CONFIG.mini;

    if (import.meta.env.DEV) {
      console.log('[hoego] Setting mini mode:', { width, height });
    }

    // 1. 현재 모니터 정보 먼저 가져오기
    const monitor = await currentMonitor();
    if (!monitor) {
      if (import.meta.env.DEV) {
        console.error('[hoego] No monitor found');
      }
      return;
    }

    // 2. 모니터 정보 추출
    const monitorPos = monitor.position;
    const monitorSize = monitor.size;
    const scaleFactor = monitor.scaleFactor;

    // 3. 논리 좌표계로 변환 (Rust 로직과 동일)
    const originXLogical = monitorPos.x / scaleFactor;
    const originYLogical = monitorPos.y / scaleFactor;
    const widthLogical = monitorSize.width / scaleFactor;
    const heightLogical = monitorSize.height / scaleFactor;

    // 4. 중앙 X 좌표 계산
    const centerXLogical = originXLogical + widthLogical / 2.0;
    const posXLogical = centerXLogical - width / 2.0;

    // 5. 하단 Y 좌표 계산 (하단에서 40px 여백)
    const bottomMargin = 40;
    const posYLogical = originYLogical + heightLogical - height - bottomMargin;

    if (import.meta.env.DEV) {
      console.log('[hoego] Mini mode position calculation:', {
        monitor: { width: monitorSize.width, height: monitorSize.height },
        scaleFactor,
        logical: { width: widthLogical, height: heightLogical },
        position: { x: Math.round(posXLogical), y: Math.round(posYLogical) },
      });
    }

    // 6. 크기와 위치를 동시에 설정
    await Promise.all([
      appWindow.setSize(new LogicalSize(width, height)),
      appWindow.setPosition(
        new LogicalPosition(Math.round(posXLogical), Math.round(posYLogical))
      ),
    ]);

    // localStorage에 모드 저장
    if (typeof window !== 'undefined') {
      localStorage.setItem('viewMode', 'mini');
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[hoego] setMiniMode failed', error);
    }
  }
};

/**
 * Mini 모드 윈도우 위치 저장
 */
export const saveMiniModePosition = async () => {
  try {
    const position = await appWindow.outerPosition();
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'miniModePosition',
        JSON.stringify({ x: position.x, y: position.y })
      );
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[hoego] saveMiniModePosition failed', error);
    }
  }
};

/**
 * Expanded 모드로 전환 (1200x800px, 화면 중앙)
 * toggle_overlay 함수의 로직을 참고하여 정확한 위치 계산
 */
export const setExpandedMode = async () => {
  try {
    const { width, height } = VIEW_MODE_CONFIG.expanded;

    if (import.meta.env.DEV) {
      console.log('[hoego] Setting expanded mode:', { width, height });
    }

    // 1. 현재 모니터 정보 먼저 가져오기
    const monitor = await currentMonitor();
    if (!monitor) {
      if (import.meta.env.DEV) {
        console.error('[hoego] No monitor found');
      }
      return;
    }

    // 2. 모니터 정보 추출
    const monitorPos = monitor.position;
    const monitorSize = monitor.size;
    const scaleFactor = monitor.scaleFactor;

    // 3. 논리 좌표계로 변환 (Rust 로직과 동일)
    const originXLogical = monitorPos.x / scaleFactor;
    const originYLogical = monitorPos.y / scaleFactor;
    const widthLogical = monitorSize.width / scaleFactor;
    const heightLogical = monitorSize.height / scaleFactor;

    // 4. 중앙 좌표 계산
    const centerXLogical = originXLogical + widthLogical / 2.0;
    const centerYLogical = originYLogical + heightLogical / 2.0;

    const posXLogical = centerXLogical - width / 2.0;
    const posYLogical = centerYLogical - height / 2.0;

    if (import.meta.env.DEV) {
      console.log('[hoego] Expanded mode position calculation:', {
        monitor: { width: monitorSize.width, height: monitorSize.height },
        scaleFactor,
        logical: { width: widthLogical, height: heightLogical },
        position: { x: Math.round(posXLogical), y: Math.round(posYLogical) },
      });
    }

    // 5. 크기와 위치를 동시에 설정
    await Promise.all([
      appWindow.setSize(new LogicalSize(width, height)),
      appWindow.setPosition(
        new LogicalPosition(Math.round(posXLogical), Math.round(posYLogical))
      ),
    ]);

    // localStorage에 모드 저장
    if (typeof window !== 'undefined') {
      localStorage.setItem('viewMode', 'expanded');
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[hoego] setExpandedMode failed', error);
    }
  }
};

/**
 * 저장된 ViewMode 가져오기
 */
export const getSavedViewMode = (): 'mini' | 'expanded' => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('viewMode');
    if (saved === 'mini' || saved === 'expanded') {
      return saved;
    }
  }
  return 'mini'; // 기본값
};

// ============================================================================
// 히스토리 관련 함수
// ============================================================================

// AI summary list default limit
const DEFAULT_AI_SUMMARY_LIMIT = 10;

export const listHistory = async (): Promise<HistoryOverview> => {
  return tauriInvoke<HistoryOverview>('list_history');
};

export const openHistoryFolder = async (): Promise<void> => {
  return tauriInvoke<void>('open_history_folder');
};

export const getTodayMarkdown = async (): Promise<TodayMarkdown> => {
  return tauriInvoke<TodayMarkdown>('get_today_markdown');
};

export const getHistoryMarkdown = async (filePath: string): Promise<string> => {
  try {
    return await tauriInvoke<string>('get_history_markdown', { filePath });
  } catch (error) {
    if (import.meta.env.DEV)
      console.error('[hoego] getHistoryMarkdown 실패:', error);
    throw error;
  }
};

export const saveTodayMarkdown = async (content: string): Promise<void> => {
  try {
    await tauriInvoke<void>('save_today_markdown', { content });
  } catch (error) {
    if (import.meta.env.DEV)
      console.error('[hoego] saveTodayMarkdown 실패:', error);
    throw error;
  }
};

export const appendHistoryEntry = async (
  payload: AppendHistoryEntryPayload
): Promise<void> => {
  try {
    // Rust 함수에 직접 전달 (camelCase로 자동 변환됨)
    await tauriInvoke<void>('append_history_entry', {
      payload: {
        timestamp: payload.timestamp,
        task: payload.task,
        isNewMinute: payload.isNewMinute,
        minuteKey: payload.minuteKey ?? null,
      },
    });
  } catch (error) {
    if (import.meta.env.DEV)
      console.error('[hoego] appendHistoryEntry 실패:', error);
    throw error;
  }
};

export const listAiSummaries = async (
  limit = DEFAULT_AI_SUMMARY_LIMIT,
  targetDate?: string
): Promise<AiSummaryEntry[]> => {
  return tauriInvoke<AiSummaryEntry[]>('list_ai_summaries', {
    limit,
    targetDate: targetDate ?? null,
  });
};

export const createAiSummaryDraft = async (): Promise<AiSummaryEntry> => {
  return tauriInvoke<AiSummaryEntry>('create_ai_summary_draft');
};

export const generateAiFeedback = async (
  targetDate?: string
): Promise<AiSummaryEntry> => {
  return tauriInvoke<AiSummaryEntry>('generate_ai_feedback', { targetDate });
};

export const generateAiFeedbackStream = async (
  targetDate?: string
): Promise<void> => {
  return tauriInvoke<void>('generate_ai_feedback_stream', { targetDate });
};

export const cancelAiFeedbackStream = async (): Promise<void> => {
  return tauriInvoke<void>('cancel_ai_feedback_stream');
};

export const onHistoryUpdated = async (
  callback: (overview: HistoryOverview | undefined) => void
): Promise<UnlistenFn> => {
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
          if (import.meta.env.DEV)
            console.error('[hoego] history update handler error', error);
        }
      }
    );

    return unlisten;
  } catch (error) {
    if (import.meta.env.DEV)
      console.error('[hoego] failed to listen to history_updated', error);
    return () => {};
  }
};
