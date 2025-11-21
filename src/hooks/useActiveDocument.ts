import { useCallback } from 'react';
import toast from 'react-hot-toast';

import {
  useDocumentStore,
  documentSelectors,
} from '@/store/documentStore';
import type { SaveResult } from '@/types/document';

/**
 * Hook for managing the active document
 *
 * This hook provides a clean interface to the document store,
 * handling all the complexity of switching between today and history documents.
 *
 * @example
 * ```tsx
 * const {
 *   activeDocument,
 *   content,
 *   isToday,
 *   loadToday,
 *   saveActiveDocument,
 *   updateContent,
 * } = useActiveDocument();
 *
 * // Load today's document
 * await loadToday();
 *
 * // Update content
 * updateContent('new content');
 *
 * // Save
 * await saveActiveDocument();
 * ```
 */
export function useActiveDocument() {
  // Selectors
  const activeDocument = useDocumentStore(documentSelectors.activeDocument);
  const content = useDocumentStore(documentSelectors.content);
  const isToday = useDocumentStore(documentSelectors.isToday);
  const isHistory = useDocumentStore(documentSelectors.isHistory);
  const isDirty = useDocumentStore(documentSelectors.isDirty);
  const isLoading = useDocumentStore(documentSelectors.isLoading);
  const isSaving = useDocumentStore(documentSelectors.isSaving);
  const lastError = useDocumentStore(documentSelectors.lastError);
  const activeDate = useDocumentStore(documentSelectors.activeDate);
  const activePath = useDocumentStore(documentSelectors.activePath);

  // Actions
  const loadTodayAction = useDocumentStore((state) => state.loadToday);
  const loadHistoryAction = useDocumentStore((state) => state.loadHistory);
  const saveActiveDocumentAction = useDocumentStore(
    (state) => state.saveActiveDocument
  );
  const updateContentAction = useDocumentStore((state) => state.updateContent);
  const markDirtyAction = useDocumentStore((state) => state.markDirty);
  const clearActiveDocumentAction = useDocumentStore(
    (state) => state.clearActiveDocument
  );

  /**
   * Load today's document
   */
  const loadToday = useCallback(async () => {
    try {
      await loadTodayAction();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      toast.error(`오늘 문서를 불러오는데 실패했습니다: ${errorMessage}`);
      throw error;
    }
  }, [loadTodayAction]);

  /**
   * Load a history document
   */
  const loadHistory = useCallback(
    async (date: string, filePath: string) => {
      try {
        await loadHistoryAction(date, filePath);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        toast.error(`히스토리 문서를 불러오는데 실패했습니다: ${errorMessage}`);
        throw error;
      }
    },
    [loadHistoryAction]
  );

  /**
   * Save the currently active document
   *
   * Automatically routes to the correct save function based on
   * whether we're viewing today or a history document.
   */
  const saveActiveDocument = useCallback(
    async (content?: string): Promise<SaveResult> => {
      const result = await saveActiveDocumentAction(content);

      if (!result.success) {
        toast.error(`저장 실패: ${result.error}`);
      }

      return result;
    },
    [saveActiveDocumentAction]
  );

  /**
   * Update the content of the active document
   *
   * This will mark the document as dirty if the content changes.
   */
  const updateContent = useCallback(
    (newContent: string) => {
      updateContentAction(newContent);
    },
    [updateContentAction]
  );

  /**
   * Mark the active document as having unsaved changes
   */
  const markDirty = useCallback(() => {
    markDirtyAction();
  }, [markDirtyAction]);

  /**
   * Clear the active document
   */
  const clearActiveDocument = useCallback(() => {
    clearActiveDocumentAction();
  }, [clearActiveDocumentAction]);

  /**
   * Check if we can edit the active document
   *
   * Today's document is always editable.
   * History documents are editable (we want to allow fixing typos).
   */
  const canEdit = activeDocument !== null;

  /**
   * Get a human-readable label for the active document
   */
  const activeLabel = activeDocument
    ? activeDocument.type === 'today'
      ? '오늘'
      : `${activeDocument.date.slice(0, 4)}년 ${activeDocument.date.slice(4, 6)}월 ${activeDocument.date.slice(6, 8)}일`
    : '';

  return {
    // State
    activeDocument,
    content,
    isToday,
    isHistory,
    isDirty,
    isLoading,
    isSaving,
    lastError,
    activeDate,
    activePath,
    canEdit,
    activeLabel,

    // Actions
    loadToday,
    loadHistory,
    saveActiveDocument,
    updateContent,
    markDirty,
    clearActiveDocument,
  };
}

/**
 * Hook to check if we're currently viewing today's document
 */
export function useIsToday() {
  return useDocumentStore(documentSelectors.isToday);
}

/**
 * Hook to check if we're currently viewing a history document
 */
export function useIsHistory() {
  return useDocumentStore(documentSelectors.isHistory);
}

/**
 * Hook to get the active document content only
 */
export function useActiveContent() {
  return useDocumentStore(documentSelectors.content);
}

/**
 * Hook to get the active document's dirty state
 */
export function useIsDirty() {
  return useDocumentStore(documentSelectors.isDirty);
}

/**
 * Hook to get saving state
 */
export function useIsSaving() {
  return useDocumentStore(documentSelectors.isSaving);
}
