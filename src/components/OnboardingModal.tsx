import { invoke } from '@tauri-apps/api/tauri';
import {
  Keyboard,
  Download,
  ChevronRight,
  Check,
  Loader2,
  Sparkles,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

import type { LocalModel, ModelInfo, DownloadProgress } from '@/lib/llm';
import type { AppSettings } from '@/types/tauri-commands';

import { llmApi } from '@/lib/llm';

const ONBOARDING_COMPLETE_KEY = 'hoego_onboarding_complete';
const FIXED_MODEL_ID = 'gemma-3-4b-qat';

interface OnboardingModalProps {
  isDarkMode: boolean;
  onComplete: () => void;
}

export function OnboardingModal({
  isDarkMode,
  onComplete,
}: OnboardingModalProps) {
  const [step, setStep] = useState(1);

  // Step 1: Shortcut
  const [shortcut, setShortcut] = useState('CommandOrControl+J');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingKeys, setRecordingKeys] = useState<string[]>([]);
  const [shortcutSaved, setShortcutSaved] = useState(false);

  // Step 2: Model
  const [model, setModel] = useState<ModelInfo | null>(null);
  const [localModel, setLocalModel] = useState<LocalModel | null>(null);
  const [downloadProgress, setDownloadProgress] =
    useState<DownloadProgress | null>(null);
  const [modelLoading, setModelLoading] = useState(true);

  // Load current shortcut
  useEffect(() => {
    const loadShortcut = async () => {
      try {
        const settings = await invoke<AppSettings>('get_app_settings');
        setShortcut(settings.quickNoteShortcut);
      } catch (e) {
        console.error('Failed to load shortcut:', e);
      }
    };
    void loadShortcut();
  }, []);

  // Load model info
  useEffect(() => {
    const loadModel = async () => {
      try {
        const [available, local] = await Promise.all([
          llmApi.getAvailableModels(),
          llmApi.getLocalModels(),
        ]);
        const m = available.find((x) => x.id === FIXED_MODEL_ID);
        setModel(m || null);
        const downloaded = local.find((x) => x.info.id === FIXED_MODEL_ID);
        setLocalModel(downloaded || null);
      } catch (e) {
        console.error('Failed to load model:', e);
      } finally {
        setModelLoading(false);
      }
    };
    void loadModel();

    // Event listeners for download
    let unsubProgress: (() => void) | null = null;
    let unsubComplete: (() => void) | null = null;

    const setup = async () => {
      unsubProgress = await llmApi.onDownloadProgress((p) => {
        if (p.model_id === FIXED_MODEL_ID) setDownloadProgress(p);
      });
      unsubComplete = await llmApi.onDownloadComplete((id) => {
        if (id === FIXED_MODEL_ID) {
          setDownloadProgress(null);
          void loadModel();
        }
      });
    };
    void setup();

    return () => {
      unsubProgress?.();
      unsubComplete?.();
    };
  }, []);

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
    onComplete();
  };

  const handleSkip = () => {
    handleComplete();
  };

  // Shortcut recording logic (simplified from GeneralSettings)
  const handleShortcutRecord = () => {
    setIsRecording(true);
    setRecordingKeys([]);

    let lastCombo: { modifiers: string[]; key: string } | null = null;
    // eslint-disable-next-line prefer-const
    let timeoutId: ReturnType<typeof setTimeout>;

    const cleanup = () => {
      setIsRecording(false);
      setRecordingKeys([]);
      clearTimeout(timeoutId);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      if (e.key === 'Escape') {
        cleanup();
        return;
      }

      const modKeys = ['Control', 'Meta', 'Alt', 'Shift'];
      if (modKeys.includes(e.key)) {
        const keys: string[] = [];
        const mods: string[] = [];
        if (e.metaKey) {
          keys.push('Cmd');
          mods.push('Command');
        }
        if (e.ctrlKey) {
          keys.push('Ctrl');
          mods.push('Control');
        }
        if (e.altKey) {
          keys.push('Alt');
          mods.push('Alt');
        }
        if (e.shiftKey) {
          keys.push('Shift');
          mods.push('Shift');
        }
        setRecordingKeys(keys);
        lastCombo = keys.length >= 1 ? { modifiers: mods, key: '' } : null;
        return;
      }

      const mods: string[] = [];
      if (e.metaKey) mods.push('Command');
      if (e.ctrlKey) mods.push('Control');
      if (e.altKey) mods.push('Alt');
      if (e.shiftKey) mods.push('Shift');

      if (mods.length === 0) {
        cleanup();
        return;
      }

      const key = e.key.length === 1 ? e.key.toUpperCase() : e.key;
      const display = [
        ...(e.metaKey ? ['Cmd'] : []),
        ...(e.ctrlKey ? ['Ctrl'] : []),
        ...(e.altKey ? ['Alt'] : []),
        ...(e.shiftKey ? ['Shift'] : []),
        key,
      ];
      setRecordingKeys(display);
      lastCombo = { modifiers: mods, key };
    };

    const handleKeyUp = async (e: KeyboardEvent) => {
      e.preventDefault();
      const modKeys = ['Control', 'Meta', 'Alt', 'Shift'];
      if (!modKeys.includes(e.key)) return;

      if (lastCombo && lastCombo.key) {
        const sc = [...lastCombo.modifiers, lastCombo.key].join('+');
        cleanup();
        try {
          await invoke('update_quick_note_shortcut', { shortcut: sc });
          setShortcut(sc);
          setShortcutSaved(true);
        } catch (err) {
          console.error('Shortcut save failed:', err);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', (e) => void handleKeyUp(e));
    timeoutId = setTimeout(cleanup, 10000);
  };

  const handleDownload = async () => {
    if (!model) return;
    try {
      await llmApi.downloadModel(model.id);
    } catch (e) {
      console.error('Download failed:', e);
    }
  };

  const isDownloading =
    downloadProgress && downloadProgress.status === 'downloading';
  const isModelReady = !!localModel;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className={`w-full max-w-md mx-4 rounded-2xl shadow-2xl overflow-hidden ${
          isDarkMode ? 'bg-[#0d1016]' : 'bg-white'
        }`}
      >
        {/* Header */}
        <div
          className={`px-6 py-5 border-b ${
            isDarkMode ? 'border-white/10' : 'border-slate-200'
          }`}
        >
          <h2
            className={`text-lg font-semibold ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}
          >
            HOEGO 시작하기
          </h2>
          <p
            className={`text-sm mt-1 ${
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            간단한 설정으로 더 나은 경험을 준비하세요
          </p>
        </div>

        {/* Progress */}
        <div className="px-6 pt-4">
          <div className="flex gap-2">
            {[1, 2].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  s <= step
                    ? isDarkMode
                      ? 'bg-matcha-400'
                      : 'bg-matcha'
                    : isDarkMode
                      ? 'bg-white/10'
                      : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2.5 rounded-xl ${
                    isDarkMode ? 'bg-matcha-400/20' : 'bg-matcha-50'
                  }`}
                >
                  <Keyboard
                    className={`h-5 w-5 ${
                      isDarkMode ? 'text-matcha-300' : 'text-matcha-500'
                    }`}
                  />
                </div>
                <div>
                  <h3
                    className={`font-medium ${
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    빠른 메모 단축키
                  </h3>
                  <p
                    className={`text-xs ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    어디서든 빠르게 메모를 작성하세요
                  </p>
                </div>
              </div>

              {/* Current shortcut */}
              <div
                className={`p-4 rounded-xl border ${
                  isDarkMode
                    ? 'bg-white/5 border-white/10'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm ${
                      isDarkMode ? 'text-slate-300' : 'text-slate-600'
                    }`}
                  >
                    현재 단축키
                  </span>
                  <div className="flex items-center gap-2">
                    {shortcutSaved && (
                      <Check className="h-4 w-4 text-green-500" />
                    )}
                    <kbd
                      className={`px-3 py-1.5 rounded-md text-sm font-mono ${
                        isDarkMode
                          ? 'bg-slate-800 text-matcha-300 border border-white/10'
                          : 'bg-white text-matcha-600 border border-slate-200'
                      }`}
                    >
                      {shortcut.replace('CommandOrControl', 'Cmd')}
                    </kbd>
                  </div>
                </div>

                {/* Recording display */}
                {isRecording && recordingKeys.length > 0 && (
                  <div className="mt-3 flex items-center justify-center gap-1">
                    {recordingKeys.map((k, i) => (
                      <React.Fragment key={i}>
                        <kbd
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            isDarkMode
                              ? 'bg-matcha-400/20 text-matcha-300'
                              : 'bg-matcha-100 text-matcha-700'
                          }`}
                        >
                          {k}
                        </kbd>
                        {i < recordingKeys.length - 1 && (
                          <span
                            className={
                              isDarkMode ? 'text-slate-500' : 'text-slate-400'
                            }
                          >
                            +
                          </span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                )}

                <button
                  onClick={handleShortcutRecord}
                  disabled={isRecording}
                  className={`mt-3 w-full py-2 rounded-lg text-sm font-medium transition ${
                    isRecording
                      ? isDarkMode
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-red-50 text-red-600'
                      : isDarkMode
                        ? 'bg-matcha-400/20 text-matcha-300 hover:bg-matcha-400/30'
                        : 'bg-matcha-50 text-matcha-600 hover:bg-matcha-100'
                  }`}
                >
                  {isRecording ? '키 입력 대기 중...' : '단축키 변경하기'}
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2.5 rounded-xl ${
                    isDarkMode ? 'bg-matcha-400/20' : 'bg-matcha-50'
                  }`}
                >
                  <Sparkles
                    className={`h-5 w-5 ${
                      isDarkMode ? 'text-matcha-300' : 'text-matcha-500'
                    }`}
                  />
                </div>
                <div>
                  <h3
                    className={`font-medium ${
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    로컬 AI 모델
                  </h3>
                  <p
                    className={`text-xs ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    오프라인에서도 AI 요약을 사용하세요
                  </p>
                </div>
              </div>

              {/* Model card */}
              <div
                className={`p-4 rounded-xl border ${
                  isDarkMode
                    ? 'bg-white/5 border-white/10'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                {modelLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2
                      className={`h-5 w-5 animate-spin ${
                        isDarkMode ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    />
                  </div>
                ) : model ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-sm font-medium ${
                          isDarkMode ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        {model.name}
                      </span>
                      {isModelReady && (
                        <span
                          className={`flex items-center gap-1 text-xs ${
                            isDarkMode ? 'text-green-400' : 'text-green-600'
                          }`}
                        >
                          <Check className="h-3.5 w-3.5" />
                          설치됨
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-xs ${
                        isDarkMode ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      {model.description}
                    </p>
                    <p
                      className={`text-xs ${
                        isDarkMode ? 'text-slate-500' : 'text-slate-400'
                      }`}
                    >
                      크기: {formatBytes(model.size)}
                    </p>

                    {/* Download progress */}
                    {isDownloading && downloadProgress && (
                      <div className="space-y-2">
                        <div
                          className={`h-2 rounded-full overflow-hidden ${
                            isDarkMode ? 'bg-white/10' : 'bg-slate-200'
                          }`}
                        >
                          <div
                            className={`h-full transition-all ${
                              isDarkMode ? 'bg-matcha-400' : 'bg-matcha'
                            }`}
                            style={{ width: `${downloadProgress.percentage}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs">
                          <span
                            className={
                              isDarkMode ? 'text-slate-400' : 'text-slate-500'
                            }
                          >
                            {downloadProgress.percentage.toFixed(0)}%
                          </span>
                          {downloadProgress.speed > 0 && (
                            <span
                              className={
                                isDarkMode ? 'text-slate-400' : 'text-slate-500'
                              }
                            >
                              {downloadProgress.speed.toFixed(1)} MB/s
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {!isModelReady && !isDownloading && (
                      <button
                        onClick={() => void handleDownload()}
                        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition ${
                          isDarkMode
                            ? 'bg-matcha-400/20 text-matcha-300 hover:bg-matcha-400/30'
                            : 'bg-matcha text-white hover:bg-matcha-dark'
                        }`}
                      >
                        <Download className="h-4 w-4" />
                        모델 다운로드
                      </button>
                    )}
                  </div>
                ) : (
                  <p
                    className={`text-sm text-center py-4 ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    모델 정보를 불러올 수 없습니다
                  </p>
                )}
              </div>

              <p
                className={`text-xs text-center ${
                  isDarkMode ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                나중에 설정에서 다운로드할 수 있습니다
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`px-6 py-4 border-t flex justify-between ${
            isDarkMode ? 'border-white/10' : 'border-slate-200'
          }`}
        >
          <button
            onClick={handleSkip}
            className={`px-4 py-2 text-sm rounded-lg transition ${
              isDarkMode
                ? 'text-slate-400 hover:text-slate-300'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            건너뛰기
          </button>

          {step === 1 ? (
            <button
              onClick={() => setStep(2)}
              className={`flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-medium transition ${
                isDarkMode
                  ? 'bg-matcha-400 text-white hover:bg-matcha-500'
                  : 'bg-matcha text-white hover:bg-matcha-dark'
              }`}
            >
              다음
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              className={`flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-medium transition ${
                isDarkMode
                  ? 'bg-matcha-400 text-white hover:bg-matcha-500'
                  : 'bg-matcha text-white hover:bg-matcha-dark'
              }`}
            >
              시작하기
              <Check className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_COMPLETE_KEY);
    if (!completed) {
      setShowOnboarding(true);
    }
  }, []);

  return {
    showOnboarding,
    completeOnboarding: () => setShowOnboarding(false),
  };
}
