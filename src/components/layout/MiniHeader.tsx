import { Maximize2, Copy, Check, Send } from 'lucide-react';
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
    <div
      className={`flex items-center gap-2.5 px-3 h-full backdrop-blur-md border-0 transition-all ${
        isDarkMode ? 'bg-slate-900/95' : 'bg-white/95'
      }`}
      data-tauri-drag-region
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

      {/* 버튼 그룹 - 수직 중앙 정렬 */}
      <div className="flex items-center gap-1.5 self-center">
        {/* 전송 버튼 */}
        <button
          type="button"
          onClick={(e) => handleSubmit(e as unknown as React.FormEvent)}
          disabled={!inputValue.trim()}
          className={`flex h-7 w-7 items-center justify-center rounded-full border transition-all shrink-0 ${
            inputValue.trim()
              ? isDarkMode
                ? 'border-emerald-500/30 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 hover:text-emerald-300'
                : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 hover:text-emerald-700'
              : isDarkMode
                ? 'border-white/5 bg-slate-800/30 text-slate-600 cursor-not-allowed'
                : 'border-slate-200/50 bg-slate-50/50 text-slate-300 cursor-not-allowed'
          }`}
          onMouseDown={(e) => e.stopPropagation()}
          title="전송"
          aria-label="전송"
        >
          <Send className="h-3.5 w-3.5" />
        </button>

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
    </div>
  );
}
