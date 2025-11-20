import { useState, useCallback, useEffect } from 'react';

import type { ViewMode } from '@/types/viewMode';

import { setMiniMode, setExpandedMode } from '@/lib/tauri';

/**
 * ViewMode 관리 Hook
 * Mini/Expanded 모드 전환 및 상태 관리
 */
export function useViewMode() {
  const [viewMode, setViewMode] = useState<ViewMode>('mini');
  const [isTransitioning, setIsTransitioning] = useState(false);

  // 초기화: 항상 Mini 모드로 시작
  useEffect(() => {
    const initializeViewMode = async () => {
      // 항상 Mini 모드로 시작
      setViewMode('mini');
      await setMiniMode();
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
