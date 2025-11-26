import { invoke } from '@tauri-apps/api/tauri';
import React from 'react';

import { cn } from '@/lib/utils';

interface FooterProps {
  isDarkMode: boolean;
}

export const Footer = React.memo(function Footer({ isDarkMode }: FooterProps) {
  const handleSettingsClick = React.useCallback(async () => {
    try {
      await invoke('open_llm_settings');
    } catch (error) {
      // 개발자 콘솔에만 노출
      console.error('Failed to open LLM settings:', error);
    }
  }, []);

  const handleMouseDown = React.useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
  }, []);

  return (
    <div
      className={cn(
        'relative z-50 flex h-14 shrink-0 items-center justify-between border-t px-6',
        isDarkMode
          ? 'border-white/10 bg-[#12151d]/90'
          : 'bg-slate-50/90 border-slate-200/50'
      )}
    >
      <a
        href="https://www.threads.com/@nerd_makr"
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'text-[10px] transition-all duration-150',
          isDarkMode
            ? 'text-slate-500 hover:text-slate-300'
            : 'text-slate-400 hover:text-slate-600'
        )}
      >
        문의하기: @nerd_makr
      </a>

      <button
        type="button"
        className={cn(
          'ml-4 inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-medium transition-colors',
          isDarkMode
            ? 'border-white/20 bg-white/5 text-slate-100 hover:bg-white/10'
            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
        )}
        aria-label="AI 설정"
        onMouseDown={handleMouseDown}
        onClick={() => void handleSettingsClick()}
      >
        AI 설정
      </button>
    </div>
  );
});
