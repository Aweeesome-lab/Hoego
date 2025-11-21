import React from 'react';

interface FooterProps {
  isDarkMode: boolean;
}

export const Footer = React.memo(function Footer({ isDarkMode }: FooterProps) {
  return (
    <div
      className={`relative z-50 flex h-14 shrink-0 items-center justify-end border-t px-6 ${
        isDarkMode
          ? 'border-white/10 bg-[#12151d]/90'
          : 'border-slate-200/50 bg-slate-50/90'
      }`}
    >
      <a
        href="https://www.threads.com/@nerd_makr"
        target="_blank"
        rel="noopener noreferrer"
        className={`text-[10px] transition-all duration-150 ${
          isDarkMode
            ? 'text-slate-500 hover:text-slate-300'
            : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        문의하기: @nerd_makr
      </a>
    </div>
  );
});
