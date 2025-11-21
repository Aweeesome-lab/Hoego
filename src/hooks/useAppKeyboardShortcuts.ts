import { useEffect } from 'react';

import { hideOverlayWindow } from '@/lib/tauri';
import { useDocumentStore } from '@/store/documentStore';

interface UseAppKeyboardShortcutsOptions {
  toggleSidebar: () => void;
  setIsFeedbackPanelExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  setIsRetrospectPanelExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  isEditing: boolean;
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
  editingContent: string;
  setIsSaving: React.Dispatch<React.SetStateAction<boolean>>;
  lastSavedRef: React.MutableRefObject<string>;
  loadMarkdown: () => Promise<void>;
}

/**
 * App의 키보드 단축키를 처리하는 커스텀 훅
 *
 * @param options - 단축키 핸들러에 필요한 상태와 함수들
 *
 * @example
 * ```tsx
 * useAppKeyboardShortcuts({
 *   toggleSidebar,
 *   setIsFeedbackPanelExpanded,
 *   setIsRetrospectPanelExpanded,
 *   isEditing,
 *   setIsEditing,
 *   editingContent,
 *   setIsSaving,
 *   lastSavedRef,
 *   loadMarkdown,
 * });
 * ```
 */
export function useAppKeyboardShortcuts({
  toggleSidebar,
  setIsFeedbackPanelExpanded,
  setIsRetrospectPanelExpanded,
  isEditing,
  setIsEditing,
  editingContent,
  setIsSaving,
  lastSavedRef,
  loadMarkdown,
}: UseAppKeyboardShortcutsOptions) {
  useEffect(() => {
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
    setIsFeedbackPanelExpanded,
    setIsRetrospectPanelExpanded,
    isEditing,
    editingContent,
    setIsEditing,
    setIsSaving,
    lastSavedRef,
    loadMarkdown,
  ]);
}
