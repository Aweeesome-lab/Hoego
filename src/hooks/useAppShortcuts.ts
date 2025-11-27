import { useEffect } from 'react';

import type React from 'react';

import { hideOverlayWindow } from '@/lib/tauri';

interface UseAppShortcutsProps {
  toggleSidebar: () => void;
  setIsFeedbackPanelExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  setIsRetrospectPanelExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  isEditing: boolean;
  setIsEditing: (isEditing: boolean) => void;
  editorRef: React.RefObject<HTMLTextAreaElement>;
  editingContent: string;
  setEditingContent: (content: string) => void;
  appendTimestampToLine: (line: string) => string;
  saveTodayMarkdown: (content: string) => Promise<void>;
  lastSavedRef: React.MutableRefObject<string>;
  loadMarkdown: (scrollToBottom?: boolean) => Promise<void>;
  setIsSaving: (isSaving: boolean) => void;
  markdownContent: string;
}

export const useAppShortcuts = ({
  toggleSidebar,
  setIsFeedbackPanelExpanded,
  setIsRetrospectPanelExpanded,
  isEditing,
  setIsEditing,
  editorRef,
  editingContent,
  setEditingContent,
  appendTimestampToLine,
  saveTodayMarkdown,
  lastSavedRef,
  loadMarkdown,
  setIsSaving,
  markdownContent,
}: UseAppShortcutsProps) => {
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      // 사이드바 토글: Cmd/Ctrl + 1
      if ((event.metaKey || event.ctrlKey) && event.key === '1') {
        event.preventDefault();
        event.stopPropagation();
        toggleSidebar();
        return;
      }

      // 패널 토글: Cmd/Ctrl + 2 for Feedback panel
      if ((event.metaKey || event.ctrlKey) && event.key === '2') {
        event.preventDefault();
        event.stopPropagation();
        setIsFeedbackPanelExpanded((prev) => !prev);
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
              await saveTodayMarkdown(newContent);
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

      // ESC: 편집 중이면 편집 종료, 아니면 빠른 메모 창 숨김
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        if (isEditing) {
          // 편집 종료 시 저장 flush
          if (editingContent !== lastSavedRef.current) {
            void (async () => {
              try {
                setIsSaving(true);
                await saveTodayMarkdown(editingContent);
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
    setIsFeedbackPanelExpanded,
    setIsRetrospectPanelExpanded,
    isEditing,
    setIsEditing,
    editorRef,
    editingContent,
    setEditingContent,
    appendTimestampToLine,
    saveTodayMarkdown,
    lastSavedRef,
    loadMarkdown,
    setIsSaving,
    markdownContent,
  ]);
};
