import { Minimize2, Copy, Check } from 'lucide-react';
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

/**
 * FloatingMiniBar - 빠른 메모 입력을 위한 플로팅 바 컴포넌트
 * 화면 하단 중앙에 떠있는 형태로 표시되어 빠르게 생각을 기록할 수 있습니다.
 */

export function FloatingMiniBar({
  inputRef,
  inputValue,
  setInputValue,
  handleSubmit,
  onMinimizeClick,
  isDarkMode,
}: FloatingMiniBarProps) {
  const [isCopied, setIsCopied] = React.useState(false);

  const handleCopy = async () => {
    if (!inputValue.trim()) return;

    try {
      await navigator.clipboard.writeText(inputValue);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[480px] max-w-[calc(100vw-2rem)]">
      <div
        className={`flex items-start gap-2.5 px-4 py-2.5 rounded-2xl backdrop-blur-md border transition-all ${
          isDarkMode
            ? 'bg-slate-900/95 border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.4)]'
            : 'bg-white/95 border-slate-200/50 shadow-[0_8px_30px_rgb(0,0,0,0.12)]'
        }`}
      >
        {/* 입력창 */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 min-w-0 relative"
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
            className={`h-16 w-full rounded-lg border-0 text-[13px] focus:outline-none focus:ring-0 px-3 py-4 pr-8 resize-none bg-transparent scrollbar-hide ${
              isDarkMode
                ? 'text-slate-100 placeholder:text-slate-500'
                : 'text-slate-900 placeholder:text-slate-400'
            }`}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            autoFocus
          />

          {/* 복사 버튼 - 입력창 내부 우측 상단 */}
          {inputValue.trim() && (
            <button
              type="button"
              onClick={() => void handleCopy()}
              className={`absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded transition-all ${
                isDarkMode
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100/50'
              }`}
              onMouseDown={(e) => e.stopPropagation()}
              title="입력 내용 복사"
              aria-label="입력 내용 복사"
            >
              {isCopied ? (
                <Check className="h-3 w-3" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </button>
          )}
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
