import { MarkdownRenderer } from './MarkdownRenderer';

import type { MarkdownPreviewProps } from './types';

/**
 * 마크다운 프리뷰 컴포넌트
 *
 * 편집 모드와 프리뷰 모드를 전환할 수 있는 마크다운 프리뷰 컴포넌트입니다.
 * - 편집 모드: textarea로 마크다운을 직접 편집
 * - 프리뷰 모드: MarkdownRenderer로 렌더링된 마크다운 표시
 *
 * @param content - 마크다운 콘텐츠
 * @param isEditing - 편집 모드 여부
 * @param onContentChange - 콘텐츠 변경 핸들러
 * @param editorRef - 에디터 ref
 * @param onEnterKey - Enter 키 핸들러
 * @param isDarkMode - 다크모드 여부
 * @param onTaskToggle - Task list 체크박스 토글 핸들러
 * @param className - 추가 CSS 클래스
 * @param isSaving - 저장 중 상태
 */
export function MarkdownPreview({
  content,
  isEditing = false,
  onContentChange,
  editorRef,
  onEnterKey,
  isDarkMode = false,
  onTaskToggle,
  className = '',
  isSaving = false,
  previewRef,
}: MarkdownPreviewProps) {
  // 편집 모드
  if (isEditing) {
    return (
      <textarea
        ref={editorRef}
        value={content}
        onChange={(e) => onContentChange?.(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && onEnterKey) {
            e.preventDefault();
            const textarea = e.currentTarget;
            const cursorPosition = textarea.selectionStart;
            const textBeforeCursor = content.slice(0, cursorPosition);
            const textAfterCursor = content.slice(cursorPosition);

            // 현재 줄의 시작 위치 찾기
            const lineStart = textBeforeCursor.lastIndexOf('\n') + 1;
            const currentLine = textBeforeCursor.slice(lineStart);

            // Enter 키 핸들러 호출하여 타임스탬프 추가된 줄 받기
            const processedLine = onEnterKey(currentLine);

            // 콘텐츠 업데이트: 현재 줄을 processedLine으로 교체하고 개행 추가
            const newContent = `${content.slice(
              0,
              lineStart
            )}${processedLine}\n${textAfterCursor}`;

            onContentChange?.(newContent);

            // 커서 위치 업데이트 (다음 프레임에서)
            setTimeout(() => {
              const newCursorPos = lineStart + processedLine.length + 1; // +1 for newline
              textarea.setSelectionRange(newCursorPos, newCursorPos);
            }, 0);
          }
        }}
        className={`w-full h-full p-4 font-mono text-sm resize-none focus:outline-none ${
          isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'
        } ${className}`}
        style={{
          lineHeight: '1.6',
          tabSize: 2,
        }}
      />
    );
  }

  // 프리뷰 모드
  return (
    <div
      ref={previewRef}
      className={`w-full h-full overflow-y-auto p-4 ${
        isDarkMode ? 'bg-slate-900' : 'bg-white'
      } ${className}`}
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
