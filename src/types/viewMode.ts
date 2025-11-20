/**
 * View Mode Types
 * Mini: 작은 입력창만 표시 (600x80px)
 * Expanded: 전체 앱 UI 표시 (1200x800px)
 */
export type ViewMode = 'mini' | 'expanded';

/**
 * Window position for saving/restoring
 */
export interface WindowPosition {
  x: number;
  y: number;
}

/**
 * Window size configuration
 */
export interface WindowSize {
  width: number;
  height: number;
}

/**
 * ViewMode 설정
 */
export const VIEW_MODE_CONFIG = {
  mini: {
    width: 600,
    height: 80,
  },
  expanded: {
    width: 1200,
    height: 800,
  },
} as const;
