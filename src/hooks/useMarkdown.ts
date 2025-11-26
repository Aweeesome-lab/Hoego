/**
 * useMarkdown Hook
 *
 * 마크다운 콘텐츠 로드, 저장, 동기화를 관리하는 훅
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';

import { getTodayMarkdown } from '@/lib/tauri';
import { useAppStore } from '@/store';
import { useDocumentStore } from '@/store/documentStore';

export function useMarkdown() {
  // Zustand store selectors
  const markdownContent = useAppStore((state) => state.markdownContent);
  const isEditing = useAppStore((state) => state.isEditing);
  const editingContent = useAppStore((state) => state.editingContent);
  const isSaving = useAppStore((state) => state.isSaving);
  const isSyncing = useAppStore((state) => state.isSyncing);

  const setMarkdownContent = useAppStore((state) => state.setMarkdownContent);
  const setIsSaving = useAppStore((state) => state.setIsSaving);
  const setIsSyncing = useAppStore((state) => state.setIsSyncing);

  // Local state
  const [lastMinute, setLastMinute] = useState('');

  // Refs
  const markdownRef = useRef<HTMLDivElement | null>(null);
  const lastSavedRef = useRef<string>('');
  const debounceIdRef = useRef<number | null>(null);

  // 마크다운 로드 함수
  const loadMarkdown = useCallback(async () => {
    try {
      const data = await getTodayMarkdown();
      setMarkdownContent(data.content);
      lastSavedRef.current = data.content;

      // Initialize documentStore with today's document
      await useDocumentStore.getState().loadToday();

      // 마지막 시간 추출
      const lines = data.content.split('\n');
      let latestMinute = '';
      for (let i = lines.length - 1; i >= 0; i--) {
        const rawLine = lines[i];
        if (!rawLine) continue;
        const trimmedLine = rawLine.trim();
        if (!trimmedLine) continue;

        const bulletMatch = trimmedLine.match(/\((\d{2}):(\d{2}):\d{2}\)\s*$/);
        if (trimmedLine.startsWith('- ') && bulletMatch) {
          latestMinute = `${bulletMatch[1]}:${bulletMatch[2]}`;
          break;
        }
        if (trimmedLine.startsWith('## ')) {
          latestMinute = trimmedLine.replace('## ', '').trim();
          break;
        }
      }
      setLastMinute(latestMinute);

      // 스크롤을 맨 아래로
      setTimeout(() => {
        if (markdownRef.current) {
          markdownRef.current.scrollTop = markdownRef.current.scrollHeight;
        }
      }, 100);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[hoego] 마크다운 로드 실패', error);
      }
      toast.error(
        `마크다운 로드 실패: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }, [setMarkdownContent]);

  // 수동 동기화 핸들러
  const handleManualSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      await loadMarkdown();
      toast.success('동기화 완료');
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[hoego] 동기화 실패:', error);
      }
      toast.error('동기화에 실패했습니다.');
    } finally {
      setIsSyncing(false);
    }
  }, [loadMarkdown, setIsSyncing]);

  // Auto-save for edit mode
  useEffect(() => {
    if (!isEditing) return;
    if (editingContent === lastSavedRef.current) return;

    // Clear existing timeout
    if (debounceIdRef.current) {
      clearTimeout(debounceIdRef.current);
    }

    // Set new timeout for auto-save (2초 디바운스)
    debounceIdRef.current = window.setTimeout(() => {
      void (async () => {
        try {
          setIsSaving(true);
          const saveResult = await useDocumentStore
            .getState()
            .saveActiveDocument(editingContent);

          if (!saveResult.success) {
            throw new Error(saveResult.error || 'Save failed');
          }

          setMarkdownContent(editingContent);
          lastSavedRef.current = editingContent;

          if (import.meta.env.DEV) {
            // console.log('[hoego] 자동 저장 완료');
          }
        } catch (error) {
          if (import.meta.env.DEV) {
            console.error('[hoego] 자동 저장 실패:', error);
          }
          toast.error(
            `자동 저장 실패: ${error instanceof Error ? error.message : String(error)}`
          );
        } finally {
          setIsSaving(false);
        }
      })();
    }, 2000);

    return () => {
      if (debounceIdRef.current) {
        clearTimeout(debounceIdRef.current);
      }
    };
  }, [isEditing, editingContent, setIsSaving, setMarkdownContent]);

  // Wrap setters to support SetStateAction
  const wrappedSetMarkdownContent = useCallback(
    (value: React.SetStateAction<string>) => {
      const newValue =
        typeof value === 'function' ? value(markdownContent) : value;
      setMarkdownContent(newValue);
    },
    [markdownContent, setMarkdownContent]
  );

  const wrappedSetIsSaving = useCallback(
    (value: React.SetStateAction<boolean>) => {
      const newValue = typeof value === 'function' ? value(isSaving) : value;
      setIsSaving(newValue);
    },
    [isSaving, setIsSaving]
  );

  return {
    markdownRef,
    markdownContent,
    setMarkdownContent: wrappedSetMarkdownContent,
    lastMinute,
    setLastMinute,
    isSaving,
    setIsSaving: wrappedSetIsSaving,
    isSyncing,
    lastSavedRef,
    loadMarkdown,
    handleManualSync,
  };
}
