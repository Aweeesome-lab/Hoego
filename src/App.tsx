import React from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import type { ListItem, Code, InlineCode } from "mdast";
import * as Checkbox from "@radix-ui/react-checkbox";
import remarkGfm from "remark-gfm";
import {
  Clock,
  Moon,
  Sun,
  MonitorSmartphone,
  Settings,
  Pencil,
  Check,
  RotateCcw,
  PanelRightOpen,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Loader2,
  Brain,
  NotebookPen,
} from "lucide-react";
import * as Select from "@radix-ui/react-select";
import {
  hideOverlayWindow,
  getTodayMarkdown,
  appendHistoryEntry,
  onHistoryUpdated,
  saveTodayMarkdown,
  listAiSummaries,
  generateAiFeedback,
} from "@/lib/tauri";
import { invoke } from "@tauri-apps/api/tauri";
import type { AiSummaryEntry } from "@/lib/tauri";
import type { Point, Position } from "unist";

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

  // Theme mode: 'light' | 'dark' | 'system'
  const [themeMode, setThemeMode] = React.useState<"light" | "dark" | "system">(
    () => {
      const stored = localStorage.getItem("otra_theme_mode");
      if (stored === "light" || stored === "dark" || stored === "system") {
        return stored;
      }
      return "system";
    }
  );

  // Actual dark mode state (computed from themeMode)
  const [isDarkMode, setIsDarkMode] = React.useState(() => {
    const stored = localStorage.getItem("otra_theme_mode");
    if (stored === "light") return false;
    if (stored === "dark") return true;
    // system or no stored value
    return (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  });
  const [isEditing, setIsEditing] = React.useState(false);
  const [editingContent, setEditingContent] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const editorRef = React.useRef<HTMLTextAreaElement | null>(null);
  const lastSavedRef = React.useRef<string>("");
  const debounceIdRef = React.useRef<number | null>(null);
  const [aiSummaries, setAiSummaries] = React.useState<AiSummaryEntry[]>([]);
  const [selectedSummaryIndex, setSelectedSummaryIndex] = React.useState(0);
  const [summariesError, setSummariesError] = React.useState<string | null>(
    null
  );
  const [isGeneratingAiFeedback, setIsGeneratingAiFeedback] =
    React.useState(false);
  const splitRef = React.useRef<HTMLDivElement | null>(null);
  const [retrospectContent, setRetrospectContent] = React.useState(() => {
    return localStorage.getItem("otra.retrospectContent") || "";
  });
  const retrospectRef = React.useRef<HTMLTextAreaElement | null>(null);
  const [isSavingRetrospect, setIsSavingRetrospect] = React.useState(false);
  const retrospectDebounceIdRef = React.useRef<number | null>(null);

  // Panel expand/collapse states
  const [isAiPanelExpanded, setIsAiPanelExpanded] = React.useState(true);
  const [isRetrospectPanelExpanded, setIsRetrospectPanelExpanded] = React.useState(true);
  const selectedSummary = React.useMemo(
    () => aiSummaries[selectedSummaryIndex] ?? null,
    [aiSummaries, selectedSummaryIndex]
  );
  const aiSelectValue = React.useMemo(() => {
    if (!aiSummaries.length) return undefined;
    const boundedIndex = Math.min(selectedSummaryIndex, aiSummaries.length - 1);
    return String(boundedIndex);
  }, [aiSummaries.length, selectedSummaryIndex]);

  const getSummaryLabel = React.useCallback((summary: AiSummaryEntry) => {
    if (!summary?.createdAt) {
      return summary.filename;
    }
    const date = new Date(summary.createdAt);
    if (Number.isNaN(date.getTime())) {
      return summary.filename;
    }
    const datePart = date.toLocaleDateString("ko-KR", {
      month: "short",
      day: "numeric",
      weekday: "short",
    });
    const timePart = date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${datePart} ${timePart}`;
  }, []);


  // 회고 내용 자동 저장 (디바운스)
  React.useEffect(() => {
    if (retrospectDebounceIdRef.current) {
      clearTimeout(retrospectDebounceIdRef.current);
    }

    retrospectDebounceIdRef.current = window.setTimeout(() => {
      try {
        setIsSavingRetrospect(true);
        localStorage.setItem("otra.retrospectContent", retrospectContent);
        setTimeout(() => setIsSavingRetrospect(false), 500);
      } catch (error) {
        console.error("Failed to save retrospect content:", error);
        setIsSavingRetrospect(false);
      }
    }, 800);

    return () => {
      if (retrospectDebounceIdRef.current) {
        clearTimeout(retrospectDebounceIdRef.current);
      }
    };
  }, [retrospectContent]);

  // 다크모드 테마 적용
  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
    }
  }, [isDarkMode]);

  // System theme detection and update
  React.useEffect(() => {
    if (themeMode !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsDarkMode(e.matches);
    };

    // Initial check
    handleChange(mediaQuery);

    // Listen for changes
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [themeMode]);

  // Save themeMode to localStorage
  React.useEffect(() => {
    localStorage.setItem("otra_theme_mode", themeMode);

    // Update isDarkMode based on themeMode
    if (themeMode === "light") {
      setIsDarkMode(false);
    } else if (themeMode === "dark") {
      setIsDarkMode(true);
    }
    // For 'system', the effect above handles it
  }, [themeMode]);

  // Cross-window theme synchronization
  React.useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "otra_theme_mode" && e.newValue) {
        const newMode = e.newValue;
        if (newMode === "light" || newMode === "dark" || newMode === "system") {
          setThemeMode(newMode);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);


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

  const loadAiSummaries = React.useCallback(async () => {
    try {
      setSummariesError(null);
      const summaries = await listAiSummaries(10);
      setAiSummaries(summaries);
      setSelectedSummaryIndex((prev) => {
        if (!summaries.length) return 0;
        return Math.min(prev, summaries.length - 1);
      });
    } catch (error) {
      if (import.meta.env.DEV)
        console.error("[otra] AI summaries 로드 실패", error);
      setSummariesError(error instanceof Error ? error.message : String(error));
      setAiSummaries([]);
      setSelectedSummaryIndex(0);
    }
  }, []);

  const handleGenerateAiFeedback = React.useCallback(async () => {
    if (isGeneratingAiFeedback) return;
    setIsGeneratingAiFeedback(true);
    try {
      await generateAiFeedback();
      await loadAiSummaries();
      setSelectedSummaryIndex(0);
    } catch (error) {
      if (import.meta.env.DEV)
        console.error("[otra] AI 피드백 생성 실패", error);
      alert(
        `AI 피드백 생성에 실패했습니다: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setIsGeneratingAiFeedback(false);
    }
  }, [isGeneratingAiFeedback, loadAiSummaries]);

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

  React.useEffect(() => {
    void loadAiSummaries();
  }, [loadAiSummaries]);


  // 마크다운 업데이트 리스너
  React.useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    onHistoryUpdated(() => {
      void loadMarkdown();
      void loadAiSummaries();
    }).then((unsub) => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [loadMarkdown, loadAiSummaries]);

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

  // 테마 모드 전환: light → dark → system → light
  const toggleTheme = () => {
    setThemeMode((prev) => {
      if (prev === "light") return "dark";
      if (prev === "dark") return "system";
      return "light";
    });
  };

  // 단축키: 편집 토글(Cmd/Ctrl+E), ESC 처리
  React.useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      // 패널 토글: Cmd/Ctrl + 2 for AI panel
      if ((event.metaKey || event.ctrlKey) && event.key === "2") {
        event.preventDefault();
        event.stopPropagation();
        setIsAiPanelExpanded(prev => !prev);
        return;
      }

      // 패널 토글: Cmd/Ctrl + 3 for Retrospect panel
      if ((event.metaKey || event.ctrlKey) && event.key === "3") {
        event.preventDefault();
        event.stopPropagation();
        setIsRetrospectPanelExpanded(prev => !prev);
        return;
      }

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

  const getOffsetFromPoint = React.useCallback(
    (point?: Point | null) => {
      if (
        !point ||
        typeof point.line !== "number" ||
        typeof point.column !== "number"
      ) {
        return null;
      }

      const lines = markdownContent.split("\n");
      const lineIndex = Math.max(point.line - 1, 0);

      let offset = 0;
      for (let i = 0; i < lineIndex && i < lines.length; i += 1) {
        offset += lines[i].length + 1;
      }

      const columnIndex = Math.max(point.column - 1, 0);
      if (lineIndex < lines.length) {
        const currentLine = lines[lineIndex] ?? "";
        offset += Math.min(columnIndex, currentLine.length);
      } else {
        offset += columnIndex;
      }

      return offset;
    },
    [markdownContent]
  );

  const resolveOffsets = React.useCallback(
    (position?: Position | null) => {
      if (!position) {
        return null;
      }

      const startOffset =
        typeof position.start?.offset === "number"
          ? position.start.offset
          : getOffsetFromPoint(position.start);
      const endOffset =
        typeof position.end?.offset === "number"
          ? position.end.offset
          : getOffsetFromPoint(position.end);

      if (
        typeof startOffset !== "number" ||
        typeof endOffset !== "number" ||
        startOffset >= endOffset
      ) {
        return null;
      }

      return { startOffset, endOffset };
    },
    [getOffsetFromPoint]
  );

  const handleTaskCheckboxToggle = React.useCallback(
    async (listItem: ListItem, nextChecked: boolean) => {
      if (isSaving) {
        return;
      }

      const offsets = resolveOffsets(listItem?.position ?? null);
      if (!offsets) {
        return;
      }

      const previousContent = markdownContent;
      const { startOffset, endOffset } = offsets;
      const slice = previousContent.slice(startOffset, endOffset);
      const updatedSlice = slice.replace(
        /\[( |x|X)\]/,
        nextChecked ? "[x]" : "[ ]"
      );

      if (slice === updatedSlice) {
        return;
      }

      const nextContent =
        previousContent.slice(0, startOffset) +
        updatedSlice +
        previousContent.slice(endOffset);

      if (nextContent === previousContent) {
        return;
      }

      setMarkdownContent(nextContent);

      try {
        setIsSaving(true);
        await saveTodayMarkdown(nextContent);
        lastSavedRef.current = nextContent;
      } catch (error) {
        setMarkdownContent(previousContent);
        lastSavedRef.current = previousContent;
        if (import.meta.env.DEV) {
          console.error("[otra] 체크박스 상태 저장 실패:", error);
        }
        alert(
          `체크박스 업데이트 실패: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      } finally {
        setIsSaving(false);
      }
    },
    [isSaving, markdownContent, resolveOffsets, saveTodayMarkdown]
  );

  const markdownComponents = React.useMemo<Components>(
    () => ({
      // 전체적으로 폰트 크기 축소
      h1: ({ node, children, ...props }) => (
        <h1
          {...props}
          className={`mb-3 text-base font-semibold ${
            isDarkMode ? "text-slate-100" : "text-slate-900"
          }`}
        >
          {children}
        </h1>
      ),
      h2: ({ node, children, ...props }) => (
        <h2
          {...props}
          className={`mb-2 mt-3 text-sm font-semibold ${
            isDarkMode ? "text-slate-200" : "text-slate-800"
          }`}
        >
          {children}
        </h2>
      ),
      h3: ({ node, children, ...props }) => (
        <h3
          {...props}
          className={`mb-1.5 mt-2 text-xs font-semibold ${
            isDarkMode ? "text-slate-200" : "text-slate-800"
          }`}
        >
          {children}
        </h3>
      ),
      ul: ({ node, children, ...props }) => (
        <ul
          {...props}
          className="mb-1.5 ml-4 list-disc space-y-0.5 text-[13px] leading-5"
        >
          {children}
        </ul>
      ),
      ol: ({ node, children, ...props }) => (
        <ol
          {...props}
          className="mb-1.5 ml-4 list-decimal space-y-0.5 text-[13px] leading-5"
        >
          {children}
        </ol>
      ),
      li: ({ node, children, ...props }) => {
        const listItem = node as unknown as ListItem | undefined;
        if (typeof listItem?.checked === "boolean") {
          return (
            <li
              {...props}
              className="flex items-start gap-2 leading-5 text-[13px]"
              style={{ listStyle: "none" }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <Checkbox.Root
                className={`mt-1 flex h-4 w-4 items-center justify-center rounded border text-xs transition ${
                  isDarkMode
                    ? "border-white/20 bg-white/5 data-[state=checked]:border-emerald-300 data-[state=checked]:bg-emerald-500/20"
                    : "border-slate-300 bg-white data-[state=checked]:border-emerald-500 data-[state=checked]:bg-emerald-500/15"
                } ${isSaving ? "opacity-60" : ""}`}
                checked={Boolean(listItem.checked)}
                disabled={isSaving}
                onCheckedChange={(value) => {
                  const next = value === true;
                  if (next !== Boolean(listItem.checked)) {
                    void handleTaskCheckboxToggle(listItem, next);
                  }
                }}
                aria-label="작업 완료 여부"
              >
                <Checkbox.Indicator>
                  <Check
                    className={`h-3 w-3 ${
                      isDarkMode ? "text-emerald-300" : "text-emerald-600"
                    }`}
                    strokeWidth={3}
                  />
                </Checkbox.Indicator>
              </Checkbox.Root>
              <div className="flex-1 select-text">{children}</div>
            </li>
          );
        }
        return (
          <li {...props} className="leading-5 text-[13px]">
            {children}
          </li>
        );
      },
      p: ({ node, children, ...props }) => (
        <p {...props} className="mb-1.5 text-[13px] leading-5">
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
              className={`rounded bg-slate-900/10 px-1.5 py-0.5 text-[11px] ${
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
            className={`w-full border-collapse text-[13px] leading-5 ${
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
          className="border border-slate-200/30 px-3 py-2 text-left text-[13px] font-semibold"
        >
          {children}
        </th>
      ),
      td: ({ node, children, ...props }) => (
        <td
          {...props}
          className="border border-slate-200/30 px-3 py-2 align-top text-[13px]"
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
    [handleTaskCheckboxToggle, isDarkMode, isSaving]
  );

  const handleManualSync = React.useCallback(async () => {
    if (isSyncing) return;
    try {
      setIsSyncing(true);
      await loadMarkdown();
      await loadAiSummaries();
    } catch (error) {
      if (import.meta.env.DEV)
        console.error("[otra] 마크다운 동기화 실패", error);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, loadMarkdown, loadAiSummaries]);

  return (
    <div
      className={`relative flex h-full w-full flex-col overflow-hidden ${
        isDarkMode ? "bg-[#0d1016]" : "bg-white"
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
            placeholder="생각을 쏟아내보세요."
            className={`h-9 flex-1 min-w-0 rounded-md border-0 text-[13px] focus:outline-none focus:ring-2 focus:ring-offset-0 ${
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
          onClick={handleGenerateAiFeedback}
          onMouseDown={(e) => e.stopPropagation()}
          disabled={isGeneratingAiFeedback}
          className={`flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition ${
            isDarkMode
              ? "border-white/10 text-slate-300 hover:bg-white/5 hover:text-white disabled:opacity-60"
              : "border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-60"
          }`}
          title="AI 피드백 생성"
        >
          {isGeneratingAiFeedback ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          <span>
            {isGeneratingAiFeedback ? "생성 중..." : "AI 피드백"}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setIsAiPanelExpanded(prev => !prev)}
          className={`flex h-8 w-8 items-center justify-center rounded-full border transition ${
            isAiPanelExpanded
              ? isDarkMode
                ? "border-white/20 bg-white/10 text-slate-200"
                : "border-slate-300 bg-slate-100 text-slate-700"
              : isDarkMode
                ? "border-white/10 bg-[#0a0d13]/80 text-slate-400 hover:text-slate-200"
                : "border-slate-200 bg-white text-slate-600 hover:text-slate-900"
          }`}
          onMouseDown={(e) => e.stopPropagation()}
          title={isAiPanelExpanded ? "정리하기 패널 접기" : "정리하기 패널 펼치기"}
        >
          <Brain className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setIsRetrospectPanelExpanded(prev => !prev)}
          className={`flex h-8 w-8 items-center justify-center rounded-full border transition ${
            isRetrospectPanelExpanded
              ? isDarkMode
                ? "border-white/20 bg-white/10 text-slate-200"
                : "border-slate-300 bg-slate-100 text-slate-700"
              : isDarkMode
                ? "border-white/10 bg-[#0a0d13]/80 text-slate-400 hover:text-slate-200"
                : "border-slate-200 bg-white text-slate-600 hover:text-slate-900"
          }`}
          onMouseDown={(e) => e.stopPropagation()}
          title={isRetrospectPanelExpanded ? "회고 패널 접기" : "회고 패널 펼치기"}
        >
          <NotebookPen className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            void handleManualSync();
          }}
          className={`flex h-8 w-8 items-center justify-center rounded-full border transition ${
            isDarkMode
              ? "border-white/10 bg-[#0a0d13]/80 text-slate-400 hover:text-slate-200"
              : "border-slate-200 bg-white text-slate-600 hover:text-slate-900"
          } ${isSyncing ? "opacity-80" : ""}`}
          onMouseDown={(e) => e.stopPropagation()}
          disabled={isSyncing}
          title="마크다운 동기화"
        >
          <RotateCcw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
        </button>
        <button
          type="button"
          onClick={toggleTheme}
          className={`flex h-8 w-8 items-center justify-center rounded-full border transition ${
            isDarkMode
              ? "border-white/10 bg-[#0a0d13]/80 text-slate-400 hover:text-slate-200"
              : "border-slate-200 bg-white text-slate-600 hover:text-slate-900"
          }`}
          onMouseDown={(e) => e.stopPropagation()}
          title={
            themeMode === "light"
              ? "라이트 모드"
              : themeMode === "dark"
              ? "다크 모드"
              : "시스템 테마"
          }
        >
          {themeMode === "light" ? (
            <Sun className="h-4 w-4" />
          ) : themeMode === "dark" ? (
            <Moon className="h-4 w-4" />
          ) : (
            <MonitorSmartphone className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* 3-패널 레이아웃: 균등한 너비 */}
      <div
        ref={splitRef}
        className="relative z-20 flex flex-1 items-stretch gap-0 px-0 py-0 overflow-hidden"
      >
        {/* 1. 쏟아내기 패널 */}
        <section
          className={`flex flex-1 flex-col overflow-hidden border-r ${
            isDarkMode
              ? "bg-[#0f141f] text-slate-100 border-white/10"
              : "bg-white text-slate-900 border-slate-200"
          }`}
        >
          <div className="flex h-12 items-center justify-between border-b border-slate-200/20 px-3.5 text-[11px] font-semibold uppercase tracking-[0.2em]">
            <span>쏟아내기</span>
            {isEditing ? (
              <span
                className={`rounded-full px-3 py-1 text-[10px] ${
                  isDarkMode
                    ? "bg-white/10 text-slate-200"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                편집 중
              </span>
            ) : null}
          </div>
          <div className="flex-1 overflow-hidden px-3.5 py-2.5">
            <div
              ref={markdownRef}
              className="h-full w-full overflow-y-auto"
              onMouseDown={(e) => e.stopPropagation()}
              style={{ pointerEvents: "auto" }}
            >
              {isEditing ? (
                <textarea
                  ref={editorRef}
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  className={`w-full min-h-[260px] resize-none border text-[13px] leading-5 outline-none ${
                    isDarkMode
                      ? "border-white/10 bg-[#05070c] text-slate-100 placeholder:text-slate-500"
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
                      const el = editorRef.current;
                      if (!el) return;
                      e.preventDefault();

                      const start = el.selectionStart;
                      const end = el.selectionEnd;
                      const before = editingContent.slice(0, start);
                      const after = editingContent.slice(end);
                      const lineStart = before.lastIndexOf("\n") + 1;
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
                      setTimeout(() => {
                        const ta = editorRef.current;
                        if (ta) ta.setSelectionRange(newCaret, newCaret);
                      }, 0);
                    }
                  }}
                />
              ) : (
                <div
                  className={`prose prose-sm max-w-none ${
                    isDarkMode
                      ? "prose-invert text-slate-200"
                      : "text-slate-700"
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
          </div>
        </section>

        {/* 2. AI 피드백 패널 */}
        {isAiPanelExpanded && (
          <section
            className={`flex flex-1 flex-col overflow-hidden border-r ${
              isDarkMode
                ? "bg-[#111625] text-slate-100 border-white/10"
                : "bg-white text-slate-900 border-slate-200"
            }`}
          >
            <div className="flex h-12 items-center justify-between border-b border-slate-200/20 px-3.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.25em]">
                정리하기
              </span>
                <div className="flex items-center gap-3">
                  {isGeneratingAiFeedback && (
                    <span
                      className={`flex items-center gap-1 text-[11px] ${
                        isDarkMode ? "text-sky-300" : "text-blue-500"
                      }`}
                    >
                      <Loader2 className="h-3 w-3 animate-spin" />
                      생성 중...
                    </span>
                  )}
                  {aiSummaries.length > 0 && aiSelectValue !== undefined && (
                    <Select.Root
                      value={aiSelectValue}
                      onValueChange={(v) => setSelectedSummaryIndex(Number(v))}
                    >
                      <Select.Trigger
                        className={`inline-flex h-8 items-center justify-between gap-2 rounded-md border px-2.5 text-xs ${
                          isDarkMode
                            ? "border-white/10 bg-[#0a0d13] text-slate-100"
                            : "border-slate-200 bg-white text-slate-700"
                        }`}
                        aria-label="요약 선택"
                      >
                        <Select.Value placeholder="버전" />
                        <Select.Icon>
                          <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                        </Select.Icon>
                      </Select.Trigger>
                      <Select.Portal>
                        <Select.Content
                          className={`z-50 overflow-hidden rounded-md border bg-white text-slate-800 shadow ${
                            isDarkMode
                              ? "border-white/10 bg-[#0a0d13] text-slate-100"
                              : "border-slate-200 bg-white text-slate-800"
                          }`}
                          position="popper"
                          sideOffset={6}
                        >
                          <Select.ScrollUpButton className="flex items-center justify-center p-1">
                            <ChevronUp className="h-3.5 w-3.5 opacity-60" />
                          </Select.ScrollUpButton>
                          <Select.Viewport className="p-1">
                            {aiSummaries.map((summary, index) => (
                              <Select.Item
                                key={summary.path}
                                value={String(index)}
                                className={`relative flex cursor-pointer select-none items-center gap-2 rounded px-2 py-1.5 text-xs outline-none transition hover:bg-slate-100/70 data-[state=checked]:font-semibold ${
                                  isDarkMode
                                    ? "hover:bg-white/10"
                                    : "hover:bg-slate-100"
                                }`}
                              >
                                <Select.ItemText>
                                  #{aiSummaries.length - index}{" "}
                                  {getSummaryLabel(summary)}
                                </Select.ItemText>
                                <Select.ItemIndicator className="ml-auto">
                                  <Check className="h-3.5 w-3.5" />
                                </Select.ItemIndicator>
                              </Select.Item>
                            ))}
                          </Select.Viewport>
                          <Select.ScrollDownButton className="flex items-center justify-center p-1">
                            <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                          </Select.ScrollDownButton>
                        </Select.Content>
                      </Select.Portal>
                    </Select.Root>
                  )}
                </div>
            </div>
            <div className="flex-1 overflow-y-auto px-3.5 py-3">
                {isGeneratingAiFeedback ? (
                  <div className="space-y-4">
                    <div className="mb-2 text-xs font-medium text-slate-400">
                      AI 피드백 생성 중...
                    </div>
                    {[0, 1, 2, 3].map((row) => (
                      <div key={row} className="space-y-2">
                        <div
                          className={`h-3.5 w-2/3 rounded-full ${
                            isDarkMode ? "bg-white/10" : "bg-slate-200"
                          } animate-pulse`}
                        />
                        <div
                          className={`h-2.5 w-full rounded-full ${
                            isDarkMode ? "bg-white/10" : "bg-slate-200"
                          } animate-pulse`}
                        />
                        <div
                          className={`h-2.5 w-5/6 rounded-full ${
                            isDarkMode ? "bg-white/10" : "bg-slate-200"
                          } animate-pulse`}
                        />
                      </div>
                    ))}
                  </div>
                ) : summariesError ? (
                  <div className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-xs leading-5 text-red-200">
                    AI 피드백을 불러오지 못했어요.
                    <br />
                    {summariesError}
                  </div>
                ) : aiSummaries.length === 0 ? (
                  <div className="rounded-md border border-slate-200/30 bg-slate-100/5 p-3 text-xs leading-5 text-slate-400">
                    오늘 작성된 AI 피드백이 없습니다.
                  </div>
                ) : (
                  <div
                    className={`prose prose-sm max-w-none ${
                      isDarkMode
                        ? "prose-invert text-slate-200"
                        : "text-slate-700"
                    }`}
                  >
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={markdownComponents}
                    >
                      {selectedSummary?.content?.trim() ||
                        "요약 내용이 없습니다."}
                    </ReactMarkdown>
                  </div>
                )}
            </div>
          </section>
        )}

        {/* 3. 회고하기 패널 */}
        {isRetrospectPanelExpanded && (
          <section
            className={`flex flex-1 flex-col overflow-hidden ${
              isDarkMode
                ? "bg-[#0f141f] text-slate-100"
                : "bg-white text-slate-900"
            }`}
          >
            <div className="flex h-12 items-center justify-between border-b border-slate-200/20 px-3.5 text-[11px] font-semibold uppercase tracking-[0.2em]">
              <span>회고하기</span>
              {isSavingRetrospect && (
                <span
                  className={`rounded-full px-3 py-1 text-[10px] ${
                    isDarkMode
                      ? "bg-white/10 text-slate-200"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  저장 중
                </span>
              )}
            </div>
            <div className="flex-1 overflow-hidden px-3.5 py-2.5">
            <div className="h-full w-full overflow-y-auto">
              <textarea
                ref={retrospectRef}
                value={retrospectContent}
                onChange={(e) => setRetrospectContent(e.target.value)}
                className={`w-full min-h-[260px] resize-none border-0 text-[13px] leading-5 outline-none ${
                  isDarkMode
                    ? "bg-[#05070c] text-slate-100 placeholder:text-slate-500"
                    : "bg-white text-slate-900 placeholder:text-slate-400"
                }`}
                style={{
                  fontFamily:
                    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  padding: 12,
                  height: '100%',
                }}
                placeholder="AI의 피드백을 보고 떠오르는 생각을 자유롭게 적어보세요..."
              />
            </div>
            </div>
          </section>
        )}
      </div>


      {/* 드래그 가능한 영역 - 가장자리 (더 넓게) */}
      {/* 상단 가장자리 */}
      <div
        className="absolute top-0 left-0 right-0 h-12 z-30 cursor-move"
        data-tauri-drag-region
      />
      {/* 좌측 가장자리 */}
      <div
        className="absolute top-12 bottom-12 left-0 w-12 z-30 cursor-move"
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
          <span
            className="inline-flex items-center gap-2"
            title="AI 패널 토글"
          >
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
    </div>
  );
}
