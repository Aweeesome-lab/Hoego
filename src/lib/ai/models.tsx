import { listen } from '@tauri-apps/api/event';
import React from 'react';
import toast from 'react-hot-toast';

import {
  aiLlamaStatus,
  aiModelsList,
  aiLlamaStartServer,
  aiModelsDir,
  aiModelDownload,
  aiModelDelete,
  openModelsFolder,
  aiSummarizeV1,
  aiLlamaStopServer,
  aiEngineStatus,
  aiEngineInstall,
  openEngineFolder,
} from './client';
import { MODEL_PRESETS } from './presets';

type Props = {
  onClose?: () => void;
};

export function ModelsContent() {
  const [_checking, setChecking] = React.useState(false);
  const [status, setStatus] = React.useState<{ text: string; ok: boolean }>({
    text: '확인 전',
    ok: false,
  });
  const [installed, setInstalled] = React.useState<
    { filename: string; sizeBytes: number }[]
  >([]);
  const [modelsDir, setModelsDir] = React.useState<string>('');
  const [starting, setStarting] = React.useState<string | null>(null);
  const [progress, setProgress] = React.useState<
    Record<string, { received: number; total: number }>
  >({});
  const [installing, setInstalling] = React.useState<string | null>(null);
  const [testNote, setTestNote] = React.useState<string>(
    '회의 요약 예시: 일정 조정, 다음 액션...\n- 프론트 QA 마감: 내일\n- 담당: A, 리뷰: B'
  );
  const [testResult, setTestResult] = React.useState<string>('');
  const [running, setRunning] = React.useState(false);
  const [summarizing, setSummarizing] = React.useState(false);
  const [engine, setEngine] = React.useState<{
    installed: boolean;
    path: string;
  } | null>(null);
  const [installingEngine, setInstallingEngine] = React.useState(false);
  const [engineProgress, setEngineProgress] = React.useState<{
    received: number;
    total: number;
  } | null>(null);

  const handleCheck = async () => {
    setChecking(true);
    try {
      const s = await aiLlamaStatus();
      if (s.running) {
        setStatus({
          text: `Running on :${s.port}${
            s.activeModel ? ` • ${s.activeModel}` : ''
          }`,
          ok: true,
        });
        setRunning(true);
      } else if (s.reachable) {
        setStatus({ text: `Reachable on :${s.port}`, ok: true });
        setRunning(false);
      } else {
        setStatus({ text: '서버를 찾지 못했습니다', ok: false });
        setRunning(false);
      }
    } catch (e) {
      setStatus({ text: `오류: ${String(e)}`, ok: false });
    } finally {
      setChecking(false);
    }
  };

  const refreshInstalled = async () => {
    try {
      const d = await aiModelsDir();
      setModelsDir(d);
      const list = await aiModelsList();
      setInstalled(list);
      const eng = await aiEngineStatus();
      setEngine(eng);
    } catch (e) {
      console.error('[hoego] refreshInstalled error:', e);
    }
  };

  React.useEffect(() => {
    void handleCheck();
    void refreshInstalled();
    const u1 = listen('ai:model_download_started', (e: any) => {
      const p = e.payload as { filename: string };
      const preset = MODEL_PRESETS.find((x) => x.filename === p.filename);
      if (preset) setInstalling(preset.id);
    });
    const u2 = listen('ai:model_download_progress', (e: any) => {
      const p = e.payload as {
        filename: string;
        received: number;
        total: number;
      };
      setProgress((prev) => ({
        ...prev,
        [p.filename]: { received: p.received, total: p.total },
      }));
    });
    const u3 = listen('ai:model_download_error', (e: any) => {
      const p = e.payload as { filename: string; message: string };
      console.error('[hoego] model download error', p);
      setInstalling(null);
      const errorMsg = p.message || 'unknown error';
      toast.error(
        `모델 다운로드 실패\n\n파일: ${p.filename}\n오류: ${errorMsg}\n\n터미널에서 더 자세한 로그를 확인하세요.`,
        { duration: 5000 }
      );
    });
    const u4 = listen('ai:model_download_done', async (e: any) => {
      await refreshInstalled();
      setInstalling(null);
      // 진행률 초기화
      const p = e.payload as { filename: string };
      setProgress((prev) => {
        const newProgress = { ...prev };
        delete newProgress[p.filename];
        return newProgress;
      });
    });

    // 엔진 설치 이벤트
    const u5 = listen('ai:engine_install_started', () => {
      setInstallingEngine(true);
      setEngineProgress(null);
    });
    const u6 = listen('ai:engine_install_progress', (e: any) => {
      const p = e.payload as { received: number; total: number };
      setEngineProgress(p);
    });
    const u7 = listen('ai:engine_install_error', (e: any) => {
      const p = e.payload as { message: string };
      console.error('[hoego] engine install error', p);
      setInstallingEngine(false);
      setEngineProgress(null);
      toast.error(
        `엔진 설치 실패\n\n오류: ${p.message}\n\n터미널에서 더 자세한 로그를 확인하세요.`,
        { duration: 5000 }
      );
    });
    const u8 = listen('ai:engine_install_done', async () => {
      await refreshInstalled();
      // 엔진 설치 완료 시 toast 표시 (모델 다운로드 중이면 자동으로 계속 진행)
      if (!installing) {
        setInstallingEngine(false);
        setEngineProgress(null);
        toast.success(
          '✅ llama.cpp 엔진 설치 완료!\n\n이제 모델을 다운로드하고 서버를 시작할 수 있습니다.',
          { duration: 4000 }
        );
      }
    });

    // AI 요약 이벤트
    const u9 = listen('ai:summarize_started', () => {
      setSummarizing(true);
      setTestResult('AI가 분석 중입니다... (30초~1분 소요)');
    });
    const u10 = listen('ai:summarize_done', (e: any) => {
      const p = e.payload as { result: any };
      // 마크다운 형식으로 표시
      const markdown = p.result?.markdown || JSON.stringify(p.result, null, 2);
      setTestResult(markdown);
      setSummarizing(false);
    });
    const u11 = listen('ai:summarize_error', (e: any) => {
      const p = e.payload as { message: string };
      setTestResult(`오류: ${p.message}`);
      setSummarizing(false);
    });

    return () => {
      void Promise.all(
        [u1, u2, u3, u4, u5, u6, u7, u8, u9, u10, u11].map((p) =>
          p.then((un) => un())
        )
      );
    };
  }, []);

  return (
    <div className="grid grid-cols-[280px_1fr] h-full">
      <aside className="h-full border-r border-white/10 bg-black/30 p-5 text-slate-300">
        <div className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
          서버 상태
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 backdrop-blur p-4">
          <div className="flex items-center gap-2">
            <div
              className={`h-2.5 w-2.5 rounded-full ${
                status.ok
                  ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50 animate-pulse'
                  : 'bg-slate-500'
              }`}
            />
            <div className="text-sm font-medium text-slate-100">
              {status.ok ? 'AI 실행 중' : '대기 중'}
            </div>
          </div>
          <div
            className={`mt-2 text-xs ${
              status.ok ? 'text-emerald-400' : 'text-slate-400'
            }`}
          >
            {status.text}
          </div>
          {running && (
            <div className="mt-3 pt-3 border-t border-white/5">
              <button
                onClick={async () => {
                  try {
                    await aiLlamaStopServer();
                  } catch (_e) {
                    // Ignore stop errors
                  }
                  await handleCheck();
                }}
                className="w-full rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-300 hover:bg-red-500/20 transition-all"
              >
                서버 중지
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 rounded-xl border border-white/10 bg-black/20 backdrop-blur p-4">
          <div className="flex items-center gap-2 mb-3">
            <div
              className={`h-2 w-2 rounded-full ${
                engine?.installed ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            <div className="text-xs font-semibold text-slate-200">
              엔진 상태
            </div>
          </div>
          {engine?.installed ? (
            <div className="text-xs text-emerald-400">
              ✓ llama.cpp 설치 완료
            </div>
          ) : (
            <div className="text-xs text-amber-400">
              모델 다운로드 시 자동 설치
            </div>
          )}
        </div>

        <div className="mt-auto pt-6">
          <button
            onClick={async () => {
              try {
                await openEngineFolder();
              } catch (_e) {
                // Ignore folder open errors
              }
            }}
            className="w-full rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/10 transition-all"
          >
            📁 데이터 폴더 열기
          </button>
          <div className="mt-2 text-[10px] text-slate-500 text-center">
            모델 & 엔진 위치
          </div>
        </div>
      </aside>
      <main className="p-6 text-slate-200 overflow-y-auto">
        <section>
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-100">
              모델 다운로드
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              원클릭으로 모델을 다운로드하면 AI를 바로 사용할 수 있습니다
              {!engine?.installed && (
                <span className="text-amber-400"> (엔진 자동 설치 포함)</span>
              )}
            </p>
          </div>
          <ul className="space-y-3">
            {MODEL_PRESETS.map((p) => {
              const prog = progress[p.filename];
              const pct =
                prog && prog.total
                  ? Math.min(
                      100,
                      Math.floor((prog.received / prog.total) * 100)
                    )
                  : 0;
              const isInstalling = installing === p.id;
              const isInstalled = installed.some(
                (m) => m.filename === p.filename
              );

              return (
                <li
                  key={p.id}
                  className="rounded-xl border border-white/10 bg-black/20 backdrop-blur p-4 hover:border-white/20 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium text-slate-100">
                          {p.label}
                        </div>
                        {isInstalled && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            설치됨
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                        <span className="font-mono">
                          {(p.approxSizeGB ?? 0).toFixed(1)} GB
                        </span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-500">{p.filename}</span>
                      </div>
                      {p.note && (
                        <div className="text-[11px] text-amber-400/70 mt-1">
                          ⚠️ {p.note}
                        </div>
                      )}
                    </div>
                    <button
                      className={`rounded-lg px-4 py-2 text-xs font-medium transition-all ${
                        isInstalling
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : isInstalled
                            ? 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30'
                      } disabled:opacity-60`}
                      onClick={async () => {
                        if (isInstalled) {
                          // TODO: Add confirmation modal for better UX
                          toast('모델을 재다운로드합니다.');
                        }
                        try {
                          setInstalling(p.id);

                          // 1. 엔진 체크 및 자동 설치
                          const engineStatus = await aiEngineStatus();
                          if (!engineStatus.installed) {
                            setInstallingEngine(true);
                            try {
                              await aiEngineInstall();
                            } catch (engineErr) {
                              console.error(
                                '[hoego] 엔진 설치 실패:',
                                engineErr
                              );
                              throw new Error(
                                `엔진 설치 실패: ${
                                  engineErr instanceof Error
                                    ? engineErr.message
                                    : String(engineErr)
                                }`
                              );
                            } finally {
                              setInstallingEngine(false);
                              setEngineProgress(null);
                            }
                          }

                          // 2. 모델 다운로드
                          await aiModelDownload(p.url, p.filename);
                          await refreshInstalled();
                        } catch (e) {
                          console.error('[hoego] preset install failed', e);
                          const errorMsg =
                            e instanceof Error ? e.message : String(e);
                          toast.error(
                            `설치 실패: ${errorMsg}\n\n자세한 내용은 콘솔 로그를 확인하세요.`,
                            { duration: 5000 }
                          );
                        } finally {
                          setInstalling(null);
                          setInstallingEngine(false);
                          setEngineProgress(null);
                        }
                      }}
                      disabled={isInstalling || installingEngine}
                    >
                      {installingEngine
                        ? '엔진 준비 중...'
                        : isInstalling
                          ? '다운로드 중...'
                          : isInstalled
                            ? '재다운로드'
                            : '다운로드'}
                    </button>
                  </div>
                  {(isInstalling ||
                    prog ||
                    (installingEngine && installing === p.id)) && (
                    <div className="mt-4 pt-3 border-t border-white/5">
                      {/* 엔진 설치 중 */}
                      {installingEngine && installing === p.id && (
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-medium text-blue-300">
                              1/2: 엔진 설치 중...
                            </span>
                            {engineProgress && engineProgress.total > 0 && (
                              <span className="text-xs font-mono text-blue-400">
                                {Math.floor(
                                  (engineProgress.received /
                                    engineProgress.total) *
                                    100
                                )}
                                %
                              </span>
                            )}
                          </div>
                          <div className="relative h-3 w-full overflow-hidden rounded-full bg-white/10">
                            {engineProgress && engineProgress.total > 0 ? (
                              <div
                                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300"
                                style={{
                                  width: `${Math.floor(
                                    (engineProgress.received /
                                      engineProgress.total) *
                                      100
                                  )}%`,
                                }}
                              />
                            ) : (
                              <div className="h-full w-1/3 bg-gradient-to-r from-blue-500/50 to-cyan-500/50 animate-pulse" />
                            )}
                          </div>
                          <div className="mt-1 text-[10px] text-slate-400">
                            {engineProgress
                              ? `${(
                                  engineProgress.received /
                                  (1024 * 1024)
                                ).toFixed(1)} MB`
                              : '준비 중...'}
                            {engineProgress &&
                              engineProgress.total > 0 &&
                              ` / ${(
                                engineProgress.total /
                                (1024 * 1024)
                              ).toFixed(1)} MB`}
                          </div>
                        </div>
                      )}

                      {/* 모델 다운로드 중 */}
                      {(isInstalling || prog) && (
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-medium text-emerald-300">
                              {installingEngine ? '2/2: ' : ''}모델 다운로드
                              중...
                            </span>
                            {prog && prog.total > 0 && (
                              <span className="text-xs font-mono font-semibold text-emerald-400">
                                {pct}%
                              </span>
                            )}
                          </div>
                          <div className="relative h-3 w-full overflow-hidden rounded-full bg-white/10">
                            {prog && prog.total > 0 ? (
                              <>
                                <div
                                  className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-green-500 transition-all duration-500 ease-out"
                                  style={{ width: `${pct}%` }}
                                />
                                <div
                                  className="absolute inset-0 bg-white/20 animate-pulse"
                                  style={{ width: `${pct}%` }}
                                />
                              </>
                            ) : (
                              <div className="h-full w-1/3 bg-gradient-to-r from-emerald-500/50 to-green-500/50 animate-pulse" />
                            )}
                          </div>
                          <div className="mt-1 text-[10px] text-slate-400">
                            {(() => {
                              const mb = (n: number) =>
                                (n / (1024 * 1024)).toFixed(1);
                              if (!prog) return '다운로드 준비 중...';
                              if (prog.total > 0)
                                return `${mb(prog.received)} MB / ${mb(
                                  prog.total
                                )} MB`;
                              return `${mb(prog.received)} MB 다운로드 중...`;
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
        <section className="mt-8">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-100">
              설치된 모델
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              로컬에 다운로드된 모델 목록
            </p>
          </div>
          {installed.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-black/20 backdrop-blur p-8 text-center">
              <div className="text-4xl mb-3">📦</div>
              <div className="text-sm text-slate-400">
                아직 설치된 모델이 없습니다
              </div>
              <div className="text-xs text-slate-500 mt-1">
                위에서 모델을 다운로드해보세요
              </div>
            </div>
          ) : (
            <ul className="space-y-3">
              {installed.map((m) => (
                <li
                  key={m.filename}
                  className="rounded-xl border border-white/10 bg-black/20 backdrop-blur p-4 hover:border-white/20 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium text-slate-100">
                          {m.filename}
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          ✓
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1 font-mono">
                        {isNaN(m.sizeBytes) || m.sizeBytes === 0
                          ? '크기 확인 중...'
                          : `${(m.sizeBytes / (1024 * 1024 * 1024)).toFixed(
                              2
                            )} GB`}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-60 transition-all"
                        onClick={async () => {
                          setStarting(m.filename);
                          try {
                            await aiLlamaStartServer({
                              model: m.filename,
                              port: 11435,
                              ctx: 8192,
                              ngl: 33,
                              threads: 6,
                            });
                            await handleCheck();
                          } catch (e) {
                            toast.error(
                              `서버 시작 실패: ${
                                e instanceof Error ? e.message : String(e)
                              }`
                            );
                          } finally {
                            setStarting(null);
                          }
                        }}
                        disabled={starting === m.filename || running}
                      >
                        {starting === m.filename
                          ? '시작 중...'
                          : running
                            ? '실행 중'
                            : '서버 시작'}
                      </button>
                      <button
                        className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-medium text-red-300 hover:bg-red-500/20 transition-all"
                        onClick={async () => {
                          // TODO: Add confirmation modal for better UX
                          try {
                            await aiModelDelete(m.filename);
                            await refreshInstalled();
                            toast.success(
                              `${m.filename}이(가) 삭제되었습니다.`
                            );
                          } catch (e) {
                            toast.error(
                              `삭제 실패: ${
                                e instanceof Error ? e.message : String(e)
                              }`
                            );
                          }
                        }}
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 flex items-center justify-between p-3 rounded-lg bg-black/10 border border-white/5">
            <div className="text-[11px] text-slate-500">
              <span className="text-slate-400">저장 위치:</span>{' '}
              {modelsDir || '확인 중...'}
            </div>
            <button
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/10 transition-all"
              onClick={async () => {
                try {
                  await openModelsFolder();
                } catch (_e) {
                  // Ignore folder open errors
                }
              }}
            >
              📁 폴더 열기
            </button>
          </div>
        </section>
        <section className="mt-8 mb-6">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-100">테스트</h3>
            <p className="text-xs text-slate-400 mt-1">
              AI 요약 기능을 테스트해보세요
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 backdrop-blur p-4">
            <textarea
              value={testNote}
              onChange={(e) => setTestNote(e.target.value)}
              className="w-full h-28 resize-none rounded-lg border border-white/10 bg-black/30 p-3 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
              placeholder="테스트할 텍스트를 입력하세요..."
            />
            <div className="mt-3 flex items-center gap-3">
              <button
                className={`rounded-lg px-4 py-2 text-xs font-medium transition-all ${
                  running && !summarizing
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30'
                    : summarizing
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse'
                      : 'bg-white/5 text-slate-400 border border-white/10 cursor-not-allowed'
                }`}
                disabled={!running || summarizing}
                onClick={async () => {
                  try {
                    setSummarizing(true);
                    setTestResult('요청 전송 중...');
                    await aiSummarizeV1({
                      port: 11435,
                      note: testNote,
                    });
                    // 결과는 이벤트로 받음
                  } catch (e) {
                    setTestResult(`오류: ${String(e)}`);
                    setSummarizing(false);
                  }
                }}
              >
                {summarizing
                  ? 'AI 분석 중...'
                  : running
                    ? '요약 실행'
                    : '서버 대기 중'}
              </button>
              {!running && (
                <span className="text-[11px] text-amber-400/70">
                  ⚠️ 먼저 모델 서버를 시작하세요
                </span>
              )}
              {running && (
                <span className="text-[11px] text-emerald-400">
                  ✓ 서버 실행 중
                </span>
              )}
            </div>
            {testResult && (
              <div className="mt-3 pt-3 border-t border-white/5">
                <div className="text-xs text-slate-400 mb-2 font-medium">
                  정돈된 일지:
                </div>
                <div className="max-h-96 overflow-auto rounded-lg bg-black/40 p-4 text-xs leading-relaxed text-slate-200 border border-white/5">
                  <pre className="whitespace-pre-wrap font-sans">
                    {testResult}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default function ModelsPanel({ onClose }: Props) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative max-h-[80vh] w-[860px] overflow-hidden rounded-2xl border border-white/10 bg-[#0d1016]/95 p-0 shadow-xl">
        <header className="flex items-center justify-between border-b border-white/10 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-100">Models</h2>
          <button
            onClick={onClose}
            className="rounded-md border border-white/10 px-2 py-1 text-xs text-slate-300 hover:bg-white/5"
          >
            닫기
          </button>
        </header>
        <ModelsContent />
      </div>
    </div>
  );
}
