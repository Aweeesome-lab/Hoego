import React from 'react';

import { listHistory } from '@/lib/tauri';
import { useAppStore } from '@/store/appStore';

/**
 * Sidebar 상태 관리 커스텀 훅
 * 사이드바 열림/닫힘 상태 및 히스토리 목록 로딩 관리
 */
export function useSidebar() {
  const isSidebarOpen = useAppStore((state) => state.isSidebarOpen);
  const historyFiles = useAppStore((state) => state.historyFiles);
  const isLoadingHistory = useAppStore((state) => state.isLoadingHistory);
  const setIsSidebarOpen = useAppStore((state) => state.setIsSidebarOpen);
  const setHistoryFiles = useAppStore((state) => state.setHistoryFiles);
  const setIsLoadingHistory = useAppStore((state) => state.setIsLoadingHistory);

  /**
   * 히스토리 파일 목록 로딩
   */
  const loadHistoryFiles = React.useCallback(async () => {
    try {
      setIsLoadingHistory(true);
      const overview = await listHistory();
      setHistoryFiles(overview.files);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[useSidebar] Failed to load history files:', error);
      }
      setHistoryFiles([]);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [setIsLoadingHistory, setHistoryFiles]);

  /**
   * 사이드바 토글
   */
  const toggleSidebar = React.useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, [setIsSidebarOpen]);

  return {
    isSidebarOpen,
    historyFiles,
    isLoadingHistory,
    loadHistoryFiles,
    toggleSidebar,
    setIsSidebarOpen,
  };
}
