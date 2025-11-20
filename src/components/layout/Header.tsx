import {
  Moon,
  Sun,
  MonitorSmartphone,
  Pencil,
  Check,
  RotateCcw,
  Brain,
  NotebookPen,
  PanelLeftOpen,
  PanelLeftClose,
  Minimize2,
} from 'lucide-react';
import React from 'react';

import { hideOverlayWindow } from '@/lib/tauri';

interface HeaderProps {
  /**
   * 현재 시간 (HH:MM 형식)
   * @example "14:30"
   */
  currentTime: string;

  /**
   * 편집 모드 활성화 여부
   * - true: 편집 모드 (textarea 표시)
   * - false: 뷰 모드 (markdown 렌더링)
   */
  isEditing: boolean;

  /**
   * 편집 모드 상태 변경 함수
   */
  setIsEditing: (value: boolean) => void;

  /**
   * 편집 중인 내용 설정 함수
   */
  setEditingContent: (content: string) => void;

  /**
   * 현재 마크다운 내용
   */
  markdownContent: string;

  /**
   * 마크다운 에디터 textarea ref
   */
  editorRef: React.RefObject<HTMLTextAreaElement>;

  /**
   * 편집 중인 마크다운 내용
   */
  editingContent: string;

  /**
   * 현재 줄에 타임스탬프를 추가하는 함수
   * @param line - 타임스탬프를 추가할 텍스트 줄
   * @returns 타임스탬프가 추가된 줄
   */
  appendTimestampToLine: (line: string) => string;

  /**
   * 마크다운 내용 저장 함수
   */
  saveTodayMarkdown: (content: string) => Promise<void>;

  /**
   * 마지막으로 저장된 내용 ref
   * 변경 감지 및 중복 저장 방지에 사용
   */
  lastSavedRef: React.MutableRefObject<string>;

  /**
   * 마크다운 내용 로드 함수
   */
  loadMarkdown: () => Promise<void>;

  /**
   * 저장 중 상태
   */
  isSaving: boolean;

  /**
   * 저장 상태 변경 함수
   */
  setIsSaving: (value: boolean) => void;

  /**
   * AI 패널 확장 상태
   */
  isAiPanelExpanded: boolean;

  /**
   * AI 패널 확장 상태 변경 함수
   * @param value - 새로운 상태값 또는 이전 상태를 받는 함수
   */
  setIsAiPanelExpanded: (value: boolean | ((prev: boolean) => boolean)) => void;

  /**
   * 회고 패널 확장 상태
   */
  isRetrospectPanelExpanded: boolean;

  /**
   * 회고 패널 확장 상태 변경 함수
   * @param value - 새로운 상태값 또는 이전 상태를 받는 함수
   */
  setIsRetrospectPanelExpanded: (
    value: boolean | ((prev: boolean) => boolean)
  ) => void;

  /**
   * 수동 동기화 핸들러
   * 마크다운과 AI 요약을 다시 로드합니다
   */
  handleManualSync: () => void;

  /**
   * 동기화 중 상태
   */
  isSyncing: boolean;

  /**
   * 테마 모드
   * - "light": 라이트 모드
   * - "dark": 다크 모드
   * - "system": 시스템 설정 따름
   */
  themeMode: 'light' | 'dark' | 'system';

  /**
   * 테마 전환 함수 (light → dark → system → light)
   */
  toggleTheme: () => void;

  /**
   * 다크모드 활성화 여부 (계산된 값)
   */
  isDarkMode: boolean;

  /**
   * 사이드바 열림 상태
   */
  isSidebarOpen: boolean;

  /**
   * 사이드바 토글 함수
   */
  toggleSidebar: () => void;

  /**
   * Mini 모드로 축소 함수 (선택사항)
   */
  switchToMini?: () => void;
}

export function Header({
  currentTime,
  isEditing,
  setIsEditing,
  setEditingContent,
  markdownContent,
  editorRef,
  editingContent,
  appendTimestampToLine,
  saveTodayMarkdown,
  lastSavedRef,
  loadMarkdown,
  isSaving: _isSaving,
  setIsSaving,
  isAiPanelExpanded,
  setIsAiPanelExpanded,
  isRetrospectPanelExpanded,
  setIsRetrospectPanelExpanded,
  handleManualSync,
  isSyncing,
  themeMode,
  toggleTheme,
  isDarkMode,
  isSidebarOpen,
  toggleSidebar,
  switchToMini,
}: HeaderProps) {
  return (
    <div
      className={`relative z-50 flex h-16 shrink-0 items-center gap-3 border-b px-4 ${
        isDarkMode
          ? 'border-white/10 bg-[#12151d]/90'
          : 'border-slate-200/50 bg-slate-50/90'
      }`}
    >
      {/* Sidebar Toggle Button */}
      <button
        type="button"
        onClick={toggleSidebar}
        className={`flex h-8 w-8 items-center justify-center rounded-full border transition-all ${
          isDarkMode
            ? 'border-white/10 bg-[#0a0d13]/80 text-slate-300 hover:bg-slate-800/80'
            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
        }`}
        aria-label={isSidebarOpen ? '사이드바 닫기' : '사이드바 열기'}
      >
        {isSidebarOpen ? (
          <PanelLeftClose className="h-3.5 w-3.5" />
        ) : (
          <PanelLeftOpen className="h-3.5 w-3.5" />
        )}
      </button>

      <div className="flex-1" />
      {isEditing ? (
        <div
          className="flex items-center gap-2"
          onMouseDown={(e) => e.stopPropagation()}
          role="toolbar"
          aria-label="편집 도구"
        >
          <button
            type="button"
            onClick={() => {
              void (async () => {
                // 편집 종료: 현재 줄에 타임스탬프 부착 후 저장/종료
                let contentToSave = editingContent;
                const el = editorRef.current;
                if (el) {
                  const start = el.selectionStart;
                  const end = el.selectionEnd;
                  const before = editingContent.slice(0, start);
                  const after = editingContent.slice(end);
                  const lineStart = before.lastIndexOf('\n') + 1;
                  const currentLine = before.slice(lineStart);
                  const stampedLine = appendTimestampToLine(currentLine);
                  const newContent =
                    editingContent.slice(0, lineStart) + stampedLine + after;
                  if (newContent !== editingContent) {
                    setEditingContent(newContent);
                    contentToSave = newContent;
                  }
                }
                try {
                  setIsSaving(true);
                  if (contentToSave !== lastSavedRef.current) {
                    await saveTodayMarkdown(contentToSave);
                    lastSavedRef.current = contentToSave;
                  }
                  await loadMarkdown();
                } catch (error) {
                  if (import.meta.env.DEV)
                    console.error('[hoego] 저장 실패:', error);
                } finally {
                  setIsSaving(false);
                  setIsEditing(false);
                }
              })();
            }}
            className={`flex h-8 items-center rounded-full border px-3 text-xs font-semibold ${
              isDarkMode
                ? 'border-white/10 bg-[#0a0d13]/80 text-slate-200'
                : 'border-slate-200 bg-white text-slate-700'
            }`}
          >
            <Check className="mr-1.5 h-3.5 w-3.5" /> 완료
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setEditingContent(markdownContent);
            setIsEditing(true);
          }}
          className={`flex h-8 w-8 items-center justify-center rounded-full border ${
            isDarkMode
              ? 'border-white/10 bg-[#0a0d13]/80 text-slate-300 hover:bg-white/10'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
          }`}
          onMouseDown={(e) => e.stopPropagation()}
          title="편집 모드 열기"
          aria-label="편집 모드 열기"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      )}
      <button
        type="button"
        onClick={() => setIsAiPanelExpanded((prev) => !prev)}
        className={`flex h-8 w-8 items-center justify-center rounded-full border transition ${
          isAiPanelExpanded
            ? isDarkMode
              ? 'border-white/20 bg-white/10 text-slate-200'
              : 'border-slate-300 bg-slate-100 text-slate-700'
            : isDarkMode
              ? 'border-white/10 bg-[#0a0d13]/80 text-slate-400 hover:text-slate-200'
              : 'border-slate-200 bg-white text-slate-600 hover:text-slate-900'
        }`}
        onMouseDown={(e) => e.stopPropagation()}
        title={
          isAiPanelExpanded ? '정리하기 패널 접기' : '정리하기 패널 펼치기'
        }
      >
        <Brain className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => setIsRetrospectPanelExpanded((prev) => !prev)}
        className={`flex h-8 w-8 items-center justify-center rounded-full border transition ${
          isRetrospectPanelExpanded
            ? isDarkMode
              ? 'border-white/20 bg-white/10 text-slate-200'
              : 'border-slate-300 bg-slate-100 text-slate-700'
            : isDarkMode
              ? 'border-white/10 bg-[#0a0d13]/80 text-slate-400 hover:text-slate-200'
              : 'border-slate-200 bg-white text-slate-600 hover:text-slate-900'
        }`}
        onMouseDown={(e) => e.stopPropagation()}
        title={
          isRetrospectPanelExpanded ? '회고 패널 접기' : '회고 패널 펼치기'
        }
      >
        <NotebookPen className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => {
          void handleManualSync();
        }}
        className={`flex h-8 w-8 items-center justify-center rounded-full border transition ${
          isDarkMode
            ? 'border-white/10 bg-[#0a0d13]/80 text-slate-400 hover:text-slate-200'
            : 'border-slate-200 bg-white text-slate-600 hover:text-slate-900'
        } ${isSyncing ? 'opacity-80' : ''}`}
        onMouseDown={(e) => e.stopPropagation()}
        disabled={isSyncing}
        title="마크다운 동기화"
      >
        <RotateCcw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
      </button>
      {switchToMini && (
        <button
          type="button"
          onClick={() => {
            void switchToMini();
          }}
          className={`flex h-8 w-8 items-center justify-center rounded-full border transition ${
            isDarkMode
              ? 'border-white/10 bg-[#0a0d13]/80 text-slate-400 hover:text-slate-200'
              : 'border-slate-200 bg-white text-slate-600 hover:text-slate-900'
          }`}
          onMouseDown={(e) => e.stopPropagation()}
          title="Mini 모드로 축소"
        >
          <Minimize2 className="h-4 w-4" />
        </button>
      )}
      <button
        type="button"
        onClick={toggleTheme}
        className={`flex h-8 w-8 items-center justify-center rounded-full border transition ${
          isDarkMode
            ? 'border-white/10 bg-[#0a0d13]/80 text-slate-400 hover:text-slate-200'
            : 'border-slate-200 bg-white text-slate-600 hover:text-slate-900'
        }`}
        onMouseDown={(e) => e.stopPropagation()}
        title={
          themeMode === 'light'
            ? '라이트 모드'
            : themeMode === 'dark'
              ? '다크 모드'
              : '시스템 테마'
        }
      >
        {themeMode === 'light' ? (
          <Sun className="h-4 w-4" />
        ) : themeMode === 'dark' ? (
          <Moon className="h-4 w-4" />
        ) : (
          <MonitorSmartphone className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}
