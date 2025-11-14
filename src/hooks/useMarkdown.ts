import { useState, useRef, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';

import type { ListItem, Point, Position } from 'unist';

import { getTodayMarkdown, saveTodayMarkdown } from '@/lib/tauri';
import { useAppStore } from '@/store';

// KST(HH:MM:SS) 계산 유틸리티
function getKstHms() {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const kst = new Date(utcMs + 9 * 60 * 60000);
  const hh = String(kst.getHours()).padStart(2, '0');
  const mm = String(kst.getMinutes()).padStart(2, '0');
  const ss = String(kst.getSeconds()).padStart(2, '0');
  return { hh, mm, ss };
}

export function useMarkdown() {
  // Zustand store selectors
  const markdownContent = useAppStore((state) => state.markdownContent);
  const isEditing = useAppStore((state) => state.isEditing);
  const editingContent = useAppStore((state) => state.editingContent);
  const isSaving = useAppStore((state) => state.isSaving);
  const isSyncing = useAppStore((state) => state.isSyncing);

  const setMarkdownContent = useAppStore((state) => state.setMarkdownContent);
  const setIsEditing = useAppStore((state) => state.setIsEditing);
  const setEditingContent = useAppStore((state) => state.setEditingContent);
  const setIsSaving = useAppStore((state) => state.setIsSaving);
  const setIsSyncing = useAppStore((state) => state.setIsSyncing);

  // Local state (not in Zustand)
  const [lastMinute, setLastMinute] = useState('');

  // Refs
  const markdownRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<HTMLTextAreaElement | null>(null);
  const lastSavedRef = useRef<string>('');
  const debounceIdRef = useRef<number | null>(null);

  // 마크다운 로드 함수
  const loadMarkdown = useCallback(async () => {
    try {
      const data = await getTodayMarkdown();
      setMarkdownContent(data.content);
      lastSavedRef.current = data.content;

      // 마지막 시간 추출
      const lines = data.content.split('\n');
      let latestMinute = '';
      for (let i = lines.length - 1; i >= 0; i--) {
        const rawLine = lines[i];
        const trimmedLine = rawLine.trim();
        if (!trimmedLine) {
          continue;
        }
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
      if (import.meta.env.DEV)
        console.error('[hoego] 마크다운 로드 실패', error);
      toast.error(
        `마크다운 로드 실패: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }, []);

  const appendTimestampToLine = useCallback((line: string) => {
    const trimmedLine = line.replace(/\s+$/, '');
    if (!trimmedLine) {
      return trimmedLine;
    }

    const tsRegex = /\(\d{2}:\d{2}:\d{2}\)\s*$/;
    if (tsRegex.test(trimmedLine)) {
      return trimmedLine;
    }

    const normalized = trimmedLine.trim();
    if (
      !normalized ||
      normalized.startsWith('#') ||
      normalized.startsWith('>') ||
      normalized.startsWith('```')
    ) {
      return trimmedLine;
    }

    const bulletMatch = normalized.match(/^[-*+]\s+/);
    const orderedMatch = normalized.match(/^\d+\.\s+/);
    let content = normalized;
    if (bulletMatch) {
      content = normalized.slice(bulletMatch[0].length);
    } else if (orderedMatch) {
      content = normalized.slice(orderedMatch[0].length);
    }

    if (!content.trim()) {
      return trimmedLine;
    }

    const { hh, mm, ss } = getKstHms();
    return `${trimmedLine} (${hh}:${mm}:${ss})`;
  }, []);

  const getOffsetFromPoint = useCallback(
    (point?: Point | null) => {
      if (
        !point ||
        typeof point.line !== 'number' ||
        typeof point.column !== 'number'
      ) {
        return null;
      }

      const lines = markdownContent.split('\n');
      const lineIndex = Math.max(point.line - 1, 0);

      let offset = 0;
      for (let i = 0; i < lineIndex && i < lines.length; i += 1) {
        offset += lines[i].length + 1;
      }

      const columnIndex = Math.max(point.column - 1, 0);
      if (lineIndex < lines.length) {
        const currentLine = lines[lineIndex] ?? '';
        offset += Math.min(columnIndex, currentLine.length);
      } else {
        offset += columnIndex;
      }

      return offset;
    },
    [markdownContent]
  );

  const resolveOffsets = useCallback(
    (position?: Position | null) => {
      if (!position) {
        return null;
      }

      const startOffset =
        typeof position.start?.offset === 'number'
          ? position.start.offset
          : getOffsetFromPoint(position.start);
      const endOffset =
        typeof position.end?.offset === 'number'
          ? position.end.offset
          : getOffsetFromPoint(position.end);

      if (
        typeof startOffset !== 'number' ||
        typeof endOffset !== 'number' ||
        startOffset >= endOffset
      ) {
        return null;
      }

      return { startOffset, endOffset };
    },
    [getOffsetFromPoint]
  );

  const handleTaskCheckboxToggle = useCallback(
    async (listItem: ListItem, nextChecked: boolean) => {
      if (isSaving) {
        return;
      }

      const offsets = resolveOffsets(listItem?.position ?? null);
      if (!offsets) {
        return;
      }

      const previousContent = markdownContent;
      const { startOffset, endOffset } = offsets;
      const slice = previousContent.slice(startOffset, endOffset);
      const updatedSlice = slice.replace(
        /\[( |x|X)\]/,
        nextChecked ? '[x]' : '[ ]'
      );

      if (slice === updatedSlice) {
        return;
      }

      const nextContent =
        previousContent.slice(0, startOffset) +
        updatedSlice +
        previousContent.slice(endOffset);

      if (nextContent === previousContent) {
        return;
      }

      setMarkdownContent(nextContent);

      try {
        setIsSaving(true);
        await saveTodayMarkdown(nextContent);
        lastSavedRef.current = nextContent;
      } catch (error) {
        setMarkdownContent(previousContent);
        lastSavedRef.current = previousContent;
        if (import.meta.env.DEV) {
          console.error('[hoego] 체크박스 상태 저장 실패:', error);
        }
        toast.error(
          `체크박스 업데이트 실패: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      } finally {
        setIsSaving(false);
      }
    },
    [isSaving, markdownContent, resolveOffsets]
  );

  // 편집 모드 진입 시 에디터 포커스
  useEffect(() => {
    if (isEditing) {
      setTimeout(() => editorRef.current?.focus(), 50);
    }
  }, [isEditing]);

  // 편집 중 자동 저장 (디바운스)
  useEffect(() => {
    if (!isEditing) return;
    if (editingContent === lastSavedRef.current) return;

    if (debounceIdRef.current) {
      clearTimeout(debounceIdRef.current);
    }
    debounceIdRef.current = window.setTimeout(async () => {
      try {
        setIsSaving(true);
        await saveTodayMarkdown(editingContent);
        lastSavedRef.current = editingContent;
      } catch (error) {
        if (import.meta.env.DEV)
          console.error('[hoego] 자동 저장 실패:', error);
      } finally {
        setIsSaving(false);
      }
    }, 600);

    return () => {
      if (debounceIdRef.current) {
        clearTimeout(debounceIdRef.current);
      }
    };
  }, [isEditing, editingContent]);

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

  return {
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
    isSyncing,
    editorRef,
    lastSavedRef,
    loadMarkdown,
    appendTimestampToLine,
    handleTaskCheckboxToggle,
    saveTodayMarkdown,
    handleManualSync,
  };
}
