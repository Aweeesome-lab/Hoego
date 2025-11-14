import React from "react";
import {
  Clock,
  Moon,
  Sun,
  MonitorSmartphone,
  Pencil,
  Check,
  RotateCcw,
  Sparkles,
  Loader2,
  Brain,
  NotebookPen,
} from "lucide-react";
import { hideOverlayWindow } from "@/lib/tauri";

interface HeaderProps {
  currentTime: string;
  inputRef: React.RefObject<HTMLInputElement>;
  inputValue: string;
  setInputValue: (value: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isEditing: boolean;
  setIsEditing: (value: boolean) => void;
  setEditingContent: (content: string) => void;
  markdownContent: string;
  editorRef: React.RefObject<HTMLTextAreaElement>;
  editingContent: string;
  appendTimestampToLine: (line: string) => string;
  saveTodayMarkdown: (content: string) => Promise<void>;
  lastSavedRef: React.MutableRefObject<string>;
  loadMarkdown: () => Promise<void>;
  isSaving: boolean;
  setIsSaving: (value: boolean) => void;
  handleGenerateAiFeedback: () => void;
  isGeneratingAiFeedback: boolean;
  isAiPanelExpanded: boolean;
  setIsAiPanelExpanded: (value: boolean | ((prev: boolean) => boolean)) => void;
  isRetrospectPanelExpanded: boolean;
  setIsRetrospectPanelExpanded: (value: boolean | ((prev: boolean) => boolean)) => void;
  handleManualSync: () => void;
  isSyncing: boolean;
  themeMode: "light" | "dark" | "system";
  toggleTheme: () => void;
  isDarkMode: boolean;
}

export function Header({
  currentTime,
  inputRef,
  inputValue,
  setInputValue,
  handleSubmit,
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
  isSaving,
  setIsSaving,
  handleGenerateAiFeedback,
  isGeneratingAiFeedback,
  isAiPanelExpanded,
  setIsAiPanelExpanded,
  isRetrospectPanelExpanded,
  setIsRetrospectPanelExpanded,
  handleManualSync,
  isSyncing,
  themeMode,
  toggleTheme,
  isDarkMode,
}: HeaderProps) {
  return (
    <div
      className={`relative z-50 flex h-16 shrink-0 items-center gap-3 border-b px-4 ${
        isDarkMode
          ? "border-white/10 bg-[#12151d]/90"
          : "border-slate-200/50 bg-slate-50/90"
      }`}
    >
      <button
        type="button"
        className={`flex h-8 items-center rounded-full border px-3 text-xs font-semibold ${
          isDarkMode
            ? "border-white/10 bg-[#0a0d13]/80 text-slate-300"
            : "border-slate-200 bg-white text-slate-700"
        }`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <Clock className="mr-1.5 h-3.5 w-3.5" />
        {currentTime}
      </button>
      <form
        onSubmit={handleSubmit}
        className="flex flex-1 min-w-0"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              void hideOverlayWindow();
            }
          }}
          placeholder="생각을 쏟아내보세요."
          className={`h-9 flex-1 min-w-0 rounded-md border-0 text-[13px] focus:outline-none focus:ring-2 focus:ring-offset-0 ${
            isDarkMode
              ? "bg-slate-800/50 text-slate-100 placeholder:text-slate-500 focus:ring-slate-600 focus:bg-slate-800/80"
              : "bg-slate-100/50 text-slate-900 placeholder:text-slate-400 focus:ring-slate-400 focus:bg-slate-100/80"
          }`}
          style={{ padding: "0 12px" }}
          autoFocus
        />
      </form>
      {isEditing ? (
        <div
          className="flex items-center gap-2"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={async () => {
              // 편집 종료: 현재 줄에 타임스탬프 부착 후 저장/종료
              let contentToSave = editingContent;
              const el = editorRef.current;
              if (el) {
                const start = el.selectionStart;
                const end = el.selectionEnd;
                const before = editingContent.slice(0, start);
                const after = editingContent.slice(end);
                const lineStart = before.lastIndexOf("\n") + 1;
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
                  console.error("[hoego] 저장 실패:", error);
              } finally {
                setIsSaving(false);
                setIsEditing(false);
              }
            }}
            className={`flex h-8 items-center rounded-full border px-3 text-xs font-semibold ${
              isDarkMode
                ? "border-white/10 bg-[#0a0d13]/80 text-slate-200"
                : "border-slate-200 bg-white text-slate-700"
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
              ? "border-white/10 bg-[#0a0d13]/80 text-slate-300 hover:bg-white/10"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
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
        onClick={handleGenerateAiFeedback}
        onMouseDown={(e) => e.stopPropagation()}
        disabled={isGeneratingAiFeedback}
        className={`flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition ${
          isDarkMode
            ? "border-white/10 text-slate-300 hover:bg-white/5 hover:text-white disabled:opacity-60"
            : "border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-60"
        }`}
        title="AI 피드백 생성"
      >
        {isGeneratingAiFeedback ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        <span>{isGeneratingAiFeedback ? "생성 중..." : "AI 피드백"}</span>
      </button>
      <button
        type="button"
        onClick={() => setIsAiPanelExpanded((prev) => !prev)}
        className={`flex h-8 w-8 items-center justify-center rounded-full border transition ${
          isAiPanelExpanded
            ? isDarkMode
              ? "border-white/20 bg-white/10 text-slate-200"
              : "border-slate-300 bg-slate-100 text-slate-700"
            : isDarkMode
            ? "border-white/10 bg-[#0a0d13]/80 text-slate-400 hover:text-slate-200"
            : "border-slate-200 bg-white text-slate-600 hover:text-slate-900"
        }`}
        onMouseDown={(e) => e.stopPropagation()}
        title={
          isAiPanelExpanded ? "정리하기 패널 접기" : "정리하기 패널 펼치기"
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
              ? "border-white/20 bg-white/10 text-slate-200"
              : "border-slate-300 bg-slate-100 text-slate-700"
            : isDarkMode
            ? "border-white/10 bg-[#0a0d13]/80 text-slate-400 hover:text-slate-200"
            : "border-slate-200 bg-white text-slate-600 hover:text-slate-900"
        }`}
        onMouseDown={(e) => e.stopPropagation()}
        title={
          isRetrospectPanelExpanded ? "회고 패널 접기" : "회고 패널 펼치기"
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
            ? "border-white/10 bg-[#0a0d13]/80 text-slate-400 hover:text-slate-200"
            : "border-slate-200 bg-white text-slate-600 hover:text-slate-900"
        } ${isSyncing ? "opacity-80" : ""}`}
        onMouseDown={(e) => e.stopPropagation()}
        disabled={isSyncing}
        title="마크다운 동기화"
      >
        <RotateCcw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
      </button>
      <button
        type="button"
        onClick={toggleTheme}
        className={`flex h-8 w-8 items-center justify-center rounded-full border transition ${
          isDarkMode
            ? "border-white/10 bg-[#0a0d13]/80 text-slate-400 hover:text-slate-200"
            : "border-slate-200 bg-white text-slate-600 hover:text-slate-900"
        }`}
        onMouseDown={(e) => e.stopPropagation()}
        title={
          themeMode === "light"
            ? "라이트 모드"
            : themeMode === "dark"
            ? "다크 모드"
            : "시스템 테마"
        }
      >
        {themeMode === "light" ? (
          <Sun className="h-4 w-4" />
        ) : themeMode === "dark" ? (
          <Moon className="h-4 w-4" />
        ) : (
          <MonitorSmartphone className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}
