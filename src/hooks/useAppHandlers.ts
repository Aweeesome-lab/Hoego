import { useCallback } from 'react';
import toast from 'react-hot-toast';

import { appendHistoryEntry } from '@/lib/tauri';
import { openSettingsWindow } from '@/services/settingsService';
import { useAppStore } from '@/store';
import { useDocumentStore } from '@/store/documentStore';

interface HistoryFile {
  date: string;
  path: string;
  size?: number;
  modifiedAt?: string;
}

interface UseAppHandlersOptions {
  inputValue: string;
  setInputValue: (value: string) => void;
  lastMinute: string;
  setLastMinute: (value: string) => void;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  loadMarkdown: () => Promise<void>;
  isSyncing: boolean;
  setIsSyncing: (value: boolean) => void;
  currentHistoryDate: string | null;
  setMarkdownContent: (content: string) => void;
  loadAiSummaries: () => Promise<void>;
  handleRunPipeline: () => Promise<void>;
  handleCancelPipeline: () => Promise<void>;
  lastSavedRef: React.MutableRefObject<string>;
  setCurrentHistoryDate: (date: string | null) => void;
  setIsLoadingHistoryContent: (loading: boolean) => void;
}

/**
 * App의 이벤트 핸들러들을 모아놓은 커스텀 훅
 *
 * @param options - 핸들러에 필요한 상태와 함수들
 * @returns 모든 이벤트 핸들러 함수들
 *
 * @example
 * ```tsx
 * const {
 *   handleSubmit,
 *   handleManualSync,
 *   handlePipelineExecution,
 *   // ...
 * } = useAppHandlers({ ... });
 * ```
 */
export function useAppHandlers({
  inputValue,
  setInputValue,
  lastMinute,
  setLastMinute,
  inputRef,
  loadMarkdown,
  isSyncing,
  setIsSyncing,
  currentHistoryDate,
  setMarkdownContent,
  loadAiSummaries,
  handleRunPipeline,
  handleCancelPipeline,
  lastSavedRef,
  setCurrentHistoryDate,
  setIsLoadingHistoryContent,
}: UseAppHandlersOptions) {
  // Submit handler
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      e.stopPropagation();

      void (async () => {
        const taskText = inputValue.trim();
        if (!taskText) {
          return;
        }

        const now = new Date();
        const timestamp = now.toISOString();
        const currentMinute = `${now.getHours().toString().padStart(2, '0')}:${now
          .getMinutes()
          .toString()
          .padStart(2, '0')}`;
        const isNewMinute = lastMinute !== currentMinute;

        // 입력 필드 즉시 초기화
        const savedTask = taskText;
        setInputValue('');
        setLastMinute(currentMinute);

        try {
          const payload = {
            timestamp,
            task: savedTask,
            isNewMinute,
          };

          await appendHistoryEntry(payload);

          // 마크다운 즉시 다시 로드
          await loadMarkdown();

          // 입력 필드 다시 포커스
          setTimeout(() => {
            inputRef.current?.focus();
          }, 100);
        } catch (error) {
          if (import.meta.env.DEV)
            console.error('[hoego] 항목 추가 실패:', error);
          toast.error(
            `작업 저장 실패: ${
              error instanceof Error ? error.message : String(error)
            }`
          );
          // 실패 시 입력값 복원
          setInputValue(savedTask);
        }
      })();
    },
    [
      inputValue,
      lastMinute,
      setInputValue,
      setLastMinute,
      inputRef,
      loadMarkdown,
    ]
  );

  const handleManualSync = useCallback(() => {
    void (async () => {
      if (isSyncing) return;
      try {
        setIsSyncing(true);

        // 히스토리 모드면 해당 날짜의 문서를 다시 로드, 아니면 오늘 문서 로드
        if (currentHistoryDate) {
          const { activeDocument, loadHistory } = useDocumentStore.getState();
          if (activeDocument?.filePath) {
            await loadHistory(currentHistoryDate, activeDocument.filePath);
            const { activeDocument: reloaded } = useDocumentStore.getState();
            if (reloaded) {
              setMarkdownContent(reloaded.content);
            }
          }
        } else {
          await loadMarkdown();
        }

        await loadAiSummaries();
      } catch (error) {
        if (import.meta.env.DEV)
          console.error('[hoego] 마크다운 동기화 실패', error);
      } finally {
        setIsSyncing(false);
      }
    })();
  }, [
    isSyncing,
    loadMarkdown,
    loadAiSummaries,
    currentHistoryDate,
    setMarkdownContent,
    setIsSyncing,
  ]);

  const handlePipelineExecution = useCallback(() => {
    void (async () => {
      await handleRunPipeline();
    })();
  }, [handleRunPipeline]);

  const handlePipelineCancellation = useCallback(() => {
    void (async () => {
      await handleCancelPipeline();
    })();
  }, [handleCancelPipeline]);

  const handleHomeClick = useCallback(() => {
    void (async () => {
      try {
        // 편집 모드라면 먼저 저장하고 종료
        const { isEditing, editingContent, setIsEditing } =
          useAppStore.getState();
        if (isEditing) {
          const { saveActiveDocument } = useDocumentStore.getState();
          await saveActiveDocument(editingContent);
          setIsEditing(false);
        }

        // 오늘 날짜로 돌아가기
        setCurrentHistoryDate(null);

        const { loadToday } = useDocumentStore.getState();
        await loadToday();

        const { activeDocument } = useDocumentStore.getState();
        if (activeDocument) {
          setMarkdownContent(activeDocument.content);
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('[hoego] 오늘 문서 로드 실패:', error);
        }
        toast.error('오늘 문서를 불러오는데 실패했습니다.');
      }
    })();
  }, [setMarkdownContent, setCurrentHistoryDate]);

  const handleSettingsClick = useCallback(() => {
    void (async () => {
      try {
        await openSettingsWindow();
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('[hoego] Failed to open settings window:', error);
        }
        toast.error('설정 창을 여는데 실패했습니다.');
      }
    })();
  }, []);

  const handleHistoryFileClick = useCallback(
    (file: HistoryFile) => {
      // 같은 날짜면 다시 로드하지 않음
      if (currentHistoryDate === file.date) {
        return;
      }

      void (async () => {
        try {
          setIsLoadingHistoryContent(true);

          // 편집 모드라면 먼저 저장하고 종료
          const { isEditing, editingContent, setIsEditing } =
            useAppStore.getState();
          if (isEditing) {
            const { saveActiveDocument } = useDocumentStore.getState();
            await saveActiveDocument(editingContent);
            setIsEditing(false);
          }

          setCurrentHistoryDate(file.date);

          const { loadHistory } = useDocumentStore.getState();
          await loadHistory(file.date, file.path);

          const { activeDocument } = useDocumentStore.getState();
          if (activeDocument) {
            setMarkdownContent(activeDocument.content);
            lastSavedRef.current = activeDocument.content;
          }
        } catch (error) {
          if (import.meta.env.DEV) {
            console.error('[hoego] Failed to load history:', error);
          }
          toast.error('히스토리를 불러오는데 실패했습니다.');
        } finally {
          setIsLoadingHistoryContent(false);
        }
      })();
    },
    [
      currentHistoryDate,
      setMarkdownContent,
      lastSavedRef,
      setIsLoadingHistoryContent,
      setCurrentHistoryDate,
    ]
  );

  return {
    handleSubmit,
    handleManualSync,
    handlePipelineExecution,
    handlePipelineCancellation,
    handleHomeClick,
    handleSettingsClick,
    handleHistoryFileClick,
  };
}
