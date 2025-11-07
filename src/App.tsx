import React from "react";
import ReactMarkdown from "react-markdown";
import { Clock, Moon, Sun, Settings } from "lucide-react";
import {
  hideOverlayWindow,
  getTodayMarkdown,
  appendHistoryEntry,
  onHistoryUpdated,
} from "@/lib/tauri";

export default function App() {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const markdownRef = React.useRef<HTMLDivElement | null>(null);
  const [inputValue, setInputValue] = React.useState("");
  const [currentTime, setCurrentTime] = React.useState("");
  const [markdownContent, setMarkdownContent] = React.useState("");
  const [lastMinute, setLastMinute] = React.useState("");
  const [isDarkMode, setIsDarkMode] = React.useState(false);

  // 마크다운 로드 함수
  const loadMarkdown = React.useCallback(async () => {
    try {
      const data = await getTodayMarkdown();
      setMarkdownContent(data.content);

      // 마지막 시간 추출
      const lines = data.content.split("\n");
      let latestMinute = "";
      for (let i = lines.length - 1; i >= 0; i--) {
        const rawLine = lines[i];
        const trimmedLine = rawLine.trim();
        if (!trimmedLine) {
          continue;
        }
        const bulletMatch = trimmedLine.match(/\((\d{2}):(\d{2}):\d{2}\)\s*$/);
        if (trimmedLine.startsWith("- ") && bulletMatch) {
          latestMinute = `${bulletMatch[1]}:${bulletMatch[2]}`;
          break;
        }
        if (trimmedLine.startsWith("## ")) {
          latestMinute = trimmedLine.replace("## ", "").trim();
          break;
        }
      }
      setLastMinute(latestMinute);

      // 스크롤을 맨 아래로
      setTimeout(() => {
        if (markdownRef.current) {
          markdownRef.current.scrollTop = markdownRef.current.scrollHeight;
        }
      }, 100);
    } catch (error) {
      if (import.meta.env.DEV) console.error("[otra] 마크다운 로드 실패", error);
      alert(
        `마크다운 로드 실패: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }, []);

  // 현재 시간 업데이트
  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, "0");
      const minutes = now.getMinutes().toString().padStart(2, "0");
      setCurrentTime(`${hours}:${minutes}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // 오늘의 마크다운 로드
  React.useEffect(() => {
    void loadMarkdown();
  }, [loadMarkdown]);

  // 마크다운 업데이트 리스너
  React.useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    onHistoryUpdated(() => {
      void loadMarkdown();
    }).then((unsub) => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [loadMarkdown]);

  // 입력 필드 포커스
  React.useEffect(() => {
    const focusInput = () => {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 200);
    };

    focusInput();
    window.addEventListener("focus", focusInput);
    return () => window.removeEventListener("focus", focusInput);
  }, []);

  // 항목 추가
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const taskText = inputValue.trim();
    if (!taskText) {
      return;
    }

    // debug log removed

    const now = new Date();
    const timestamp = now.toISOString();
    const currentMinute = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
    const isNewMinute = lastMinute !== currentMinute;

    // 입력 필드 즉시 초기화
    const savedTask = taskText;
    setInputValue("");
    setLastMinute(currentMinute);

    try {
      const payload = {
        timestamp,
        task: savedTask,
        isNewMinute,
      };

      await appendHistoryEntry(payload);

      // 마크다운 즉시 다시 로드
      await loadMarkdown();

      // 입력 필드 다시 포커스
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } catch (error) {
      if (import.meta.env.DEV) console.error("[otra] 항목 추가 실패:", error);
      alert(
        `작업 저장 실패: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      // 실패 시 입력값 복원
      setInputValue(savedTask);
    }
  };

  // 다크모드/라이트모드 전환
  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
    document.documentElement.classList.toggle("light");
  };

  // ESC 키로 윈도우 숨기기
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        void hideOverlayWindow();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  return (
    <div
      className={`relative flex h-full w-full flex-col overflow-hidden rounded-2xl backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] ${
        isDarkMode
          ? "border border-white/10 bg-[#0d1016]/80"
          : "border border-slate-200/50 bg-white/90"
      }`}
    >
      {/* 입력바 - 상단 고정, 패딩 영역에서 드래그 가능 */}
      <div
        className={`relative z-50 flex h-16 shrink-0 items-center gap-3 border-b px-4 ${
          isDarkMode
            ? "border-white/10 bg-[#12151d]/90"
            : "border-slate-200/50 bg-slate-50/90"
        }`}
      >
        <button
          type="button"
          className={`flex h-8 items-center rounded-full border px-3 text-xs font-semibold ${
            isDarkMode
              ? "border-white/10 bg-[#0a0d13]/80 text-slate-300"
              : "border-slate-200 bg-white text-slate-700"
          }`}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <Clock className="mr-1.5 h-3.5 w-3.5" />
          {currentTime}
        </button>
        <form
          onSubmit={handleSubmit}
          className="flex flex-1 min-w-0"
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
              if (e.key === "Escape") {
                e.preventDefault();
                void hideOverlayWindow();
              }
            }}
            placeholder="현재 작업을 입력하세요..."
            className={`h-10 flex-1 min-w-0 rounded-md border-0 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 ${
              isDarkMode
                ? "bg-slate-800/50 text-slate-100 placeholder:text-slate-500 focus:ring-slate-600 focus:bg-slate-800/80"
                : "bg-slate-100/50 text-slate-900 placeholder:text-slate-400 focus:ring-slate-400 focus:bg-slate-100/80"
            }`}
            style={{ padding: "0 12px" }}
            autoFocus
          />
        </form>
        <button
          type="button"
          onClick={toggleTheme}
          className={`flex h-8 w-8 items-center justify-center rounded-full border transition ${
            isDarkMode
              ? "border-white/10 bg-[#0a0d13]/80 text-slate-400 hover:text-slate-200"
              : "border-slate-200 bg-white text-slate-600 hover:text-slate-900"
          }`}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {isDarkMode ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* 마크다운 영역 - 스크롤 가능, 드래그 불가 */}
      <div
        ref={markdownRef}
        className={`relative z-20 flex-1 overflow-y-auto px-4 py-4 ${
          isDarkMode ? "text-slate-100" : "text-slate-900"
        }`}
        onMouseDown={(e) => {
          // 스크롤 영역에서는 드래그 방지
          e.stopPropagation();
        }}
        style={{ pointerEvents: "auto" }}
      >
        <div
          className={`text-sm ${
            isDarkMode ? "text-slate-300" : "text-slate-700"
          }`}
        >
          <ReactMarkdown
            components={{
              h1: ({ children }) => (
                <h1
                  className={`mb-4 text-lg font-semibold ${
                    isDarkMode ? "text-slate-100" : "text-slate-900"
                  }`}
                >
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2
                  className={`mb-2 mt-4 text-base font-semibold ${
                    isDarkMode ? "text-slate-200" : "text-slate-800"
                  }`}
                >
                  {children}
                </h2>
              ),
              ul: ({ children }) => (
                <ul className="mb-2 ml-4 list-disc space-y-1">{children}</ul>
              ),
              li: ({ children }) => <li>{children}</li>,
              p: ({ children }) => <p className="mb-2">{children}</p>,
            }}
          >
            {markdownContent || "# 오늘\n\n작업을 기록해보세요."}
          </ReactMarkdown>
        </div>
      </div>

      {/* 드래그 가능한 영역 - 가장자리 (더 넓게) */}
      {/* 상단 가장자리 */}
      <div
        className="absolute top-0 left-0 right-0 h-12 z-30 cursor-move"
        data-tauri-drag-region
      />
      {/* 하단 가장자리 */}
      <div
        className="absolute bottom-0 left-0 right-0 h-12 z-30 cursor-move"
        data-tauri-drag-region
      />
      {/* 좌측 가장자리 */}
      <div
        className="absolute top-12 bottom-12 left-0 w-12 z-30 cursor-move"
        data-tauri-drag-region
      />
      {/* 우측 가장자리 */}
      <div
        className="absolute top-12 bottom-12 right-0 w-12 z-30 cursor-move"
        data-tauri-drag-region
      />

      {/* 푸터 - 하단 고정, 패딩 영역에서 드래그 가능 */}
      <div
        className={`relative z-50 flex h-12 shrink-0 items-center justify-between border-t px-4 ${
          isDarkMode
            ? "border-white/10 bg-[#12151d]/90"
            : "border-slate-200/50 bg-slate-50/90"
        }`}
      >
        <button
          type="button"
          className={`flex items-center gap-2 text-xs transition ${
            isDarkMode
              ? "text-slate-400 hover:text-slate-200"
              : "text-slate-500 hover:text-slate-700"
          }`}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <Settings className="h-4 w-4" />
          <span>설정</span>
        </button>
        <div
          className={`flex items-center gap-3 text-[11px] uppercase tracking-[0.25em] ${
            isDarkMode ? "text-slate-500" : "text-slate-400"
          }`}
        >
          <span className="inline-flex items-center gap-1">
            <span>⌘</span>
            <span>J</span>
          </span>
        </div>
      </div>
    </div>
  );
}
