import { Clock, Maximize2 } from 'lucide-react';
import React from 'react';

import { hideOverlayWindow } from '@/lib/tauri';

interface MiniHeaderProps {
  /**
   * 현재 시간 (HH:MM 형식)
   */
  currentTime: string;

  /**
   * 입력 필드 ref
   */
  inputRef: React.RefObject<HTMLInputElement>;

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
  currentTime,
  inputRef,
  inputValue,
  setInputValue,
  handleSubmit,
  onExpandClick,
  isDarkMode,
}: MiniHeaderProps) {
  return (
    <div
      className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl backdrop-blur-xl border shadow-2xl transition-all ${
        isDarkMode
          ? 'bg-slate-900/90 border-white/10 shadow-black/30'
          : 'bg-white/90 border-slate-200/50 shadow-slate-300/30'
      }`}
      data-tauri-drag-region
    >
      {/* 시계 */}
      <button
        type="button"
        className={`flex h-7 items-center rounded-full border px-2.5 text-[11px] font-semibold shrink-0 ${
          isDarkMode
            ? 'border-white/10 bg-slate-800/50 text-slate-300'
            : 'border-slate-200 bg-slate-50 text-slate-700'
        }`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <Clock className="mr-1.5 h-3 w-3" />
        {currentTime}
      </button>

      {/* 입력창 */}
      <form
        onSubmit={handleSubmit}
        className="flex-1 min-w-0"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              void hideOverlayWindow();
            }
          }}
          placeholder="생각을 쏟아내보세요."
          className={`h-8 w-full rounded-lg border-0 text-[13px] focus:outline-none focus:ring-2 focus:ring-offset-0 px-3 ${
            isDarkMode
              ? 'bg-slate-800/50 text-slate-100 placeholder:text-slate-500 focus:ring-slate-600 focus:bg-slate-800/80'
              : 'bg-slate-100/50 text-slate-900 placeholder:text-slate-400 focus:ring-slate-400 focus:bg-slate-100/80'
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
