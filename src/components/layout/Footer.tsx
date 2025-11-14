import React from "react";
import { Settings } from "lucide-react";
import { invoke } from "@tauri-apps/api/tauri";

interface FooterProps {
  isDarkMode: boolean;
}

export const Footer = React.memo(function Footer({ isDarkMode }: FooterProps) {
  return (
    <div
      className={`relative z-50 flex h-12 shrink-0 items-center justify-between border-t px-4 ${
        isDarkMode
          ? "border-white/10 bg-[#12151d]/90"
          : "border-slate-200/50 bg-slate-50/90"
      }`}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          className={`flex items-center gap-2 text-xs transition ${
            isDarkMode
              ? "text-slate-400 hover:text-slate-200"
              : "text-slate-500 hover:text-slate-700"
          }`}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={async () => {
            try {
              await invoke("open_llm_settings");
            } catch (err) {
              console.error("Failed to open LLM settings:", err);
            }
          }}
        >
          <Settings className="h-4 w-4" />
          <span>AI 설정</span>
        </button>
      </div>
      <div
        className={`flex items-center gap-4 text-[11px] uppercase tracking-[0.25em] ${
          isDarkMode ? "text-slate-500" : "text-slate-400"
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
        <span
          className="inline-flex items-center gap-2"
          title="편집 모드 토글"
        >
          <span className="tracking-normal">편집</span>
          <span className="inline-flex items-center gap-1">
            <span>⌘</span>
            <span>E</span>
          </span>
        </span>
        <span className="inline-flex items-center gap-2" title="AI 패널 토글">
          <span className="tracking-normal">AI</span>
          <span className="inline-flex items-center gap-1">
            <span>⌘</span>
            <span>2</span>
          </span>
        </span>
        <span
          className="inline-flex items-center gap-2"
          title="회고 패널 토글"
        >
          <span className="tracking-normal">회고</span>
          <span className="inline-flex items-center gap-1">
            <span>⌘</span>
            <span>3</span>
          </span>
        </span>
        <span
          className="inline-flex items-center gap-2"
          title="히스토리 보기"
        >
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
