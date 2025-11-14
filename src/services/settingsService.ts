/**
 * Settings Service
 *
 * 설정 관련 비즈니스 로직을 캡슐화합니다.
 * 테마, 윈도우, LLM 설정 등을 관리합니다.
 */

import { invoke as tauriInvoke } from '@tauri-apps/api/tauri';
import { appWindow, LogicalSize } from '@tauri-apps/api/window';

// ============================================================================
// Types
// ============================================================================

export type ThemeMode = 'light' | 'dark' | 'system';

export interface WindowPosition {
  x: number;
  y: number;
}

export interface WindowSize {
  width: number;
  height: number;
}

// ============================================================================
// Constants
// ============================================================================

const MIN_WINDOW_WIDTH = 320;
const MIN_WINDOW_HEIGHT = 200;
const DEFAULT_WINDOW_PADDING = 24;

const THEME_STORAGE_KEY = 'hoego_theme_mode';

// ============================================================================
// Theme Settings
// ============================================================================

/**
 * 저장된 테마 모드를 가져옵니다
 * @returns 저장된 테마 모드 또는 기본값 'system'
 */
export function getStoredThemeMode(): ThemeMode {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored;
  }
  return 'system';
}

/**
 * 테마 모드를 저장합니다
 * @param mode 저장할 테마 모드
 */
export function saveThemeMode(mode: ThemeMode): void {
  localStorage.setItem(THEME_STORAGE_KEY, mode);
}

/**
 * 시스템 다크모드 설정을 감지합니다
 * @returns 시스템이 다크모드인지 여부
 */
export function getSystemDarkMode(): boolean {
  return (
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
}

/**
 * 테마 모드를 다음 모드로 전환합니다
 * light → dark → system → light
 * @param currentMode 현재 테마 모드
 * @returns 다음 테마 모드
 */
export function getNextThemeMode(currentMode: ThemeMode): ThemeMode {
  switch (currentMode) {
    case 'light':
      return 'dark';
    case 'dark':
      return 'system';
    case 'system':
      return 'light';
    default:
      return 'system';
  }
}

/**
 * 테마 모드로부터 실제 다크모드 여부를 계산합니다
 * @param mode 테마 모드
 * @returns 다크모드 활성화 여부
 */
export function isDarkModeActive(mode: ThemeMode): boolean {
  if (mode === 'light') return false;
  if (mode === 'dark') return true;
  return getSystemDarkMode();
}

// ============================================================================
// Window Settings
// ============================================================================

/**
 * 오버레이 윈도우를 숨깁니다
 */
export async function hideOverlayWindow(): Promise<void> {
  try {
    await appWindow.hide();
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[settingsService] overlay hide failed:', error);
    }
    await tauriInvoke<void>('hide_main_window');
  }
}

/**
 * 오버레이 윈도우를 토글합니다
 */
export async function toggleOverlayWindow(): Promise<void> {
  try {
    await tauriInvoke<void>('toggle_overlay_window');
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[settingsService] overlay toggle failed:', error);
    }
    await hideOverlayWindow();
  }
}

/**
 * 윈도우 위치를 설정합니다
 * @param position 설정할 윈도우 위치
 */
export async function setWindowPosition(
  position: WindowPosition
): Promise<void> {
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
}

/**
 * 윈도우 위치를 가져옵니다
 * @returns 현재 윈도우 위치 또는 null
 */
export async function getWindowPosition(): Promise<WindowPosition | null> {
  try {
    return await tauriInvoke<WindowPosition>('get_window_position');
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error(
        '[settingsService] failed to fetch window position:',
        error
      );
    }
    return null;
  }
}

/**
 * 윈도우 크기를 조정합니다
 * @param width 너비
 * @param height 높이
 * @param padding 패딩 (기본값: 24)
 */
export async function resizeWindow(
  width: number,
  height: number,
  padding = DEFAULT_WINDOW_PADDING
): Promise<void> {
  if (Number.isNaN(width) || Number.isNaN(height)) return;

  const targetWidth = Math.max(MIN_WINDOW_WIDTH, Math.ceil(width + padding));
  const targetHeight = Math.max(MIN_WINDOW_HEIGHT, Math.ceil(height + padding));

  await appWindow.setSize(new LogicalSize(targetWidth, targetHeight));
}

// ============================================================================
// LLM Settings
// ============================================================================

/**
 * LLM 설정 윈도우를 엽니다
 */
export async function openLLMSettings(): Promise<void> {
  return tauriInvoke<void>('open_llm_settings');
}

/**
 * 설정 윈도우를 엽니다
 */
export async function openSettingsWindow(): Promise<void> {
  return tauriInvoke<void>('open_settings_window');
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 윈도우 크기가 최소 크기보다 작은지 확인합니다
 * @param size 확인할 윈도우 크기
 * @returns 최소 크기보다 작으면 true
 */
export function isWindowSizeTooSmall(size: WindowSize): boolean {
  return size.width < MIN_WINDOW_WIDTH || size.height < MIN_WINDOW_HEIGHT;
}

/**
 * 윈도우 크기를 최소 크기로 제한합니다
 * @param size 원본 윈도우 크기
 * @returns 최소 크기로 제한된 윈도우 크기
 */
export function constrainWindowSize(size: WindowSize): WindowSize {
  return {
    width: Math.max(MIN_WINDOW_WIDTH, size.width),
    height: Math.max(MIN_WINDOW_HEIGHT, size.height),
  };
}
