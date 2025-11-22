import { MarkdownRenderer } from './MarkdownRenderer';

import type { MarkdownPreviewProps } from './types';

/**
 * 마크다운 프리뷰 컴포넌트
 *
 * 마크다운을 렌더링하여 표시하는 읽기 전용 프리뷰 컴포넌트입니다.
 *
 * @param content - 마크다운 콘텐츠
 * @param isDarkMode - 다크모드 여부
 * @param onTaskToggle - Task list 체크박스 토글 핸들러
 * @param className - 추가 CSS 클래스
 * @param isSaving - 저장 중 상태
 * @param previewRef - 프리뷰 컨테이너 ref
 */
export function MarkdownPreview({
  content,
  isDarkMode = false,
  onTaskToggle,
  className = '',
  isSaving = false,
  previewRef,
}: MarkdownPreviewProps) {
  return (
    <div
      ref={previewRef}
      className={`w-full h-full overflow-y-auto scrollbar-auto ${className || 'p-4'}`}
    >
      <MarkdownRenderer
        content={content}
        isDarkMode={isDarkMode}
        onTaskToggle={onTaskToggle}
        isSaving={isSaving}
      />
    </div>
  );
}
