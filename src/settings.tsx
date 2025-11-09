import React from "react";
import ReactDOM from "react-dom/client";
import { Keyboard, History, Folder, RotateCcw, X } from "lucide-react";
import { appWindow } from "@tauri-apps/api/window";
import { open } from "@tauri-apps/api/dialog";
import { documentDir, join } from "@tauri-apps/api/path";
import {
  getAppSettings,
  setOverlayShortcut,
  setHistoryDirectory as invokeSetHistoryDirectory,
  openHistoryFolder,
} from "@/lib/tauri";
import "./index.css";

const DEFAULT_SHORTCUT = "CommandOrControl+J";

type SectionId = "shortcut" | "history";

type Feedback = {
  kind: "success" | "error";
  message: string;
};

function SettingsApp() {
  const [loading, setLoading] = React.useState(true);
  const [overlayShortcut, setOverlayShortcutState] = React.useState(DEFAULT_SHORTCUT);
  const [shortcutInput, setShortcutInput] = React.useState(DEFAULT_SHORTCUT);
  const [historyDirectory, setHistoryDirectoryState] = React.useState("");
  const [defaultHistoryDirectory, setDefaultHistoryDirectory] = React.useState("");
  const [feedback, setFeedback] = React.useState<Feedback | null>(null);
  const [savingShortcut, setSavingShortcut] = React.useState(false);
  const [updatingHistory, setUpdatingHistory] = React.useState(false);
  const timerRef = React.useRef<number | null>(null);
  const [activeSection, setActiveSection] = React.useState<SectionId>("shortcut");

  const navItems = React.useMemo(
    () => [
      {
        id: "shortcut" as SectionId,
        label: "단축키",
        description: "오버레이 토글",
        icon: Keyboard,
      },
      {
        id: "history" as SectionId,
        label: "히스토리",
        description: "Markdown 저장",
        icon: History,
      },
    ],
    []
  );

  const sectionMeta: Record<SectionId, { badge: string; title: string; description: string }> = {
    shortcut: {
      badge: "SHORTCUT",
      title: "오버레이 단축키",
      description: "가장 자주 쓰는 단축키를 직접 지정하세요.",
    },
    history: {
      badge: "HISTORY",
      title: "히스토리 저장 경로",
      description: "Markdown 히스토리를 저장할 폴더를 관리합니다.",
    },
  };

  const showFeedback = React.useCallback((kind: Feedback["kind"], message: string) => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }
    setFeedback({ kind, message });
    timerRef.current = window.setTimeout(() => {
      setFeedback(null);
      timerRef.current = null;
    }, 2400);
  }, []);

  const refreshDefaultHistory = React.useCallback(async () => {
    try {
      const docs = await documentDir();
      const fallback = await join(docs, "OTRA", "history");
      setDefaultHistoryDirectory(fallback);
    } catch {
      // macOS 문서 접근 실패 시에는 기본 경로 표시를 생략
    }
  }, []);

  React.useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const settings = await getAppSettings();
        if (!mounted) return;
        setOverlayShortcutState(settings.overlayShortcut);
        setShortcutInput(settings.overlayShortcut);
        setHistoryDirectoryState(settings.historyDirectory);
      } catch (error) {
        if (!mounted) return;
        const message =
          error instanceof Error ? error.message : "설정을 불러오지 못했습니다";
        showFeedback("error", message);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    void refreshDefaultHistory();

    return () => {
      mounted = false;
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [refreshDefaultHistory, showFeedback]);

  const applyShortcut = React.useCallback(
    async (value: string) => {
      const normalized = value.trim() || DEFAULT_SHORTCUT;
      if (normalized === overlayShortcut) {
        setShortcutInput(normalized);
        showFeedback("success", "이미 적용된 단축키입니다.");
        return;
      }

      setSavingShortcut(true);
      try {
        await setOverlayShortcut(normalized);
        setOverlayShortcutState(normalized);
        setShortcutInput(normalized);
        showFeedback("success", "단축키를 저장했어요.");
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "단축키를 저장하지 못했습니다";
        showFeedback("error", message);
      } finally {
        setSavingShortcut(false);
      }
    },
    [overlayShortcut, showFeedback]
  );

  const applyHistoryDirectory = React.useCallback(
    async (value: string) => {
      const normalized = value.trim();
      if (!normalized) {
        showFeedback("error", "유효한 경로를 선택해주세요.");
        return;
      }
      if (normalized === historyDirectory) {
        showFeedback("success", "이미 사용 중인 경로입니다.");
        return;
      }

      setUpdatingHistory(true);
      try {
        await invokeSetHistoryDirectory(normalized);
        setHistoryDirectoryState(normalized);
        showFeedback("success", "히스토리 폴더를 변경했습니다.");
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "히스토리 폴더를 변경하지 못했습니다";
        showFeedback("error", message);
      } finally {
        setUpdatingHistory(false);
      }
    },
    [historyDirectory, showFeedback]
  );

  const handleShortcutSubmit = React.useCallback(() => {
    void applyShortcut(shortcutInput);
  }, [applyShortcut, shortcutInput]);

  const handleShortcutReset = React.useCallback(() => {
    void applyShortcut(DEFAULT_SHORTCUT);
  }, [applyShortcut]);

  const handlePickHistoryDirectory = React.useCallback(async () => {
    const selection = await open({
      directory: true,
      multiple: false,
      defaultPath: historyDirectory || defaultHistoryDirectory || undefined,
    });

    if (!selection) {
      return;
    }

    const resolved = Array.isArray(selection) ? selection[0] : selection;
    if (typeof resolved === "string") {
      void applyHistoryDirectory(resolved);
    }
  }, [applyHistoryDirectory, defaultHistoryDirectory, historyDirectory]);

  const handleRestoreHistoryDirectory = React.useCallback(() => {
    if (!defaultHistoryDirectory) {
      showFeedback("error", "기본 경로를 확인할 수 없습니다.");
      return;
    }
    void applyHistoryDirectory(defaultHistoryDirectory);
  }, [applyHistoryDirectory, defaultHistoryDirectory, showFeedback]);

  const handleOpenHistoryFolder = React.useCallback(async () => {
    try {
      await openHistoryFolder();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "폴더를 열지 못했습니다";
      showFeedback("error", message);
    }
  }, [showFeedback]);

  const renderShortcutSection = () => (
    <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
      <div className="flex flex-col gap-6">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-white">단축키 설정</h3>
          <p className="text-sm text-slate-400">
            오버레이를 표시할 단축키를 입력하세요. 값을 비워 저장하면 기본값 ({DEFAULT_SHORTCUT})으로 복원됩니다.
          </p>
        </div>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <input
              value={shortcutInput}
              onChange={(event) => setShortcutInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void applyShortcut(shortcutInput);
                }
              }}
              placeholder={DEFAULT_SHORTCUT}
              className="h-12 flex-1 min-w-[220px] rounded-2xl border border-white/10 bg-black/30 px-4 text-sm text-slate-100 placeholder:text-slate-500 focus:border-white/40 focus:outline-none"
              spellCheck={false}
            />
            <button
              type="button"
              onClick={handleShortcutSubmit}
              disabled={savingShortcut}
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-white px-5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingShortcut ? "저장 중" : "저장"}
            </button>
            <button
              type="button"
              onClick={handleShortcutReset}
              disabled={savingShortcut}
              className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/20 bg-white/5 px-5 text-sm font-semibold text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              기본값 복원
            </button>
          </div>
          <p className="text-xs text-slate-500">
            현재 등록된 단축키: <span className="text-slate-300">{overlayShortcut}</span>
          </p>
        </div>
      </div>
    </section>
  );

  const renderHistorySection = () => (
    <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-white">히스토리 폴더</h3>
            <p className="text-sm text-slate-400">
              OTRA가 생성하는 Markdown 히스토리를 저장할 폴더를 선택하거나 기본 경로로 되돌릴 수 있습니다.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenHistoryFolder}
            className="inline-flex h-10 items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 text-xs font-semibold text-slate-200 transition hover:bg-white/20"
          >
            폴더 열기
          </button>
        </div>
        <div className="space-y-4">
          <div className="break-words rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-xs text-slate-300">
            {historyDirectory || "경로 정보를 불러오지 못했습니다."}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handlePickHistoryDirectory}
              disabled={updatingHistory}
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-white px-5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {updatingHistory ? "변경 중" : "경로 변경"}
            </button>
            <button
              type="button"
              onClick={handleRestoreHistoryDirectory}
              disabled={updatingHistory || !defaultHistoryDirectory}
              className="inline-flex h-12 items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 text-sm font-semibold text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RotateCcw className="h-4 w-4" /> 기본 경로 복원
            </button>
          </div>
          {defaultHistoryDirectory && (
            <p className="text-xs text-slate-500">
              기본 경로 제안: {defaultHistoryDirectory}
            </p>
          )}
        </div>
      </div>
    </section>
  );

  const meta = sectionMeta[activeSection];

  const content = activeSection === "shortcut" ? renderShortcutSection() : renderHistorySection();

  const layoutContent = (
    <div className="flex h-full w-full bg-gradient-to-br from-[#070b12] via-[#0a101b] to-[#05070d] text-slate-100">
      <div className="flex h-full w-full rounded-[28px] border border-white/10 bg-white/[0.02] shadow-[0_32px_100px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
        <aside className="flex w-64 flex-col border-r border-white/10 bg-white/[0.03]">
          <div className="px-6 pb-6 pt-8">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500">OTRA</p>
            <h1 className="mt-3 text-xl font-semibold text-white">환경 설정</h1>
            <p className="mt-2 text-xs text-slate-500">
              Overlay와 History 구성을 한 번에 관리하세요.
            </p>
          </div>
          <nav className="flex-1 overflow-y-auto px-4 pb-8">
            <div className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveSection(item.id)}
                    className={`group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${
                      isActive
                        ? "bg-white/15 text-white shadow-[0_12px_30px_rgba(15,23,42,0.35)]"
                        : "text-slate-400 hover:bg-white/10 hover:text-slate-200"
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border text-sm font-semibold ${
                        isActive
                          ? "border-white/20 bg-white/20 text-white"
                          : "border-white/10 bg-transparent text-slate-400 group-hover:text-slate-200"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="flex flex-col">
                      <span className="text-sm font-semibold leading-tight">{item.label}</span>
                      <span className="text-xs leading-tight text-slate-500 group-hover:text-slate-400">
                        {item.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </nav>
          <div className="px-6 pb-6 text-[11px] text-slate-500">
            ⓘ 변경 사항은 즉시 적용됩니다.
          </div>
        </aside>
        <main className="flex flex-1 flex-col overflow-hidden">
          <header className="flex items-start justify-between border-b border-white/10 bg-white/[0.03] px-8 py-6">
            <div>
              <span className="text-[11px] uppercase tracking-[0.4em] text-slate-500">{meta.badge}</span>
              <h2 className="mt-2 text-2xl font-semibold text-white">{meta.title}</h2>
              <p className="mt-1 text-sm text-slate-400">{meta.description}</p>
            </div>
            <button
              type="button"
              onClick={() => appWindow.close()}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-slate-300 transition hover:bg-white/20 hover:text-white"
              aria-label="창 닫기"
            >
              <X className="h-4 w-4" />
            </button>
          </header>
          <div className="flex-1 overflow-hidden">
            <div className="flex h-full flex-col gap-4 overflow-y-auto px-8 py-6">
              {feedback && (
                <div
                  className={`rounded-2xl border px-4 py-3 text-sm backdrop-blur ${
                    feedback.kind === "success"
                      ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                      : "border-rose-400/30 bg-rose-500/10 text-rose-200"
                  }`}
                >
                  {feedback.message}
                </div>
              )}
              {content}
            </div>
          </div>
        </main>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#070b12] via-[#0a101b] to-[#05070d] text-slate-100">
        <div className="flex h-full w-full animate-pulse rounded-[28px] border border-white/10 bg-white/[0.02] backdrop-blur">
          <aside className="w-64 border-r border-white/10 bg-white/[0.03]" />
          <div className="flex-1" />
        </div>
      </div>
    );
  }

  return layoutContent;
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <SettingsApp />
  </React.StrictMode>
);
