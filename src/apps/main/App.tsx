import { appWindow } from '@tauri-apps/api/window';
import React from 'react';
import toast, { Toaster } from 'react-hot-toast';

import {
  Header,
  MiniHeader,
  FloatingMiniBar,
  Footer,
  Sidebar,
} from '@/components/layout';
import { useMarkdownComponents } from '@/components/markdown';
import { DumpPanel } from '@/components/panels';
import {
  useTheme,
  useMarkdown,
  useRetrospect,
  useSidebar,
  useViewMode,
} from '@/hooks';
import { useAiPipeline } from '@/hooks/useAiPipeline';
import {
  hideOverlayWindow,
  appendHistoryEntry,
  onHistoryUpdated,
  saveMiniModePosition,
} from '@/lib/tauri';
import { openSettingsWindow } from '@/services/settingsService';
import { useDocumentStore } from '@/store/documentStore';

// Code splitting: lazy load panels that are conditionally rendered
const AiPanel = React.lazy(() =>
  import('@/components/panels').then((module) => ({ default: module.AiPanel }))
);
const RetrospectPanel = React.lazy(() =>
  import('@/components/panels').then((module) => ({
    default: module.RetrospectPanel,
  }))
);

export default function App() {
  const inputRef = React.useRef<HTMLTextAreaElement | null>(null);
  const [inputValue, setInputValue] = React.useState('');
  const [currentTime, setCurrentTime] = React.useState('');
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [isAiPanelExpanded, setIsAiPanelExpanded] = React.useState(false);
  const [isRetrospectPanelExpanded, setIsRetrospectPanelExpanded] =
    React.useState(false);
  const splitRef = React.useRef<HTMLDivElement | null>(null);

  // 현재 보고 있는 히스토리 정보
  const [currentHistoryDate, setCurrentHistoryDate] = React.useState<
    string | null
  >(null);
  const [isLoadingHistoryContent, setIsLoadingHistoryContent] =
    React.useState(false);

  // Use custom hooks
  const { themeMode, isDarkMode, toggleTheme } = useTheme();
  const {
    markdownRef,
    markdownContent,
    setMarkdownContent,
    lastMinute,
    setLastMinute,
    isEditing,
    setIsEditing,
    editingContent,
    setEditingContent,
    isSaving,
    setIsSaving,
    editorRef,
    lastSavedRef,
    loadMarkdown,
    appendTimestampToLine,
    handleTaskCheckboxToggle,
  } = useMarkdown();

  const {
    aiSummaries,
    selectedSummaryIndex,
    summariesError,
    isPipelineRunning,
    pipelineStage,
    streamingAiText,
    streamingCleanupRef,
    loadAiSummaries,
    handleRunPipeline,
    handleCancelPipeline,
  } = useAiPipeline(currentHistoryDate);

  const {
    retrospectContent,
    setRetrospectContent,
    retrospectRef,
    isSavingRetrospect,
    isEditingRetrospect,
    setIsEditingRetrospect,
  } = useRetrospect({ currentHistoryDate });

  const {
    isSidebarOpen,
    historyFiles,
    isLoadingHistory,
    loadHistoryFiles,
    toggleSidebar,
  } = useSidebar();

  const { viewMode, switchToExpanded, switchToMini } = useViewMode();

  const markdownComponents = useMarkdownComponents({
    isDarkMode,
    isSaving,
    handleTaskCheckboxToggle,
  });

  const selectedSummary = React.useMemo(
    () => aiSummaries[selectedSummaryIndex] ?? null,
    [aiSummaries, selectedSummaryIndex]
  );


  // Update current time
  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Load markdown on mount
  React.useEffect(() => {
    void loadMarkdown();
  }, [loadMarkdown]);

  // Load AI summaries on mount
  React.useEffect(() => {
    void loadAiSummaries();
  }, [loadAiSummaries]);

  // Load history files on mount and when sidebar opens
  React.useEffect(() => {
    if (isSidebarOpen) {
      void loadHistoryFiles();
    }
  }, [isSidebarOpen, loadHistoryFiles]);

  // Initialize Cloud LLM provider on mount
  React.useEffect(() => {
    const initCloudProvider = async () => {
      try {
        const { CloudLLMClient } = await import('@/lib/cloud-llm');

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
  React.useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    void onHistoryUpdated(() => {
      void loadMarkdown();
      void loadAiSummaries();
    }).then((unsub) => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [loadMarkdown, loadAiSummaries]);

  // Focus input field
  React.useEffect(() => {
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
  }, []);

  // Submit handler
  const handleSubmit = (e: React.FormEvent) => {
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
  };

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      // 사이드바 토글: Cmd/Ctrl + 1
      if ((event.metaKey || event.ctrlKey) && event.key === '1') {
        event.preventDefault();
        event.stopPropagation();
        toggleSidebar();
        return;
      }

      // 패널 토글: Cmd/Ctrl + 2 for AI panel
      if ((event.metaKey || event.ctrlKey) && event.key === '2') {
        event.preventDefault();
        event.stopPropagation();
        setIsAiPanelExpanded((prev) => !prev);
        return;
      }

      // 패널 토글: Cmd/Ctrl + 3 for Retrospect panel
      if ((event.metaKey || event.ctrlKey) && event.key === '3') {
        event.preventDefault();
        event.stopPropagation();
        setIsRetrospectPanelExpanded((prev) => !prev);
        return;
      }

      // 편집 토글 / 편집 중이면 현재 줄 타임스탬프 후 저장 종료
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'e') {
        event.preventDefault();
        event.stopPropagation();

        // 히스토리를 보고 있으면 편집 불가
        if (currentHistoryDate) {
          toast.error('히스토리는 읽기 전용입니다.');
          return;
        }

        if (isEditing) {
          const el = editorRef.current;
          const start = el ? el.selectionStart : editingContent.length;
          const end = el ? el.selectionEnd : start;
          const before = editingContent.slice(0, start);
          const after = editingContent.slice(end);
          const lineStart = before.lastIndexOf('\n') + 1;
          const currentLine = before.slice(lineStart);

          const stampedLine = appendTimestampToLine(currentLine);
          const newContent =
            editingContent.slice(0, lineStart) + stampedLine + after;

          void (async () => {
            try {
              setIsSaving(true);
              if (newContent !== editingContent) {
                setEditingContent(newContent);
              }

              // ✅ 변경: Active Document 사용
              const { saveActiveDocument } = useDocumentStore.getState();
              const result = await saveActiveDocument(newContent);

              if (!result.success) {
                throw new Error(result.error);
              }

              lastSavedRef.current = newContent;
              await loadMarkdown();
            } catch (error) {
              if (import.meta.env.DEV)
                console.error('[hoego] Cmd+E 저장 실패:', error);
            } finally {
              setIsSaving(false);
              setIsEditing(false);
            }
          })();
        } else {
          setEditingContent(markdownContent);
          setIsEditing(true);
        }
        return;
      }

      // ESC: 편집 중이면 편집 종료, 아니면 창 숨김
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        if (isEditing) {
          // 편집 종료 시 저장 flush
          if (editingContent !== lastSavedRef.current) {
            void (async () => {
              try {
                setIsSaving(true);

                // ✅ 변경: Active Document 사용
                const { saveActiveDocument } = useDocumentStore.getState();
                const result = await saveActiveDocument(editingContent);

                if (!result.success) {
                  throw new Error(result.error);
                }

                lastSavedRef.current = editingContent;
                await loadMarkdown();
              } catch (error) {
                if (import.meta.env.DEV)
                  console.error('[hoego] 저장 실패:', error);
              } finally {
                setIsSaving(false);
                setIsEditing(false);
              }
            })();
          } else {
            setIsEditing(false);
          }
        } else {
          void hideOverlayWindow();
        }
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [
    toggleSidebar,
    isEditing,
    editingContent,
    markdownContent,
    loadMarkdown,
    appendTimestampToLine,
    setEditingContent,
    setIsEditing,
    setIsSaving,
    lastSavedRef,
    editorRef,
    currentHistoryDate,
  ]);

  const handleManualSync = React.useCallback(() => {
    void (async () => {
      if (isSyncing) return;
      try {
        setIsSyncing(true);
        await loadMarkdown();
        await loadAiSummaries();
      } catch (error) {
        if (import.meta.env.DEV)
          console.error('[hoego] 마크다운 동기화 실패', error);
      } finally {
        setIsSyncing(false);
      }
    })();
  }, [isSyncing, loadMarkdown, loadAiSummaries]);

  const handlePipelineExecution = React.useCallback(() => {
    void (async () => {
      // Run the pipeline (streaming feedback)
      await handleRunPipeline();
    })();
  }, [handleRunPipeline]);

  const handlePipelineCancellation = React.useCallback(() => {
    void (async () => {
      // Cancel the running pipeline
      await handleCancelPipeline();
    })();
  }, [handleCancelPipeline]);

  // Sidebar handlers
  const handleHomeClick = React.useCallback(() => {
    void (async () => {
      try {
        // 편집 중이면 먼저 저장
        if (isEditing && markdownContent !== lastSavedRef.current) {
          setIsSaving(true);
          // ✅ 변경: Active Document 사용
          const { saveActiveDocument } = useDocumentStore.getState();
          const result = await saveActiveDocument(markdownContent);

          if (!result.success) {
            throw new Error(result.error);
          }

          lastSavedRef.current = markdownContent;
          setIsSaving(false);
        }

        // 오늘 날짜로 돌아가기
        setCurrentHistoryDate(null);

        // 편집 모드 종료
        if (isEditing) {
          setIsEditing(false);
        }

        // ✅ 변경: loadToday 사용
        const { loadToday } = useDocumentStore.getState();
        await loadToday();

        // appStore도 업데이트 (기존 동작 유지)
        const { activeDocument } = useDocumentStore.getState();
        if (activeDocument) {
          setMarkdownContent(activeDocument.content);
          setEditingContent(activeDocument.content);
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('[hoego] 오늘 문서 로드 실패:', error);
        }
        toast.error('오늘 문서를 불러오는데 실패했습니다.');
      }
    })();
  }, [isEditing, setIsEditing, markdownContent, lastSavedRef, setIsSaving, setMarkdownContent, setEditingContent]);

  const handleSettingsClick = React.useCallback(() => {
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

  const handleHistoryFileClick = React.useCallback(
    (file: (typeof historyFiles)[0]) => {
      void (async () => {
        try {
          // 편집 중이면 먼저 저장
          if (isEditing && markdownContent !== lastSavedRef.current) {
            setIsSaving(true);
            // ✅ 변경: Active Document 사용
            const { saveActiveDocument } = useDocumentStore.getState();
            const result = await saveActiveDocument(markdownContent);

            if (!result.success) {
              throw new Error(result.error);
            }

            lastSavedRef.current = markdownContent;
            setIsSaving(false);
          }

          setIsLoadingHistoryContent(true);
          setCurrentHistoryDate(file.date);

          // 편집 모드 종료
          if (isEditing) {
            setIsEditing(false);
          }

          // ✅ 변경: loadHistory 사용
          const { loadHistory } = useDocumentStore.getState();
          await loadHistory(file.date, file.path);

          // appStore도 업데이트 (기존 동작 유지)
          const { activeDocument } = useDocumentStore.getState();
          if (activeDocument) {
            setMarkdownContent(activeDocument.content);
            setEditingContent(activeDocument.content);
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
    [setMarkdownContent, setEditingContent, isEditing, setIsEditing, markdownContent, lastSavedRef, setIsSaving]
  );

  // Cleanup streaming on unmount
  React.useEffect(() => {
    const cleanup = streamingCleanupRef.current;
    return () => {
      if (cleanup) {
        cleanup();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mini 모드일 때 윈도우 위치 저장
  React.useEffect(() => {
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

  // Mini 모드: 입력창만 표시
  if (viewMode === 'mini') {
    return (
      <div
        className={`relative flex h-full w-full items-center justify-center ${
          isDarkMode ? 'bg-transparent' : 'bg-transparent'
        }`}
      >
        <div className="w-full h-full">
          <MiniHeader
            inputRef={inputRef}
            inputValue={inputValue}
            setInputValue={setInputValue}
            handleSubmit={handleSubmit}
            onExpandClick={() => {
              void switchToExpanded();
            }}
            isDarkMode={isDarkMode}
          />
        </div>
      </div>
    );
  }

  // Expanded 모드: 전체 UI 표시
  return (
    <div
      className={`relative flex h-full w-full flex-row overflow-hidden ${
        isDarkMode ? 'bg-[#0d1016]' : 'bg-white'
      }`}
    >
      {/* Sidebar */}
      <Sidebar
        isDarkMode={isDarkMode}
        isOpen={isSidebarOpen}
        historyFiles={historyFiles}
        isLoadingHistory={isLoadingHistory}
        onToggle={toggleSidebar}
        onHomeClick={handleHomeClick}
        onSettingsClick={handleSettingsClick}
        onHistoryFileClick={handleHistoryFileClick}
      />

      {/* Main content */}
      <div
        className={`flex-1 flex flex-col overflow-hidden ${
          isSidebarOpen ? 'ml-56' : 'ml-0'
        } transition-all duration-200`}
      >
        <Header
          isAiPanelExpanded={isAiPanelExpanded}
          setIsAiPanelExpanded={setIsAiPanelExpanded}
          isRetrospectPanelExpanded={isRetrospectPanelExpanded}
          setIsRetrospectPanelExpanded={setIsRetrospectPanelExpanded}
          handleManualSync={handleManualSync}
          isSyncing={isSyncing}
          themeMode={themeMode}
          toggleTheme={toggleTheme}
          isDarkMode={isDarkMode}
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
          switchToMini={switchToMini}
        />

        <div
          ref={splitRef}
          className="relative z-20 flex flex-1 items-stretch gap-0 px-0 py-0 overflow-hidden"
        >
          <DumpPanel
            isDarkMode={isDarkMode}
            isEditing={isEditing}
            dumpContent={
              isLoadingHistoryContent
                ? '로딩 중...'
                : isEditing
                  ? editingContent
                  : markdownContent
            }
            setDumpContent={isEditing ? setEditingContent : setMarkdownContent}
            markdownRef={markdownRef}
            editorRef={editorRef}
            appendTimestampToLine={appendTimestampToLine}
            markdownComponents={markdownComponents}
            currentDateLabel={currentHistoryDate ?? undefined}
            setIsEditing={setIsEditing}
            isSaving={isSaving}
            isHistoryMode={!!currentHistoryDate}
          />

          <React.Suspense fallback={<div className="flex flex-1" />}>
            <AiPanel
              isDarkMode={isDarkMode}
              isAiPanelExpanded={isAiPanelExpanded}
              isPipelineRunning={isPipelineRunning}
              pipelineStage={pipelineStage}
              streamingAiText={streamingAiText}
              summariesError={summariesError}
              aiSummaries={aiSummaries}
              selectedSummary={selectedSummary}
              markdownComponents={markdownComponents}
              handleRunPipeline={handlePipelineExecution}
              handleCancelPipeline={handlePipelineCancellation}
            />
          </React.Suspense>

          <React.Suspense fallback={<div className="flex flex-1" />}>
            <RetrospectPanel
              isDarkMode={isDarkMode}
              isRetrospectPanelExpanded={isRetrospectPanelExpanded}
              retrospectContent={retrospectContent}
              setRetrospectContent={setRetrospectContent}
              retrospectRef={retrospectRef}
              isSavingRetrospect={isSavingRetrospect}
              isEditingRetrospect={isEditingRetrospect}
              setIsEditingRetrospect={setIsEditingRetrospect}
              markdownComponents={markdownComponents}
            />
          </React.Suspense>
        </div>

        {/* 드래그 가능한 영역 - 가장자리 (더 넓게) */}
        {/* 상단 가장자리 */}
        <div
          className="absolute top-0 left-0 right-0 h-12 z-30 cursor-move"
          data-tauri-drag-region
        />
        {/* 좌측 가장자리 (사이드바 고려) */}
        <div
          className={`absolute top-12 bottom-12 left-0 w-12 z-30 cursor-move transition-all duration-200`}
          data-tauri-drag-region
        />

        <Footer isDarkMode={isDarkMode} />

        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#333',
              color: '#fff',
            },
          }}
        />
      </div>

      {/* Floating Mini Bar - positioned at bottom */}
      <FloatingMiniBar
        inputRef={inputRef}
        inputValue={inputValue}
        setInputValue={setInputValue}
        handleSubmit={handleSubmit}
        onMinimizeClick={() => {
          void switchToMini();
        }}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}
