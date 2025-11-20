import { Minimize2 } from 'lucide-react';
import React from 'react';

import { hideOverlayWindow } from '@/lib/tauri';

interface FloatingMiniBarProps {
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
   * Mini 모드로 축소 핸들러
   */
  onMinimizeClick: () => void;

  /**
   * 다크모드 활성화 여부
   */
  isDarkMode: boolean;
}

export function FloatingMiniBar({
  inputRef,
  inputValue,
  setInputValue,
  handleSubmit,
  onMinimizeClick,
  isDarkMode,
}: FloatingMiniBarProps) {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[480px] max-w-[calc(100vw-2rem)]">
      <div
        className={`flex items-start gap-2.5 px-4 py-2.5 rounded-2xl backdrop-blur-md border shadow-2xl transition-all ${
          isDarkMode
            ? 'bg-slate-900/95 border-white/10 shadow-black/30'
            : 'bg-white/95 border-slate-200/50 shadow-slate-300/30'
        }`}
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
            className={`h-16 w-full rounded-lg border-0 text-[13px] focus:outline-none focus:ring-0 px-3 py-4 resize-none ${
              isDarkMode
                ? 'bg-slate-800/50 text-slate-100 placeholder:text-slate-500 focus:bg-slate-800/80'
                : 'bg-slate-100/50 text-slate-900 placeholder:text-slate-400 focus:bg-slate-100/80'
            }`}
            autoFocus
          />
        </form>

        {/* 축소 버튼 */}
        <button
          type="button"
          onClick={onMinimizeClick}
          className={`flex h-7 w-7 items-center justify-center rounded-full border transition-all shrink-0 mt-[0.9rem] ${
            isDarkMode
              ? 'border-white/10 bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 hover:text-slate-100'
              : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
          }`}
          onMouseDown={(e) => e.stopPropagation()}
          title="Mini 모드로 축소"
          aria-label="Mini 모드로 축소"
        >
          <Minimize2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
