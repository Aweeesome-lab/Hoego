import { dialog } from '@tauri-apps/api';
import { invoke } from '@tauri-apps/api/tauri';
import { FolderOpen, Keyboard } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import type { AppSettings } from '@/types/tauri-commands';

interface GeneralSettingsProps {
  isDarkMode: boolean;
}

export function GeneralSettings({ isDarkMode }: GeneralSettingsProps) {
  const [settings, setSettings] = useState<AppSettings>({
    quickNoteShortcut: 'CommandOrControl+J',
    documentsPath: '',
  });
  const [isRecording, setIsRecording] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [recordingKeys, setRecordingKeys] = useState<string[]>([]);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // 설정 로드
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const appSettings = await invoke<AppSettings>('get_app_settings');
        setSettings(appSettings);
      } catch (error) {
        console.error('설정 로드 실패:', error);
        showMessage('error', '설정을 불러오는데 실패했습니다');
      }
    };

    void loadSettings();
  }, []);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleShortcutRecord = () => {
    setIsRecording(true);
    setRecordingKeys([]);

    let timeoutId: ReturnType<typeof setTimeout>;
    let keydownListenerRef: ((e: KeyboardEvent) => void) | null = null;
    let keyupListenerRef: ((e: KeyboardEvent) => void) | null = null;

    const cleanup = () => {
      setIsRecording(false);
      setRecordingKeys([]);
      if (timeoutId) clearTimeout(timeoutId);
      if (keydownListenerRef) {
        document.removeEventListener('keydown', keydownListenerRef);
        keydownListenerRef = null;
      }
      if (keyupListenerRef) {
        document.removeEventListener('keyup', keyupListenerRef);
        keyupListenerRef = null;
      }
    };

    let lastCombination: {
      modifiers: string[];
      key: string;
      display: string[];
    } | null = null;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // ESC로 취소
      if (e.key === 'Escape') {
        cleanup();
        showMessage('error', '단축키 녹화가 취소되었습니다');
        return;
      }

      // 수정키만 눌렀을 때는 실시간으로 표시만
      if (
        e.key === 'Control' ||
        e.key === 'Meta' ||
        e.key === 'Alt' ||
        e.key === 'Shift'
      ) {
        const keys: string[] = [];
        const modifiers: string[] = [];

        // Cmd와 Ctrl을 개별적으로 처리
        if (e.metaKey) {
          keys.push('Cmd');
          modifiers.push('Command');
        }
        if (e.ctrlKey) {
          keys.push('Ctrl');
          modifiers.push('Control');
        }
        if (e.altKey) {
          keys.push('Alt');
          modifiers.push('Alt');
        }
        if (e.shiftKey) {
          keys.push('Shift');
          modifiers.push('Shift');
        }

        setRecordingKeys(keys);

        // 수정키 조합이 2개 이상이면 저장 가능
        lastCombination =
          keys.length >= 2
            ? {
                modifiers,
                key: '',
                display: keys,
              }
            : null;

        return;
      }

      const modifiers: string[] = [];

      // Cmd와 Ctrl을 개별적으로 처리 (동시 입력 지원)
      if (e.metaKey) {
        modifiers.push('Command');
      }
      if (e.ctrlKey) {
        modifiers.push('Control');
      }
      if (e.altKey) {
        modifiers.push('Alt');
      }
      if (e.shiftKey) {
        modifiers.push('Shift');
      }

      // 수정키가 없으면 무시 (최소 1개의 수정키 필요)
      if (modifiers.length === 0) {
        showMessage(
          'error',
          '최소 1개의 수정키(Cmd/Ctrl, Alt, Shift)가 필요합니다'
        );
        cleanup();
        return;
      }

      // 키 코드를 Tauri 형식으로 변환
      let key: string;

      // 특수 키 처리
      const specialKeys: Record<string, string> = {
        ' ': 'Space',
        ArrowUp: 'Up',
        ArrowDown: 'Down',
        ArrowLeft: 'Left',
        ArrowRight: 'Right',
        Enter: 'Return',
        Backspace: 'Backspace',
        Delete: 'Delete',
        Tab: 'Tab',
        Insert: 'Insert',
        Home: 'Home',
        End: 'End',
        PageUp: 'PageUp',
        PageDown: 'PageDown',
      };

      let displayKey: string;
      const specialKey = specialKeys[e.key];
      if (specialKey) {
        key = specialKey;
        displayKey = specialKey;
      } else if (e.key.length === 1) {
        // 일반 문자는 대문자로
        key = e.key.toUpperCase();
        displayKey = e.key.toUpperCase();
      } else if (e.key.startsWith('F') && e.key.length <= 3) {
        // F1-F12
        key = e.key;
        displayKey = e.key;
      } else {
        showMessage('error', '지원하지 않는 키입니다');
        cleanup();
        return;
      }

      // 실시간으로 키 조합 표시
      const displayKeys = [];
      if (e.metaKey) displayKeys.push('Cmd');
      if (e.ctrlKey) displayKeys.push('Ctrl');
      if (e.altKey) displayKeys.push('Alt');
      if (e.shiftKey) displayKeys.push('Shift');
      displayKeys.push(displayKey);
      setRecordingKeys(displayKeys);

      // 마지막 조합 저장 (keyup에서 사용)
      lastCombination = { modifiers, key, display: displayKeys };
    };

    const handleKeyUp = async (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // 수정키를 뗐을 때만 확정 (일반 키는 무시)
      if (
        e.key !== 'Control' &&
        e.key !== 'Meta' &&
        e.key !== 'Alt' &&
        e.key !== 'Shift'
      ) {
        return;
      }

      // 저장된 조합이 있으면 확정 및 즉시 저장
      if (lastCombination) {
        const shortcut = lastCombination.key
          ? [...lastCombination.modifiers, lastCombination.key].join('+')
          : lastCombination.modifiers.join('+');

        cleanup();
        setIsSaving(true);

        // 타임아웃 설정 (10초)
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('저장 시간 초과')), 10000);
        });

        try {
          await Promise.race([
            invoke('update_quick_note_shortcut', {
              shortcut,
            }),
            timeoutPromise,
          ]);
          setSettings({ ...settings, quickNoteShortcut: shortcut });
          showMessage(
            'success',
            `단축키가 ${shortcut}로 저장 및 적용되었습니다`
          );
        } catch (error) {
          console.error('단축키 저장 실패:', error);
          const errorMessage =
            error instanceof Error ? error.message : '알 수 없는 오류';

          if (errorMessage.includes('시간 초과')) {
            showMessage(
              'error',
              '저장 시간이 초과되었습니다. 앱을 재시작하고 다시 시도해주세요.'
            );
          } else if (
            errorMessage.includes('등록할 수 없습니다') ||
            errorMessage.includes('이미') ||
            errorMessage.includes('사용 중')
          ) {
            showMessage(
              'error',
              `${shortcut}은(는) 이미 사용 중입니다. 다른 단축키를 시도해보세요.`
            );
          } else {
            showMessage('error', `단축키 저장 실패: ${errorMessage}`);
          }
        } finally {
          setIsSaving(false);
        }
      }
    };

    keydownListenerRef = handleKeyDown;
    keyupListenerRef = handleKeyUp;
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    // 10초 후 자동 취소
    timeoutId = setTimeout(() => {
      cleanup();
      showMessage('error', '시간 초과로 취소되었습니다');
    }, 10000);
  };

  const handleSelectDirectory = async () => {
    try {
      const selected = await dialog.open({
        directory: true,
        multiple: false,
        defaultPath: settings.documentsPath || undefined,
        title: '문서 저장 위치 선택',
      });

      if (selected && typeof selected === 'string') {
        setSettings({ ...settings, documentsPath: selected });
        showMessage(
          'success',
          '폴더가 선택되었습니다. 저장 버튼을 눌러주세요.'
        );
      }
    } catch (error) {
      console.error('디렉토리 선택 실패:', error);
      const errorMessage =
        error instanceof Error ? error.message : '알 수 없는 오류';
      showMessage('error', `디렉토리 선택 실패: ${errorMessage}`);
    }
  };

  const handleSavePath = async () => {
    setIsSaving(true);
    try {
      await invoke('update_documents_path', {
        path: settings.documentsPath,
      });
      showMessage('success', '저장 위치가 변경되었습니다');
    } catch (error) {
      console.error('저장 위치 변경 실패:', error);
      showMessage('error', '저장 위치 변경에 실패했습니다');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (
      !confirm('모든 설정을 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')
    ) {
      return;
    }

    setIsSaving(true);
    try {
      const defaultSettings = await invoke<AppSettings>('reset_app_settings');
      setSettings(defaultSettings);
      showMessage('success', '설정이 초기화되었습니다');
    } catch (error) {
      console.error('설정 초기화 실패:', error);
      showMessage('error', '설정 초기화에 실패했습니다');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 알림 메시지 */}
      {message && (
        <div
          className={`rounded-lg border p-3 text-[12px] ${
            message.type === 'success'
              ? isDarkMode
                ? 'bg-green-500/10 border-green-500/30 text-green-400'
                : 'bg-green-50 border-green-200 text-green-700'
              : isDarkMode
                ? 'bg-red-500/10 border-red-500/30 text-red-400'
                : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* 빠른 메모 단축키 설정 */}
      <div
        className={`rounded-xl border p-6 ${
          isDarkMode
            ? 'bg-white/5 border-white/10'
            : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-start gap-3 mb-4">
          <Keyboard
            className={`h-5 w-5 mt-0.5 ${
              isDarkMode ? 'text-blue-400' : 'text-blue-600'
            }`}
          />
          <div className="flex-1">
            <h3
              className={`text-[14px] font-semibold mb-1 ${
                isDarkMode ? 'text-slate-200' : 'text-slate-900'
              }`}
            >
              빠른 메모 단축키
            </h3>
            <p
              className={`text-[12px] ${
                isDarkMode ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              어디서든 빠르게 메모를 작성할 수 있는 전역 단축키를 설정합니다
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {/* 실시간 키 입력 표시 */}
          {isRecording && recordingKeys.length > 0 && (
            <div
              className={`rounded-lg border p-4 ${
                isDarkMode
                  ? 'bg-blue-500/10 border-blue-500/30'
                  : 'bg-blue-50 border-blue-200'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                {recordingKeys.map((key, index) => (
                  <React.Fragment key={index}>
                    <kbd
                      className={`px-3 py-2 text-[14px] font-semibold rounded-md shadow-sm ${
                        isDarkMode
                          ? 'bg-slate-800 text-blue-400 border border-blue-500/30'
                          : 'bg-white text-blue-600 border border-blue-300'
                      }`}
                    >
                      {key}
                    </kbd>
                    {index < recordingKeys.length - 1 && (
                      <span
                        className={`text-[14px] font-bold ${
                          isDarkMode ? 'text-slate-400' : 'text-slate-500'
                        }`}
                      >
                        +
                      </span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={settings.quickNoteShortcut}
              readOnly
              className={`flex-1 rounded-lg border px-3 py-2 text-[13px] font-mono ${
                isDarkMode
                  ? 'bg-slate-800 border-white/10 text-slate-200'
                  : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            />
            <button
              onClick={handleShortcutRecord}
              disabled={isRecording || isSaving}
              className={`px-4 py-2 rounded-lg text-[12px] font-medium transition-all ${
                isRecording
                  ? isDarkMode
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'bg-red-50 text-red-600 border border-red-200'
                  : isDarkMode
                    ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30'
                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isRecording ? '녹화 중...' : isSaving ? '저장 중...' : '변경'}
            </button>
          </div>
          {isRecording && (
            <div
              className={`rounded-lg border p-3 ${
                isDarkMode
                  ? 'bg-slate-800/50 border-white/10'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div
                className={`text-[11px] space-y-1 ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                <p className="font-medium">
                  ⌨️ 단축키 조합을 누른 후 키를 떼면 자동 저장 및 적용됩니다
                </p>
                <p className="text-[10px]">
                  수정키 조합: Cmd+Ctrl, Cmd+Shift, Cmd+Option, Ctrl+Alt
                </p>
                <p className="text-[10px]">
                  키 조합: Cmd+M, Cmd+Ctrl+Space, Shift+Alt+K
                </p>
                <p className="text-[10px]">
                  <kbd className="px-1 py-0.5 bg-slate-700 text-slate-200 rounded text-[10px]">
                    ESC
                  </kbd>{' '}
                  키로 취소
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 문서 저장 위치 설정 */}
      <div
        className={`rounded-xl border p-6 ${
          isDarkMode
            ? 'bg-white/5 border-white/10'
            : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-start gap-3 mb-4">
          <FolderOpen
            className={`h-5 w-5 mt-0.5 ${
              isDarkMode ? 'text-blue-400' : 'text-blue-600'
            }`}
          />
          <div className="flex-1">
            <h3
              className={`text-[14px] font-semibold mb-1 ${
                isDarkMode ? 'text-slate-200' : 'text-slate-900'
              }`}
            >
              문서 저장 위치
            </h3>
            <p
              className={`text-[12px] ${
                isDarkMode ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              메모와 회고 파일이 저장될 폴더를 지정합니다
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={settings.documentsPath}
              readOnly
              className={`flex-1 rounded-lg border px-3 py-2 text-[13px] ${
                isDarkMode
                  ? 'bg-slate-800 border-white/10 text-slate-200'
                  : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            />
            <button
              onClick={handleSelectDirectory}
              disabled={isSaving}
              className={`px-4 py-2 rounded-lg text-[12px] font-medium transition-all ${
                isDarkMode
                  ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30'
                  : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              변경
            </button>
            <button
              onClick={handleSavePath}
              disabled={isSaving}
              className={`px-4 py-2 rounded-lg text-[12px] font-medium transition-all ${
                isDarkMode
                  ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30'
                  : 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-200'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              저장
            </button>
          </div>
        </div>
      </div>

      {/* 설정 초기화 */}
      <div
        className={`rounded-xl border p-6 ${
          isDarkMode
            ? 'bg-white/5 border-white/10'
            : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3
              className={`text-[14px] font-semibold mb-1 ${
                isDarkMode ? 'text-slate-200' : 'text-slate-900'
              }`}
            >
              설정 초기화
            </h3>
            <p
              className={`text-[12px] ${
                isDarkMode ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              모든 설정을 기본값으로 되돌립니다
            </p>
          </div>
          <button
            onClick={handleReset}
            disabled={isSaving}
            className={`px-4 py-2 rounded-lg text-[12px] font-medium transition-all ${
              isDarkMode
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
                : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            초기화
          </button>
        </div>
      </div>
    </div>
  );
}
