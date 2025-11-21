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
      <div
        className={`flex items-center gap-4 text-[11px] uppercase tracking-[0.25em] ${
          isDarkMode ? 'text-slate-500' : 'text-slate-400'
        }`}
      >
        <span
          className="inline-flex items-center gap-2"
          title="오버레이 열기/닫기"
        >
          <span className="tracking-normal">오버레이</span>
          <span className="inline-flex items-center gap-1">
            <span>⌘</span>
            <span>J</span>
          </span>
        </span>
        <span className="inline-flex items-center gap-2" title="AI 패널 토글">
          <span className="tracking-normal">AI</span>
          <span className="inline-flex items-center gap-1">
            <span>⌘</span>
            <span>2</span>
          </span>
        </span>
        <span className="inline-flex items-center gap-2" title="회고 패널 토글">
          <span className="tracking-normal">회고</span>
          <span className="inline-flex items-center gap-1">
            <span>⌘</span>
            <span>3</span>
          </span>
        </span>
        <span className="inline-flex items-center gap-2" title="히스토리 보기">
          <span className="tracking-normal">히스토리</span>
          <span className="inline-flex items-center gap-1">
            <span>⌘</span>
            <span>H</span>
          </span>
        </span>
      </div>
    </div>
  );
});
