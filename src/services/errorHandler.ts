/**
 * Error Handler Service
 *
 * 통합 에러 처리 시스템을 제공합니다.
 * Tauri 백엔드 에러를 사용자 친화적인 메시지로 변환합니다.
 */

import toast from "react-hot-toast";

// ============================================================================
// Types
// ============================================================================

export interface AppError {
  code: string;
  message: string;
  details?: unknown;
}

export type ErrorSeverity = "error" | "warning" | "info";

export interface ErrorHandlerOptions {
  /**
   * 토스트 알림을 표시할지 여부
   * @default true
   */
  showToast?: boolean;

  /**
   * 콘솔에 에러를 로그할지 여부
   * @default true in development
   */
  logToConsole?: boolean;

  /**
   * 에러 심각도
   * @default 'error'
   */
  severity?: ErrorSeverity;

  /**
   * 사용자 정의 에러 메시지
   */
  customMessage?: string;
}

// ============================================================================
// Error Code Mappings
// ============================================================================

const ERROR_MESSAGES: Record<string, string> = {
  // File System Errors
  FILE_NOT_FOUND: "파일을 찾을 수 없습니다.",
  PERMISSION_DENIED: "파일에 접근할 권한이 없습니다.",
  FILE_ALREADY_EXISTS: "파일이 이미 존재합니다.",
  IO_ERROR: "파일 입출력 중 오류가 발생했습니다.",

  // Network Errors
  NETWORK_ERROR: "네트워크 연결을 확인해주세요.",
  TIMEOUT_ERROR: "요청 시간이 초과되었습니다.",
  CONNECTION_REFUSED: "서버에 연결할 수 없습니다.",

  // Validation Errors
  VALIDATION_ERROR: "입력값이 올바르지 않습니다.",
  INVALID_FORMAT: "형식이 올바르지 않습니다.",
  MISSING_REQUIRED_FIELD: "필수 항목이 누락되었습니다.",

  // AI / LLM Errors
  AI_MODEL_NOT_FOUND: "AI 모델을 찾을 수 없습니다.",
  AI_GENERATION_FAILED: "AI 생성에 실패했습니다.",
  AI_MODEL_LOAD_FAILED: "AI 모델을 로드하는데 실패했습니다.",

  // Window Errors
  WINDOW_NOT_FOUND: "윈도우를 찾을 수 없습니다.",
  WINDOW_OPERATION_FAILED: "윈도우 작업에 실패했습니다.",

  // Generic Errors
  UNKNOWN_ERROR: "알 수 없는 오류가 발생했습니다.",
  INTERNAL_ERROR: "내부 오류가 발생했습니다.",
};

const ERROR_SUGGESTIONS: Record<string, string> = {
  FILE_NOT_FOUND: "파일 경로를 확인하고 다시 시도해주세요.",
  PERMISSION_DENIED: "파일 권한을 확인하고 다시 시도해주세요.",
  NETWORK_ERROR: "인터넷 연결을 확인하고 다시 시도해주세요.",
  TIMEOUT_ERROR: "잠시 후 다시 시도해주세요.",
  VALIDATION_ERROR: "입력값을 확인하고 다시 시도해주세요.",
  AI_MODEL_NOT_FOUND: "AI 모델을 다운로드하거나 설정을 확인해주세요.",
  AI_GENERATION_FAILED: "잠시 후 다시 시도하거나 다른 모델을 선택해주세요.",
};

// ============================================================================
// Error Parsing
// ============================================================================

/**
 * Rust 백엔드 에러를 파싱합니다
 * @param error 원본 에러 객체
 * @returns 파싱된 AppError
 */
export function parseError(error: unknown): AppError {
  // String error
  if (typeof error === "string") {
    return {
      code: "UNKNOWN_ERROR",
      message: error,
    };
  }

  // Error object with code
  if (error && typeof error === "object") {
    const err = error as Record<string, unknown>;

    // Tauri error format
    if (typeof err.code === "string") {
      return {
        code: err.code,
        message: typeof err.message === "string" ? err.message : ERROR_MESSAGES[err.code] || "오류가 발생했습니다.",
        details: err.details,
      };
    }

    // Standard Error object
    if (error instanceof Error) {
      return {
        code: "INTERNAL_ERROR",
        message: error.message,
        details: error.stack,
      };
    }
  }

  // Unknown error format
  return {
    code: "UNKNOWN_ERROR",
    message: "알 수 없는 오류가 발생했습니다.",
    details: error,
  };
}

// ============================================================================
// Error Handling
// ============================================================================

/**
 * 에러를 처리하고 사용자에게 표시합니다
 * @param error 원본 에러 객체
 * @param options 에러 처리 옵션
 * @returns 파싱된 AppError
 */
export function handleError(
  error: unknown,
  options: ErrorHandlerOptions = {}
): AppError {
  const {
    showToast = true,
    logToConsole = import.meta.env.DEV,
    severity = "error",
    customMessage,
  } = options;

  const appError = parseError(error);

  // Log to console in development
  if (logToConsole) {
    console.error("[ErrorHandler]", {
      code: appError.code,
      message: appError.message,
      details: appError.details,
    });
  }

  // Show toast notification
  if (showToast) {
    const message = customMessage || appError.message;
    const suggestion = ERROR_SUGGESTIONS[appError.code];
    const fullMessage = suggestion ? `${message}\n${suggestion}` : message;

    switch (severity) {
      case "error":
        toast.error(fullMessage);
        break;
      case "warning":
        toast(fullMessage, { icon: "⚠️" });
        break;
      case "info":
        toast(fullMessage, { icon: "ℹ️" });
        break;
    }
  }

  return appError;
}

/**
 * 에러를 사용자 친화적인 메시지로 변환합니다
 * @param error 원본 에러 객체
 * @returns 사용자 친화적인 메시지
 */
export function getErrorMessage(error: unknown): string {
  const appError = parseError(error);
  return appError.message;
}

/**
 * 에러 코드에 대한 제안사항을 가져옵니다
 * @param code 에러 코드
 * @returns 제안사항 문자열
 */
export function getErrorSuggestion(code: string): string | undefined {
  return ERROR_SUGGESTIONS[code];
}

/**
 * 특정 에러 코드인지 확인합니다
 * @param error 에러 객체
 * @param code 확인할 에러 코드
 * @returns 해당 에러 코드이면 true
 */
export function isErrorCode(error: unknown, code: string): boolean {
  const appError = parseError(error);
  return appError.code === code;
}

// ============================================================================
// Error Wrapper
// ============================================================================

/**
 * 비동기 함수를 감싸서 에러를 자동으로 처리합니다
 * @param fn 비동기 함수
 * @param options 에러 처리 옵션
 * @returns 래핑된 함수
 */
export function withErrorHandler<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  options: ErrorHandlerOptions = {}
): (...args: TArgs) => Promise<TReturn | null> {
  return async (...args: TArgs): Promise<TReturn | null> => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error, options);
      return null;
    }
  };
}

/**
 * 에러를 무시하고 기본값을 반환하는 래퍼
 * @param fn 비동기 함수
 * @param defaultValue 에러 발생 시 반환할 기본값
 * @returns 래핑된 함수
 */
export function withFallback<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  defaultValue: TReturn
): (...args: TArgs) => Promise<TReturn> {
  return async (...args: TArgs): Promise<TReturn> => {
    try {
      return await fn(...args);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn("[withFallback] Error occurred, returning default value:", error);
      }
      return defaultValue;
    }
  };
}
