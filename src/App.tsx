import React from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import type { ListItem, Code, InlineCode } from "mdast";
import remarkGfm from "remark-gfm";
import { Clock, Moon, Sun, Settings, Pencil, Check } from "lucide-react";
import {
  hideOverlayWindow,
  getTodayMarkdown,
  appendHistoryEntry,
  onHistoryUpdated,
  saveTodayMarkdown,
} from "@/lib/tauri";

// KST(HH:MM:SS) 계산 유틸리티
function getKstHms() {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const kst = new Date(utcMs + 9 * 60 * 60000);
  const hh = String(kst.getHours()).padStart(2, "0");
  const mm = String(kst.getMinutes()).padStart(2, "0");
  const ss = String(kst.getSeconds()).padStart(2, "0");
  return { hh, mm, ss };
}

export default function App() {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const markdownRef = React.useRef<HTMLDivElement | null>(null);
  const [inputValue, setInputValue] = React.useState("");
  const [currentTime, setCurrentTime] = React.useState("");
  const [markdownContent, setMarkdownContent] = React.useState("");
  const [lastMinute, setLastMinute] = React.useState("");
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editingContent, setEditingContent] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);
  const editorRef = React.useRef<HTMLTextAreaElement | null>(null);
  const lastSavedRef = React.useRef<string>("");
  const debounceIdRef = React.useRef<number | null>(null);

  // 마크다운 로드 함수
  const loadMarkdown = React.useCallback(async () => {
    try {
      const data = await getTodayMarkdown();
      setMarkdownContent(data.content);
      lastSavedRef.current = data.content;

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
      if (import.meta.env.DEV)
        console.error("[otra] 마크다운 로드 실패", error);
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

  // 단축키: 편집 토글(Cmd/Ctrl+E), ESC 처리
  React.useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      // 편집 토글 / 편집 중이면 현재 줄 타임스탬프 후 저장 종료
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "e") {
        event.preventDefault();
        event.stopPropagation();
        if (isEditing) {
          const el = editorRef.current;
          const start = el ? el.selectionStart : editingContent.length;
          const end = el ? el.selectionEnd : start;
          const before = editingContent.slice(0, start);
          const after = editingContent.slice(end);
          const lineStart = before.lastIndexOf("\n") + 1;
          const currentLine = before.slice(lineStart);

          const stampedLine = appendTimestampToLine(currentLine);
          const newContent =
            editingContent.slice(0, lineStart) + stampedLine + after;

          (async () => {
            try {
              setIsSaving(true);
              if (newContent !== editingContent) {
                setEditingContent(newContent);
              }
              await saveTodayMarkdown(newContent);
              lastSavedRef.current = newContent;
              await loadMarkdown();
            } catch (error) {
              if (import.meta.env.DEV)
                console.error("[otra] Cmd+E 저장 실패:", error);
            } finally {
              setIsSaving(false);
              setIsEditing(false);
            }
          })();
        } else {
          setEditingContent(markdownContent);
          setIsEditing(true);
        }
        return;
      }

      // ESC: 편집 중이면 편집 종료, 아니면 창 숨김
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        if (isEditing) {
          // 편집 종료 시 저장 flush
          if (editingContent !== lastSavedRef.current) {
            (async () => {
              try {
                setIsSaving(true);
                await saveTodayMarkdown(editingContent);
                lastSavedRef.current = editingContent;
                await loadMarkdown();
              } catch (error) {
                if (import.meta.env.DEV)
                  console.error("[otra] 저장 실패:", error);
              } finally {
                setIsSaving(false);
                setIsEditing(false);
              }
            })();
          } else {
            setIsEditing(false);
          }
        } else {
          void hideOverlayWindow();
        }
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isEditing, editingContent, markdownContent, loadMarkdown]);

  // 편집 모드 진입 시 에디터 포커스
  React.useEffect(() => {
    if (isEditing) {
      setTimeout(() => editorRef.current?.focus(), 50);
    }
  }, [isEditing]);

  // 편집 중 자동 저장 (디바운스)
  React.useEffect(() => {
    if (!isEditing) return;
    if (editingContent === lastSavedRef.current) return;

    if (debounceIdRef.current) {
      clearTimeout(debounceIdRef.current);
    }
    debounceIdRef.current = window.setTimeout(async () => {
      try {
        setIsSaving(true);
        await saveTodayMarkdown(editingContent);
        lastSavedRef.current = editingContent;
      } catch (error) {
        if (import.meta.env.DEV) console.error("[otra] 자동 저장 실패:", error);
      } finally {
        setIsSaving(false);
      }
    }, 600);

    return () => {
      if (debounceIdRef.current) {
        clearTimeout(debounceIdRef.current);
      }
    };
  }, [isEditing, editingContent]);

  const appendTimestampToLine = React.useCallback((line: string) => {
    const trimmedLine = line.replace(/\s+$/, "");
    if (!trimmedLine) {
      return trimmedLine;
    }

    const tsRegex = /\(\d{2}:\d{2}:\d{2}\)\s*$/;
    if (tsRegex.test(trimmedLine)) {
      return trimmedLine;
    }

    const normalized = trimmedLine.trim();
    if (
      !normalized ||
      normalized.startsWith("#") ||
      normalized.startsWith(">") ||
      normalized.startsWith("```")
    ) {
      return trimmedLine;
    }

    const bulletMatch = normalized.match(/^[-*+]\s+/);
    const orderedMatch = normalized.match(/^\d+\.\s+/);
    let content = normalized;
    if (bulletMatch) {
      content = normalized.slice(bulletMatch[0].length);
    } else if (orderedMatch) {
      content = normalized.slice(orderedMatch[0].length);
    }

    if (!content.trim()) {
      return trimmedLine;
    }

    const { hh, mm, ss } = getKstHms();
    return `${trimmedLine} (${hh}:${mm}:${ss})`;
  }, []);

  const markdownComponents = React.useMemo<Components>(
    () => ({
      h1: ({ node, children, ...props }) => (
        <h1
          {...props}
          className={`mb-4 text-lg font-semibold ${
            isDarkMode ? "text-slate-100" : "text-slate-900"
          }`}
        >
          {children}
        </h1>
      ),
      h2: ({ node, children, ...props }) => (
        <h2
          {...props}
          className={`mb-2 mt-4 text-base font-semibold ${
            isDarkMode ? "text-slate-200" : "text-slate-800"
          }`}
        >
          {children}
        </h2>
      ),
      h3: ({ node, children, ...props }) => (
        <h3
          {...props}
          className={`mb-2 mt-3 text-sm font-semibold ${
            isDarkMode ? "text-slate-200" : "text-slate-800"
          }`}
        >
          {children}
        </h3>
      ),
      ul: ({ node, children, ...props }) => (
        <ul {...props} className="mb-2 ml-4 list-disc space-y-1">
          {children}
        </ul>
      ),
      ol: ({ node, children, ...props }) => (
        <ol {...props} className="mb-2 ml-4 list-decimal space-y-1">
          {children}
        </ol>
      ),
      li: ({ node, children, ...props }) => {
        const listItem = node as unknown as ListItem | undefined;
        if (typeof listItem?.checked === "boolean") {
          return (
            <li
              {...props}
              className="flex items-start gap-2 leading-6"
              style={{ listStyle: "none" }}
            >
              <input
                type="checkbox"
                checked={listItem.checked}
                readOnly
                className="mt-1 h-3.5 w-3.5 rounded border border-slate-400 bg-transparent accent-slate-500"
              />
              <span className="flex-1">{children}</span>
            </li>
          );
        }
        return <li {...props}>{children}</li>;
      },
      p: ({ node, children, ...props }) => (
        <p {...props} className="mb-2 leading-6">
          {children}
        </p>
      ),
      a: ({ node, children, href, ...props }) => (
        <a
          {...props}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sky-500 underline decoration-sky-500/50 underline-offset-2 hover:text-sky-400"
        >
          {children}
        </a>
      ),
      code: ({ node, className, children, ...props }) => {
        const codeNode = node as unknown as Code | InlineCode | undefined;
        const isInline = codeNode?.type === "inlineCode";
        if (isInline) {
          return (
            <code
              {...props}
              className={`rounded bg-slate-900/10 px-1.5 py-0.5 text-xs ${
                isDarkMode ? "bg-slate-50/10 text-slate-100" : ""
              }`}
            >
              {children}
            </code>
          );
        }
        const language = className || "";
        return (
          <pre
            className={`my-3 overflow-x-auto rounded-md bg-slate-900/80 p-3 text-xs text-slate-100 ${
              !isDarkMode ? "bg-slate-900/90" : ""
            }`}
          >
            <code className={language} {...props}>
              {children}
            </code>
          </pre>
        );
      },
      blockquote: ({ node, children, ...props }) => (
        <blockquote
          {...props}
          className={`my-3 border-l-2 pl-3 ${
            isDarkMode
              ? "border-slate-500 text-slate-200"
              : "border-slate-300 text-slate-700"
          }`}
        >
          {children}
        </blockquote>
      ),
      table: ({ node, children, ...props }) => (
        <div className="my-3 overflow-x-auto">
          <table
            {...props}
            className={`w-full border-collapse text-sm ${
              isDarkMode ? "text-slate-200" : "text-slate-800"
            }`}
          >
            {children}
          </table>
        </div>
      ),
      thead: ({ node, children, ...props }) => (
        <thead
          {...props}
          className={isDarkMode ? "bg-white/5 text-slate-100" : "bg-slate-100"}
        >
          {children}
        </thead>
      ),
      tbody: ({ node, children, ...props }) => (
        <tbody {...props}>{children}</tbody>
      ),
      th: ({ node, children, ...props }) => (
        <th
          {...props}
          className="border border-slate-200/30 px-3 py-2 text-left font-semibold"
        >
          {children}
        </th>
      ),
      td: ({ node, children, ...props }) => (
        <td
          {...props}
          className="border border-slate-200/30 px-3 py-2 align-top"
        >
          {children}
        </td>
      ),
      del: ({ node, children, ...props }) => (
        <del className="text-slate-400 decoration-2" {...props}>
          {children}
        </del>
      ),
    }),
    [isDarkMode]
  );

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
        {isEditing ? (
          <div
            className="flex items-center gap-2"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={async () => {
                // 편집 종료: 현재 줄에 타임스탬프 부착 후 저장/종료
                let contentToSave = editingContent;
                const el = editorRef.current;
                if (el) {
                  const start = el.selectionStart;
                  const end = el.selectionEnd;
                  const before = editingContent.slice(0, start);
                  const after = editingContent.slice(end);
                  const lineStart = before.lastIndexOf("\n") + 1;
                  const currentLine = before.slice(lineStart);
                  const stampedLine = appendTimestampToLine(currentLine);
                  const newContent =
                    editingContent.slice(0, lineStart) + stampedLine + after;
                  if (newContent !== editingContent) {
                    setEditingContent(newContent);
                    contentToSave = newContent;
                  }
                }
                try {
                  setIsSaving(true);
                  if (contentToSave !== lastSavedRef.current) {
                    await saveTodayMarkdown(contentToSave);
                    lastSavedRef.current = contentToSave;
                  }
                  await loadMarkdown();
                } catch (error) {
                  if (import.meta.env.DEV)
                    console.error("[otra] 저장 실패:", error);
                } finally {
                  setIsSaving(false);
                  setIsEditing(false);
                }
              }}
              className={`flex h-8 items-center rounded-full border px-3 text-xs font-semibold ${
                isDarkMode
                  ? "border-white/10 bg-[#0a0d13]/80 text-slate-200"
                  : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              <Check className="mr-1.5 h-3.5 w-3.5" /> 완료
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setEditingContent(markdownContent);
              setIsEditing(true);
            }}
            className={`flex h-8 items-center rounded-full border px-3 text-xs font-semibold ${
              isDarkMode
                ? "border-white/10 bg-[#0a0d13]/80 text-slate-300"
                : "border-slate-200 bg-white text-slate-700"
            }`}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <Pencil className="mr-1.5 h-3.5 w-3.5" /> 편집
          </button>
        )}
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
        {isEditing ? (
          <textarea
            ref={editorRef}
            value={editingContent}
            onChange={(e) => setEditingContent(e.target.value)}
            className={`w-full h-full min-h-[300px] resize-none rounded-md border text-sm leading-6 outline-none ${
              isDarkMode
                ? "border-white/10 bg-[#0a0d13]/80 text-slate-100 placeholder:text-slate-500"
                : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
            }`}
            style={{
              fontFamily:
                'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              padding: 12,
            }}
            placeholder="# 오늘\n\n작업을 기록해보세요."
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.stopPropagation();
              }
              if (
                e.key === "Enter" &&
                !e.shiftKey &&
                !e.metaKey &&
                !e.ctrlKey &&
                !e.altKey
              ) {
                // 현재 라인 끝에 타임스탬프가 없으면 부착하고, 다음 줄로 이동
                const el = editorRef.current;
                if (!el) return;
                e.preventDefault();

                const start = el.selectionStart;
                const end = el.selectionEnd;
                const before = editingContent.slice(0, start);
                const after = editingContent.slice(end);
                const lineStart = before.lastIndexOf("\n") + 1; // -1 => 0
                const currentLine = before.slice(lineStart);

                const stampedLine = appendTimestampToLine(currentLine);

                const nextPrefix = "";
                const newContent =
                  editingContent.slice(0, lineStart) +
                  stampedLine +
                  "\n" +
                  nextPrefix +
                  after;
                const newCaret =
                  lineStart + stampedLine.length + 1 + nextPrefix.length;

                setEditingContent(newContent);
                // 커서 위치 복원
                setTimeout(() => {
                  const ta = editorRef.current;
                  if (ta) ta.setSelectionRange(newCaret, newCaret);
                }, 0);
              }
            }}
          />
        ) : (
          <div
            className={`text-sm ${
              isDarkMode ? "text-slate-300" : "text-slate-700"
            }`}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {markdownContent || "# 오늘\n\n작업을 기록해보세요."}
            </ReactMarkdown>
          </div>
        )}
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
          {/* 자동 저장으로 저장 단축키 제거 */}
        </div>
      </div>
    </div>
  );
}
