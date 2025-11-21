import { useCallback, useState } from 'react';
import { toast } from 'react-hot-toast';

import type { Position } from 'unist';

/**
 * Task list 체크박스 토글 핸들러 훅
 *
 * 마크다운 콘텐츠 내의 체크박스를 토글하고 저장합니다.
 * - Position 기반 오프셋 계산
 * - 낙관적 업데이트 (Optimistic Update)
 * - 에러 핸들링
 *
 * @param content - 현재 마크다운 콘텐츠
 * @param onContentChange - 콘텐츠 변경 핸들러
 * @param onSave - 저장 핸들러
 * @param getOffsetFromPoint - Position을 오프셋으로 변환하는 함수
 */
export function useTaskListHandler(
  content: string,
  onContentChange: (content: string) => void,
  onSave: (content: string) => Promise<{ success: boolean; error?: string }>,
  getOffsetFromPoint: (line: number, column: number) => number | null
) {
  const [isSaving, setIsSaving] = useState(false);

  /**
   * Position을 startOffset/endOffset으로 변환
   */
  const resolveOffsets = useCallback(
    (position: Position | null) => {
      if (!position?.start || !position?.end) {
        return null;
      }

      const startOffset = getOffsetFromPoint(
        position.start.line,
        position.start.column
      );
      const endOffset = getOffsetFromPoint(
        position.end.line,
        position.end.column
      );

      if (startOffset === null || endOffset === null) {
        return null;
      }

      return { startOffset, endOffset };
    },
    [getOffsetFromPoint]
  );

  /**
   * 체크박스 토글 핸들러
   */
  const handleToggle = useCallback(
    async (position: Position | null, nextChecked: boolean) => {
      // 저장 중이면 무시
      if (isSaving) {
        if (import.meta.env.DEV) {
          console.warn('[hoego] 저장 중이므로 체크박스 토글 무시');
        }
        return;
      }

      // 오프셋 계산
      const offsets = resolveOffsets(position);
      if (!offsets) {
        if (import.meta.env.DEV) {
          console.warn('[hoego] 체크박스 위치를 찾을 수 없습니다');
        }
        toast.error('체크박스 위치를 찾을 수 없습니다');
        return;
      }

      const previousContent = content;
      const { startOffset, endOffset } = offsets;
      const slice = previousContent.slice(startOffset, endOffset);

      // 체크박스 패턴 찾기: [ ], [x], [X]
      const checkboxRegex = /\[(\s|x|X)\]/;
      const match = slice.match(checkboxRegex);

      if (!match) {
        if (import.meta.env.DEV) {
          console.warn('[hoego] 체크박스 마크다운을 찾을 수 없습니다:', slice);
        }
        return;
      }

      // 체크박스 상태 변경
      const updatedSlice = slice.replace(
        checkboxRegex,
        nextChecked ? '[x]' : '[ ]'
      );

      if (slice === updatedSlice) {
        return;
      }

      // 새로운 콘텐츠 생성
      const nextContent =
        previousContent.slice(0, startOffset) +
        updatedSlice +
        previousContent.slice(endOffset);

      if (nextContent === previousContent) {
        return;
      }

      // 낙관적 업데이트: UI 즉시 반영
      onContentChange(nextContent);

      try {
        setIsSaving(true);
        const result = await onSave(nextContent);

        if (!result.success) {
          throw new Error(result.error);
        }
      } catch (error) {
        // 오류 발생 시 이전 콘텐츠로 롤백
        if (import.meta.env.DEV) {
          console.error('[hoego] 체크박스 저장 실패:', error);
        }
        onContentChange(previousContent);
        toast.error('체크박스 저장에 실패했습니다');
      } finally {
        setIsSaving(false);
      }
    },
    [content, isSaving, resolveOffsets, onContentChange, onSave]
  );

  return { handleToggle, isSaving };
}
