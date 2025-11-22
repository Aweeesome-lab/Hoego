/**
 * Task List 체크박스 토글 Hook
 */

import { useCallback } from 'react';
import toast from 'react-hot-toast';

import type { Point, Position } from 'unist';

import { useAppStore } from '@/store';
import { useDocumentStore } from '@/store/documentStore';

/**
 * 체크박스 토글 훅
 * 마크다운 콘텐츠에서 체크박스 상태를 토글하고 저장합니다.
 */
export function useTaskToggle() {
  const markdownContent = useAppStore((state) => state.markdownContent);
  const isSaving = useAppStore((state) => state.isSaving);
  const setMarkdownContent = useAppStore((state) => state.setMarkdownContent);
  const setIsSaving = useAppStore((state) => state.setIsSaving);

  /**
   * Point (line, column)를 offset으로 변환
   */
  const getOffsetFromPoint = useCallback(
    (point?: Point | null): number | null => {
      if (!point || typeof point.line !== 'number' || typeof point.column !== 'number') {
        return null;
      }

      const lines = markdownContent.split('\n');
      const lineIndex = Math.max(point.line - 1, 0);

      let offset = 0;

      // 이전 줄들의 길이 합산
      for (let i = 0; i < lineIndex && i < lines.length; i++) {
        offset += (lines[i]?.length ?? 0) + 1; // +1 for \n
      }

      // 현재 줄의 컬럼 위치 추가
      const columnIndex = Math.max(point.column - 1, 0);
      if (lineIndex < lines.length) {
        const currentLine = lines[lineIndex] ?? '';
        offset += Math.min(columnIndex, currentLine.length);
      } else {
        offset += columnIndex;
      }

      return offset;
    },
    [markdownContent],
  );

  /**
   * Position을 startOffset, endOffset으로 변환
   */
  const resolveOffsets = useCallback(
    (position?: Position | null): { startOffset: number; endOffset: number } | null => {
      if (!position) return null;

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
    [getOffsetFromPoint],
  );

  /**
   * 체크박스 상태 토글
   *
   * @param listItemPosition - 리스트 아이템의 위치 정보
   * @param nextChecked - 새로운 체크 상태
   */
  const toggleTaskCheckbox = useCallback(
    async (listItemPosition: Position | null | undefined, nextChecked: boolean) => {
      // 저장 중에는 토글 불가
      if (isSaving) {
        return;
      }

      // 위치 정보 확인
      const offsets = resolveOffsets(listItemPosition);
      if (!offsets) {
        toast.error('체크박스 위치를 찾을 수 없습니다');
        return;
      }

      const previousContent = markdownContent;
      const { startOffset, endOffset } = offsets;
      const slice = previousContent.slice(startOffset, endOffset);

      // 체크박스 패턴 찾기: [ ], [x], [X]
      const checkboxRegex = /\[(\s|x|X)\]/;
      const match = slice.match(checkboxRegex);

      if (!match) {
        return; // 체크박스가 없으면 무시
      }

      // 체크박스 상태 변경
      const updatedSlice = slice.replace(checkboxRegex, nextChecked ? '[x]' : '[ ]');

      if (slice === updatedSlice) {
        return; // 변경 사항 없음
      }

      // 새로운 콘텐츠 생성
      const nextContent =
        previousContent.slice(0, startOffset) +
        updatedSlice +
        previousContent.slice(endOffset);

      if (nextContent === previousContent) {
        return;
      }

      // Optimistic update: UI 즉시 업데이트
      setMarkdownContent(nextContent);

      // DocumentStore도 동기화
      const documentStore = useDocumentStore.getState();
      if (documentStore.activeDocument) {
        documentStore.updateContent(nextContent);
      }

      try {
        setIsSaving(true);

        // 파일에 저장
        const saveResult = await documentStore.saveActiveDocument(nextContent);

        if (!saveResult.success) {
          throw new Error(saveResult.error || 'Save failed');
        }
      } catch (error) {
        // 실패 시 원래 상태로 복원
        setMarkdownContent(previousContent);

        if (documentStore.activeDocument) {
          documentStore.updateContent(previousContent);
        }

        toast.error(
          `체크박스 업데이트 실패: ${error instanceof Error ? error.message : String(error)}`,
        );
      } finally {
        setIsSaving(false);
      }
    },
    [isSaving, markdownContent, resolveOffsets, setMarkdownContent, setIsSaving],
  );

  return { toggleTaskCheckbox, isSaving };
}
