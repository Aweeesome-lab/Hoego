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
    ></div>
  );
});
