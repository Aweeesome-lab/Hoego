import { appWindow } from '@tauri-apps/api/window';
import { useEffect, useRef } from 'react';

import type { ViewMode } from '@/types/viewMode';

import { CloudLLMClient } from '@/lib/cloud-llm';
import { onHistoryUpdated, saveMiniModePosition } from '@/lib/tauri';

interface UseAppEffectsProps {
  loadMarkdown: (scrollToBottom?: boolean) => Promise<void>;
  loadAiSummaries: () => Promise<void>;
  loadHistoryFiles: () => Promise<void>;
  currentHistoryDate: string | null;
  isSidebarOpen: boolean;
  viewMode: ViewMode;
  inputRef: React.RefObject<HTMLTextAreaElement>;
  streamingCleanupRef: React.MutableRefObject<(() => void) | null>;
}

/**
 * App.tsx의 Side Effects를 관리하는 커스텀 훅
 */
export function useAppEffects({
  loadMarkdown,
  loadAiSummaries,
  loadHistoryFiles,
  currentHistoryDate,
  isSidebarOpen,
  viewMode,
  inputRef,
  streamingCleanupRef,
}: UseAppEffectsProps) {
  // Refs for latest functions and state (to avoid stale closures in event listeners)
  const loadMarkdownRef = useRef(loadMarkdown);
  const loadAiSummariesRef = useRef(loadAiSummaries);
  const currentHistoryDateRef = useRef(currentHistoryDate);

  useEffect(() => {
    loadMarkdownRef.current = loadMarkdown;
  }, [loadMarkdown]);

  useEffect(() => {
    loadAiSummariesRef.current = loadAiSummaries;
  }, [loadAiSummaries]);

  useEffect(() => {
    currentHistoryDateRef.current = currentHistoryDate;
  }, [currentHistoryDate]);

  // Load markdown on mount
  useEffect(() => {
    void loadMarkdown();
  }, [loadMarkdown]);

  // Load AI summaries on mount and when selected date changes
  useEffect(() => {
    void loadAiSummaries();
  }, [currentHistoryDate, loadAiSummaries]);

  // Load history files on mount and when sidebar opens
  useEffect(() => {
    if (isSidebarOpen) {
      void loadHistoryFiles();
    }
  }, [isSidebarOpen, loadHistoryFiles]);

  // Initialize Cloud LLM provider on mount
  useEffect(() => {
    const initCloudProvider = async () => {
      try {
        // Try to initialize OpenAI provider if key exists
        const hasOpenAIKey = await CloudLLMClient.hasApiKey('openai');
        if (hasOpenAIKey) {
          await CloudLLMClient.initializeProvider('openai');
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error(
            '[Cloud LLM] Failed to auto-initialize provider:',
            error
          );
        }
      }
    };

    void initCloudProvider();
  }, []);

  // History update listener
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    void onHistoryUpdated(() => {
      // 히스토리 모드가 아닐 때만 오늘 dump 로드
      // 히스토리 모드에서는 이미 해당 날짜의 콘텐츠가 로드되어 있음
      if (!currentHistoryDateRef.current) {
        // 외부 업데이트 시에는 스크롤을 맨 아래로 내리지 않음
        void loadMarkdownRef.current(false);
      }
      void loadAiSummariesRef.current();
    }).then((unsub) => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []); // No dependencies - listener registered once, refs always point to latest

  // Focus input field
  useEffect(() => {
    const focusInput = () => {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 200);
    };

    focusInput();
    window.addEventListener('focus', focusInput);
    return () => window.removeEventListener('focus', focusInput);
  }, [inputRef]);

  // Cleanup streaming on unmount
  useEffect(() => {
    const cleanup = streamingCleanupRef.current;
    return () => {
      if (cleanup) {
        cleanup();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mini 모드일 때 윈도우 위치 저장
  useEffect(() => {
    if (viewMode !== 'mini') return;

    let unlisten: (() => void) | null = null;

    const setupPositionListener = async () => {
      // 윈도우 이동 이벤트 리스너
      unlisten = await appWindow.onMoved(() => {
        void saveMiniModePosition();
      });
    };

    void setupPositionListener();

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, [viewMode]);
}
