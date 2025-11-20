import { Maximize2 } from 'lucide-react';
import React from 'react';

import { hideOverlayWindow } from '@/lib/tauri';

interface MiniHeaderProps {
  /**
   * 입력 필드 ref
   */
  inputRef: React.RefObject<HTMLTextAreaElement>;

  /**
   * 입력 필드의 현재 값
   */
  inputValue: string;

  /**
   * 입력 값 변경 핸들러
   */
  setInputValue: (value: string) => void;

  /**
   * 폼 제출 핸들러
   */
  handleSubmit: (e: React.FormEvent) => void;

  /**
   * 확장 버튼 클릭 핸들러
   */
  onExpandClick: () => void;

  /**
   * 다크모드 활성화 여부
   */
  isDarkMode: boolean;
}

export function MiniHeader({
  inputRef,
  inputValue,
  setInputValue,
  handleSubmit,
  onExpandClick,
  isDarkMode,
}: MiniHeaderProps) {
  return (
    <div
      className={`flex items-center gap-2.5 px-3 h-full backdrop-blur-md border-0 transition-all ${
        isDarkMode
          ? 'bg-slate-900/95'
          : 'bg-white/95'
      }`}
      data-tauri-drag-region
    >
      {/* 입력창 */}
      <form
        onSubmit={handleSubmit}
        className="flex-1 min-w-0"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <textarea
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              void hideOverlayWindow();
            }
            // Submit on Enter without Shift
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e as unknown as React.FormEvent);
            }
          }}
          placeholder="생각을 쏟아내보세요."
          className={`h-16 w-full rounded-lg border-0 text-[13px] focus:outline-none focus:ring-0 px-3 py-4 resize-none bg-transparent ${
            isDarkMode
              ? 'text-slate-100 placeholder:text-slate-500'
              : 'text-slate-900 placeholder:text-slate-400'
          }`}
          autoFocus
        />
      </form>

      {/* 확장 버튼 */}
      <button
        type="button"
        onClick={onExpandClick}
        className={`flex h-7 w-7 items-center justify-center rounded-full border transition-all shrink-0 ${
          isDarkMode
            ? 'border-white/10 bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 hover:text-slate-100'
            : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
        }`}
        onMouseDown={(e) => e.stopPropagation()}
        title="전체 화면으로 확장"
        aria-label="전체 화면으로 확장"
      >
        <Maximize2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
