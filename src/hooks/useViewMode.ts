import { useState, useCallback, useEffect } from 'react';

import type { ViewMode } from '@/types/viewMode';

import { setMiniMode, setExpandedMode } from '@/lib/tauri';

const FIRST_LAUNCH_KEY = 'hoego_has_launched_before';

/**
 * ViewMode 관리 Hook
 * Mini/Expanded 모드 전환 및 상태 관리
 */
export function useViewMode() {
  const [viewMode, setViewMode] = useState<ViewMode>('expanded');
  const [isTransitioning, setIsTransitioning] = useState(false);

  // 초기화: 최초 실행 시 Expanded, 이후 Mini 모드로 시작
  useEffect(() => {
    const initializeViewMode = async () => {
      const hasLaunchedBefore = localStorage.getItem(FIRST_LAUNCH_KEY);

      if (!hasLaunchedBefore) {
        // 최초 실행: Expanded 모드로 시작
        localStorage.setItem(FIRST_LAUNCH_KEY, 'true');
        setViewMode('expanded');
        await setExpandedMode();
      } else {
        // 이후 실행: Mini 모드로 시작
        setViewMode('mini');
        await setMiniMode();
      }
    };

    void initializeViewMode();
  }, []);

  /**
   * Mini 모드로 전환
   */
  const switchToMini = useCallback(async () => {
    if (viewMode === 'mini' || isTransitioning) return;

    setIsTransitioning(true);
    try {
      await setMiniMode();
      setViewMode('mini');
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[useViewMode] switchToMini failed:', error);
      }
    } finally {
      setIsTransitioning(false);
    }
  }, [viewMode, isTransitioning]);

  /**
   * Expanded 모드로 전환
   */
  const switchToExpanded = useCallback(async () => {
    if (viewMode === 'expanded' || isTransitioning) return;

    setIsTransitioning(true);
    try {
      await setExpandedMode();
      setViewMode('expanded');
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[useViewMode] switchToExpanded failed:', error);
      }
    } finally {
      setIsTransitioning(false);
    }
  }, [viewMode, isTransitioning]);

  /**
   * 모드 토글
   */
  const toggleViewMode = useCallback(async () => {
    if (viewMode === 'mini') {
      await switchToExpanded();
    } else {
      await switchToMini();
    }
  }, [viewMode, switchToExpanded, switchToMini]);

  return {
    viewMode,
    isTransitioning,
    switchToMini,
    switchToExpanded,
    toggleViewMode,
  };
}
