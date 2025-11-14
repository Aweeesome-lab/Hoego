import { invoke as tauriInvoke } from "@tauri-apps/api/tauri";
import { appWindow, LogicalSize } from "@tauri-apps/api/window";
import { listen, UnlistenFn } from "@tauri-apps/api/event";

// ============================================================================
// 타입 정의
// ============================================================================

export interface HistoryFileInfo {
  date: string;
  filename: string;
  title?: string;
  path?: string;
  preview?: string;
}

export interface HistoryOverview {
  directory?: string;
  files?: HistoryFileInfo[];
}

export interface TodayMarkdown {
  dateKey: string;
  shortLabel: string;
  headerTitle: string;
  filePath: string;
  content: string;
}

export interface AppendHistoryEntryPayload {
  timestamp: string;
  minuteKey?: string;
  task: string;
  isNewMinute: boolean;
}

export interface AiSummaryEntry {
  filename: string;
  path: string;
  createdAt?: string;
  content: string;
}

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
    if (import.meta.env.DEV) console.error("[hoego] overlay hide failed", error);
    await tauriInvoke<void>("hide_main_window");
  }
};

export const toggleOverlayWindow = async () => {
  try {
    await tauriInvoke<void>("toggle_overlay_window");
  } catch (error) {
    if (import.meta.env.DEV) console.error("[hoego] overlay toggle failed", error);
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
    typeof position.x !== "number" ||
    Number.isNaN(position.x) ||
    typeof position.y !== "number" ||
    Number.isNaN(position.y)
  ) {
    return;
  }

  await tauriInvoke<void>("set_window_position", { position });
};

export const readWindowPosition = async () => {
  try {
    return await tauriInvoke<{ x: number; y: number }>("get_window_position");
  } catch (error) {
    if (import.meta.env.DEV) console.error("[hoego] failed to fetch window position", error);
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

// ============================================================================
// 히스토리 관련 함수
// ============================================================================

// AI summary list default limit
const DEFAULT_AI_SUMMARY_LIMIT = 10;

export const listHistory = async (): Promise<HistoryOverview> => {
  return tauriInvoke<HistoryOverview>("list_history");
};

export const openHistoryFolder = async (): Promise<void> => {
  return tauriInvoke<void>("open_history_folder");
};

export const getTodayMarkdown = async (): Promise<TodayMarkdown> => {
  return tauriInvoke<TodayMarkdown>("get_today_markdown");
};

export const saveTodayMarkdown = async (content: string): Promise<void> => {
  try {
    await tauriInvoke<void>("save_today_markdown", { content });
  } catch (error) {
    if (import.meta.env.DEV) console.error("[hoego] saveTodayMarkdown 실패:", error);
    throw error;
  }
};

export const appendHistoryEntry = async (
  payload: AppendHistoryEntryPayload
): Promise<void> => {
  try {
    // Rust 함수에 직접 전달 (camelCase로 자동 변환됨)
    await tauriInvoke<void>("append_history_entry", {
      payload: {
        timestamp: payload.timestamp,
        task: payload.task,
        isNewMinute: payload.isNewMinute,
        minuteKey: payload.minuteKey ?? null,
      },
    });
  } catch (error) {
    if (import.meta.env.DEV) console.error("[hoego] appendHistoryEntry 실패:", error);
    throw error;
  }
};

export const listAiSummaries = async (
  limit = DEFAULT_AI_SUMMARY_LIMIT
): Promise<AiSummaryEntry[]> => {
  return tauriInvoke<AiSummaryEntry[]>("list_ai_summaries", { limit });
};

export const createAiSummaryDraft = async (): Promise<AiSummaryEntry> => {
  return tauriInvoke<AiSummaryEntry>("create_ai_summary_draft");
};

export const generateAiFeedback = async (): Promise<AiSummaryEntry> => {
  return tauriInvoke<AiSummaryEntry>("generate_ai_feedback");
};

export const generateAiFeedbackStream = async (): Promise<void> => {
  return tauriInvoke<void>("generate_ai_feedback_stream");
};

export const onHistoryUpdated = async (
  callback: (overview: HistoryOverview | undefined) => void
): Promise<UnlistenFn> => {
  if (typeof callback !== "function") {
    return () => {};
  }

  try {
    const unlisten = await listen<HistoryOverview>(
      "history_updated",
      (event) => {
        try {
          callback(event.payload);
        } catch (error) {
          if (import.meta.env.DEV) console.error("[hoego] history update handler error", error);
        }
      }
    );

    return unlisten;
  } catch (error) {
    if (import.meta.env.DEV) console.error("[hoego] failed to listen to history_updated", error);
    return () => {};
  }
};
