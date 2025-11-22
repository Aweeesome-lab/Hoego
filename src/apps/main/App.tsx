import React from 'react';
import { Toaster } from 'react-hot-toast';

import type { Position } from 'unist';

import {
  Header,
  MiniHeader,
  FloatingMiniBar,
  Footer,
  Sidebar,
} from '@/components/layout';
import { OnboardingModal, useOnboarding } from '@/components/OnboardingModal';
import { DumpPanel } from '@/components/panels';
import { UpdateDialog } from '@/components/UpdateDialog';
import {
  useTheme,
  useMarkdown,
  useRetrospect,
  useSidebar,
  useViewMode,
  useAppEffects,
} from '@/hooks';
import { useAiPipeline } from '@/hooks/useAiPipeline';
import { useAppHandlers } from '@/hooks/useAppHandlers';
import { useAppKeyboardShortcuts } from '@/hooks/useAppKeyboardShortcuts';
import { useAppState } from '@/hooks/useAppState';

// Code splitting: lazy load panels that are conditionally rendered
const FeedbackPanel = React.lazy(() =>
  import('@/components/panels').then((module) => ({
    default: module.FeedbackPanel,
  }))
);
const RetrospectPanel = React.lazy(() =>
  import('@/components/panels').then((module) => ({
    default: module.RetrospectPanel,
  }))
);

export default function App() {
  const inputRef = React.useRef<HTMLTextAreaElement | null>(null);
  const editorRef = React.useRef<HTMLTextAreaElement | null>(null);
  const splitRef = React.useRef<HTMLDivElement | null>(null);

  // Use custom hooks for state management
  const {
    inputValue,
    setInputValue,
    isSyncing,
    setIsSyncing,
    isFeedbackPanelExpanded,
    setIsFeedbackPanelExpanded,
    isRetrospectPanelExpanded,
    setIsRetrospectPanelExpanded,
    currentHistoryDate,
    setCurrentHistoryDate,
    isLoadingHistoryContent,
    setIsLoadingHistoryContent,
  } = useAppState();

  // Use custom hooks for theme, markdown, etc.
  const { themeMode, isDarkMode, toggleTheme } = useTheme();
  const {
    markdownRef,
    markdownContent,
    setMarkdownContent,
    lastMinute,
    setLastMinute,
    isSaving,
    lastSavedRef,
    loadMarkdown,
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

  const { retrospectContent } = useRetrospect({ currentHistoryDate });

  const {
    isSidebarOpen,
    historyFiles,
    isLoadingHistory,
    loadHistoryFiles,
    toggleSidebar,
  } = useSidebar();

  const { viewMode, switchToExpanded, switchToMini } = useViewMode();
  const { showOnboarding, completeOnboarding } = useOnboarding();

  const selectedSummary = React.useMemo(
    () => aiSummaries[selectedSummaryIndex] ?? null,
    [aiSummaries, selectedSummaryIndex]
  );

  // Use custom hook for all event handlers
  const {
    handleSubmit,
    handleManualSync,
    handlePipelineExecution,
    handlePipelineCancellation,
    handleSettingsClick,
    handleHistoryFileClick,
  } = useAppHandlers({
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
  });

  // Use custom hook for side effects
  useAppEffects({
    loadMarkdown,
    loadAiSummaries,
    loadHistoryFiles,
    currentHistoryDate,
    isSidebarOpen,
    viewMode,
    inputRef,
    streamingCleanupRef,
  });

  // Use custom hook for keyboard shortcuts
  useAppKeyboardShortcuts({
    toggleSidebar,
    setIsFeedbackPanelExpanded,
    setIsRetrospectPanelExpanded,
  });

  // Memoize task toggle handler to prevent unnecessary re-renders
  const handleTaskToggle = React.useCallback(
    async (position: Position, checked: boolean) => {
      await handleTaskCheckboxToggle({ position }, checked);
    },
    [handleTaskCheckboxToggle]
  );

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
        selectedDate={currentHistoryDate || undefined}
        onToggle={toggleSidebar}
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
          isAiPanelExpanded={isFeedbackPanelExpanded}
          setIsAiPanelExpanded={setIsFeedbackPanelExpanded}
          isRetrospectPanelExpanded={isRetrospectPanelExpanded}
          setIsRetrospectPanelExpanded={setIsRetrospectPanelExpanded}
          handleManualSync={handleManualSync}
          isSyncing={isSyncing}
          themeMode={themeMode}
          toggleTheme={toggleTheme}
          isDarkMode={isDarkMode}
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
          switchToMini={() => {
            void switchToMini();
          }}
        />

        <div
          ref={splitRef}
          className="relative z-20 flex flex-1 items-stretch gap-0 px-0 py-0 overflow-hidden"
        >
          <DumpPanel
            isDarkMode={isDarkMode}
            dumpContent={
              isLoadingHistoryContent ? '로딩 중...' : markdownContent
            }
            markdownRef={markdownRef}
            editorRef={editorRef}
            currentDateLabel={currentHistoryDate || undefined}
            isSaving={isSaving}
            onTaskToggle={handleTaskToggle}
          />

          <React.Suspense fallback={<div className="flex flex-1" />}>
            <FeedbackPanel
              isDarkMode={isDarkMode}
              isFeedbackPanelExpanded={isFeedbackPanelExpanded}
              isPipelineRunning={isPipelineRunning}
              pipelineStage={pipelineStage}
              streamingAiText={streamingAiText}
              summariesError={summariesError}
              aiSummaries={aiSummaries}
              selectedSummary={selectedSummary}
              handleRunPipeline={handlePipelineExecution}
              handleCancelPipeline={handlePipelineCancellation}
            />
          </React.Suspense>

          <React.Suspense fallback={<div className="flex flex-1" />}>
            <RetrospectPanel
              isDarkMode={isDarkMode}
              isRetrospectPanelExpanded={isRetrospectPanelExpanded}
              retrospectContent={retrospectContent}
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

        <UpdateDialog />

        {/* Onboarding Modal */}
        {showOnboarding && (
          <OnboardingModal
            isDarkMode={isDarkMode}
            onComplete={completeOnboarding}
          />
        )}
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
