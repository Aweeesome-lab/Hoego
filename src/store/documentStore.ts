import { create } from 'zustand';

import type { DocumentState, SaveResult } from '@/types/document';

import {
  getTodayMarkdown,
  saveTodayMarkdown,
  saveHistoryMarkdown,
} from '@/lib/tauri';
import { getCurrentDateKey } from '@/types/document';

/**
 * Document Store Actions
 */
interface DocumentActions {
  /**
   * Load today's document
   */
  loadToday: () => Promise<void>;

  /**
   * Load a history document
   */
  loadHistory: (date: string, filePath: string) => Promise<void>;

  /**
   * Save the currently active document
   */
  saveActiveDocument: (content?: string) => Promise<SaveResult>;

  /**
   * Update the content of the active document
   */
  updateContent: (content: string) => void;

  /**
   * Mark the active document as dirty (has unsaved changes)
   */
  markDirty: () => void;

  /**
   * Clear the active document
   */
  clearActiveDocument: () => void;

  /**
   * Set loading state
   */
  setIsLoading: (isLoading: boolean) => void;

  /**
   * Set saving state
   */
  setIsSaving: (isSaving: boolean) => void;

  /**
   * Set error state
   */
  setError: (error: string | null) => void;
}

/**
 * Complete Document Store
 */
export type DocumentStore = DocumentState & DocumentActions;

/**
 * Create the document store
 */
export const useDocumentStore = create<DocumentStore>((set, get) => ({
  // Initial state
  activeDocument: null,
  isLoading: false,
  isSaving: false,
  lastError: null,

  // Actions
  loadToday: async () => {
    set({ isLoading: true, lastError: null });

    try {
      const result = await getTodayMarkdown();
      const dateKey = getCurrentDateKey();

      set({
        activeDocument: {
          type: 'today',
          date: dateKey,
          filePath: null,
          content: result.content,
          isDirty: false,
          lastSaved: Date.now(),
        },
        isLoading: false,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      set({
        lastError: `Failed to load today's document: ${errorMessage}`,
        isLoading: false,
      });
      throw error;
    }
  },

  loadHistory: async (date: string, filePath: string) => {
    set({ isLoading: true, lastError: null });

    try {
      // Import dynamically to avoid circular dependencies
      const { getHistoryMarkdown } = await import('@/lib/tauri');
      const content = await getHistoryMarkdown(filePath);

      set({
        activeDocument: {
          type: 'history',
          date,
          filePath,
          content,
          isDirty: false,
          lastSaved: Date.now(),
        },
        isLoading: false,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      set({
        lastError: `Failed to load history document: ${errorMessage}`,
        isLoading: false,
      });
      throw error;
    }
  },

  saveActiveDocument: async (content?: string) => {
    const { activeDocument } = get();

    if (!activeDocument) {
      return {
        success: false,
        error: 'No active document to save',
        timestamp: Date.now(),
      };
    }

    // Use provided content or current content
    const contentToSave = content ?? activeDocument.content;

    set({ isSaving: true, lastError: null });

    try {
      // Route to correct save function based on document type
      if (activeDocument.type === 'today') {
        await saveTodayMarkdown(contentToSave);
      } else if (activeDocument.type === 'history' && activeDocument.filePath) {
        await saveHistoryMarkdown(activeDocument.filePath, contentToSave);
      } else {
        throw new Error(
          'Invalid document state: missing file path for history document'
        );
      }

      // Update active document state
      set({
        activeDocument: {
          ...activeDocument,
          content: contentToSave,
          isDirty: false,
          lastSaved: Date.now(),
        },
        isSaving: false,
      });

      return {
        success: true,
        timestamp: Date.now(),
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      set({
        lastError: `Failed to save document: ${errorMessage}`,
        isSaving: false,
      });

      return {
        success: false,
        error: errorMessage,
        timestamp: Date.now(),
      };
    }
  },

  updateContent: (content: string) => {
    const { activeDocument } = get();

    if (!activeDocument) {
      return;
    }

    set({
      activeDocument: {
        ...activeDocument,
        content,
        isDirty: content !== activeDocument.content,
      },
    });
  },

  markDirty: () => {
    const { activeDocument } = get();

    if (!activeDocument) {
      return;
    }

    set({
      activeDocument: {
        ...activeDocument,
        isDirty: true,
      },
    });
  },

  clearActiveDocument: () => {
    set({
      activeDocument: null,
      lastError: null,
    });
  },

  setIsLoading: (isLoading: boolean) => {
    set({ isLoading });
  },

  setIsSaving: (isSaving: boolean) => {
    set({ isSaving });
  },

  setError: (error: string | null) => {
    set({ lastError: error });
  },
}));

/**
 * Selectors for common use cases
 */
export const documentSelectors = {
  /**
   * Get the active document
   */
  activeDocument: (state: DocumentStore) => state.activeDocument,

  /**
   * Get the active document content
   */
  content: (state: DocumentStore) => state.activeDocument?.content ?? '',

  /**
   * Check if the active document is today
   */
  isToday: (state: DocumentStore) => state.activeDocument?.type === 'today',

  /**
   * Check if the active document is history
   */
  isHistory: (state: DocumentStore) => state.activeDocument?.type === 'history',

  /**
   * Check if the active document has unsaved changes
   */
  isDirty: (state: DocumentStore) => state.activeDocument?.isDirty ?? false,

  /**
   * Check if currently loading
   */
  isLoading: (state: DocumentStore) => state.isLoading,

  /**
   * Check if currently saving
   */
  isSaving: (state: DocumentStore) => state.isSaving,

  /**
   * Get the last error
   */
  lastError: (state: DocumentStore) => state.lastError,

  /**
   * Get the active document date
   */
  activeDate: (state: DocumentStore) => state.activeDocument?.date ?? null,

  /**
   * Get the active document file path
   */
  activePath: (state: DocumentStore) => state.activeDocument?.filePath ?? null,
};
