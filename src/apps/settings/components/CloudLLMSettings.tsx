import {
  Cloud,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  ExternalLink,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

import type { CloudProvider } from '@/types/cloud-llm';

import { useCloudLLM } from '@/hooks';

interface CloudLLMSettingsProps {
  isDarkMode?: boolean;
}

export const CloudLLMSettings: React.FC<CloudLLMSettingsProps> = ({
  isDarkMode = false,
}) => {
  const {
    loading,
    testApiKey,
    setApiKey: saveApiKey,
    hasApiKey: checkApiKey,
    deleteApiKey,
  } = useCloudLLM();

  // Provider state
  const [activeProvider, setActiveProvider] = useState<CloudProvider>('openai');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Load saved state and initialize provider
  useEffect(() => {
    const checkSavedKey = async () => {
      const hasKey = await checkApiKey(activeProvider);
      setConfigured(hasKey);

      // Auto-initialize provider if API key exists
      if (hasKey) {
        try {
          const { CloudLLMClient } = await import('@/lib/cloud-llm');
          await CloudLLMClient.initializeProvider(activeProvider);
        } catch (error) {
          if (import.meta.env.DEV) {
            console.error(
              `[Cloud LLM] Failed to initialize ${activeProvider}:`,
              error
            );
          }
        }
      }
    };
    void checkSavedKey();
  }, [activeProvider, checkApiKey]);

  const handleTest = () => {
    void (async () => {
      if (!apiKey) {
        setTestResult({ success: false, message: 'API 키를 입력하세요' });
        return;
      }

      setTesting(true);
      setTestResult(null);

      try {
        const isValid = await testApiKey(activeProvider, apiKey);
        setTestResult({
          success: isValid,
          message: isValid
            ? '연결 성공! API 키가 유효합니다'
            : 'API 키가 유효하지 않습니다',
        });
      } catch (error) {
        setTestResult({
          success: false,
          message: `연결 실패: ${error}`,
        });
      } finally {
        setTesting(false);
      }
    })();
  };

  const handleSave = () => {
    void (async () => {
      if (!apiKey) return;

      const success = await saveApiKey(activeProvider, apiKey);
      if (success) {
        setConfigured(true);
        setApiKey(''); // Clear input for security
        setShowApiKey(false);
        setTestResult(null);
      }
    })();
  };

  const handleDelete = () => {
    void (async () => {
      // TODO: Add confirmation modal for better UX
      await deleteApiKey(activeProvider);
      setConfigured(false);
      setApiKey('');
      setTestResult(null);
      toast.success('API 키가 삭제되었습니다.');
    })();
  };

  const providerInfo = {
    openai: {
      name: 'OpenAI',
      description: 'GPT-4o, GPT-4 Turbo, GPT-3.5 등',
      setupUrl: 'https://platform.openai.com/api-keys',
      models: ['GPT-4o', 'GPT-4o Mini', 'GPT-4 Turbo', 'GPT-3.5 Turbo'],
    },
    gemini: {
      name: 'Google Gemini',
      description: 'Gemini Pro, Gemini 1.5 Pro/Flash',
      setupUrl: 'https://aistudio.google.com/app/apikey',
      models: ['Gemini Pro', 'Gemini 1.5 Pro', 'Gemini 1.5 Flash'],
    },
  };

  const currentProvider = providerInfo[activeProvider];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3
          className={`text-[13px] font-medium mb-2 ${
            isDarkMode ? 'text-slate-300' : 'text-slate-700'
          }`}
        >
          클라우드 LLM 서비스
        </h3>
        <p
          className={`text-[12px] ${
            isDarkMode ? 'text-slate-500' : 'text-slate-500'
          }`}
        >
          OpenAI, Claude, Gemini 등 클라우드 LLM 서비스를 연결하여 더 강력한 AI
          기능을 사용할 수 있습니다.
        </p>
      </div>

      {/* Provider Selection */}
      <div>
        <h4
          className={`text-[11px] font-semibold uppercase tracking-[0.2em] mb-3 ${
            isDarkMode ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          Provider 선택
        </h4>
        {/* GPT + Gemini */}
        <div className="grid grid-cols-2 gap-3">
          {(['openai', 'gemini'] as CloudProvider[]).map((provider) => (
            <button
              key={provider}
              onClick={() => {
                setActiveProvider(provider);
                setApiKey('');
                setTestResult(null);
              }}
              className={`relative p-4 rounded-xl border text-left transition ${
                activeProvider === provider
                  ? isDarkMode
                    ? 'bg-blue-500/20 border-blue-500/50'
                    : 'bg-blue-50 border-blue-200'
                  : isDarkMode
                    ? 'bg-white/5 border-white/10 hover:bg-white/10'
                    : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div
                className={`text-[13px] font-medium mb-1 ${
                  activeProvider === provider
                    ? isDarkMode
                      ? 'text-blue-300'
                      : 'text-blue-700'
                    : isDarkMode
                      ? 'text-slate-300'
                      : 'text-slate-700'
                }`}
              >
                {providerInfo[provider].name}
              </div>
              <div
                className={`text-[10px] ${
                  isDarkMode ? 'text-slate-500' : 'text-slate-500'
                }`}
              >
                사용 가능
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Provider Details */}
      <div
        className={`rounded-xl border p-5 ${
          isDarkMode
            ? 'bg-white/5 border-white/10'
            : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h4
              className={`text-[14px] font-semibold mb-1 ${
                isDarkMode ? 'text-slate-200' : 'text-slate-900'
              }`}
            >
              {currentProvider.name}
            </h4>
            <p
              className={`text-[12px] ${
                isDarkMode ? 'text-slate-400' : 'text-slate-600'
              }`}
            >
              {currentProvider.description}
            </p>
          </div>
          {configured && (
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${
                isDarkMode
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-green-50 text-green-700'
              }`}
            >
              <Check className="h-3 w-3" />
              연결됨
            </div>
          )}
        </div>

        {/* Supported Models */}
        <div className="mb-5">
          <div
            className={`text-[11px] font-medium mb-2 ${
              isDarkMode ? 'text-slate-400' : 'text-slate-600'
            }`}
          >
            지원 모델
          </div>
          <div className="flex flex-wrap gap-1.5">
            {currentProvider.models.map((model) => (
              <span
                key={model}
                className={`px-2 py-0.5 rounded text-[10px] ${
                  isDarkMode
                    ? 'bg-white/10 text-slate-400'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {model}
              </span>
            ))}
          </div>
        </div>

        {/* API Key Setup or Status */}
        {configured ? (
          <div className="space-y-3">
            <div
              className={`flex items-center gap-2 p-3 rounded-lg ${
                isDarkMode ? 'bg-green-500/10' : 'bg-green-50'
              }`}
            >
              <Check
                className={`h-4 w-4 ${
                  isDarkMode ? 'text-green-400' : 'text-green-600'
                }`}
              />
              <span
                className={`text-[12px] ${
                  isDarkMode ? 'text-green-300' : 'text-green-700'
                }`}
              >
                API 키가 안전하게 저장되었습니다
              </span>
            </div>
            <button
              onClick={handleDelete}
              disabled={loading}
              className={`w-full px-4 py-2 rounded-lg text-[13px] font-medium transition ${
                isDarkMode
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                  : 'bg-red-50 text-red-600 hover:bg-red-100'
              }`}
            >
              API 키 삭제
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Setup Instructions */}
            <div
              className={`p-3 rounded-lg border ${
                isDarkMode
                  ? 'bg-blue-500/10 border-blue-500/30'
                  : 'bg-blue-50 border-blue-200'
              }`}
            >
              <div className="flex items-start gap-2">
                <Cloud
                  className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                    isDarkMode ? 'text-blue-400' : 'text-blue-600'
                  }`}
                />
                <div>
                  <p
                    className={`text-[12px] font-medium mb-1 ${
                      isDarkMode ? 'text-blue-300' : 'text-blue-700'
                    }`}
                  >
                    API 키 발급 방법
                  </p>
                  <ol
                    className={`text-[11px] space-y-0.5 list-decimal list-inside ${
                      isDarkMode ? 'text-blue-400' : 'text-blue-600'
                    }`}
                  >
                    <li>
                      아래 버튼을 클릭하여 {currentProvider.name} 플랫폼 접속
                    </li>
                    <li>API 키 생성 (무료 계정으로 시작 가능)</li>
                    <li>생성된 API 키를 복사하여 아래에 입력</li>
                  </ol>
                  <a
                    href={currentProvider.setupUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1 mt-2 text-[11px] font-medium hover:underline ${
                      isDarkMode ? 'text-blue-400' : 'text-blue-600'
                    }`}
                  >
                    {currentProvider.name} API 키 발급하기
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* API Key Input */}
            <div>
              <label
                className={`block text-[12px] font-medium mb-2 ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                API 키
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-proj-..."
                  className={`w-full px-3 py-2 pr-10 rounded-lg border text-[13px] font-mono ${
                    isDarkMode
                      ? 'bg-white/5 border-white/10 text-slate-200 placeholder-slate-600'
                      : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded ${
                    isDarkMode
                      ? 'text-slate-500 hover:text-slate-300'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Test Result */}
            {testResult && (
              <div
                className={`flex items-start gap-2 p-3 rounded-lg border ${
                  testResult.success
                    ? isDarkMode
                      ? 'bg-green-500/10 border-green-500/30'
                      : 'bg-green-50 border-green-200'
                    : isDarkMode
                      ? 'bg-red-500/10 border-red-500/30'
                      : 'bg-red-50 border-red-200'
                }`}
              >
                {testResult.success ? (
                  <Check
                    className={`h-4 w-4 mt-0.5 ${
                      isDarkMode ? 'text-green-400' : 'text-green-600'
                    }`}
                  />
                ) : (
                  <AlertCircle
                    className={`h-4 w-4 mt-0.5 ${
                      isDarkMode ? 'text-red-400' : 'text-red-600'
                    }`}
                  />
                )}
                <span
                  className={`text-[12px] ${
                    testResult.success
                      ? isDarkMode
                        ? 'text-green-300'
                        : 'text-green-700'
                      : isDarkMode
                        ? 'text-red-300'
                        : 'text-red-700'
                  }`}
                >
                  {testResult.message}
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleTest}
                disabled={!apiKey || testing || loading}
                className={`flex-1 px-4 py-2 rounded-lg text-[13px] font-medium transition ${
                  isDarkMode
                    ? 'bg-white/10 text-slate-300 hover:bg-white/15 disabled:bg-white/5 disabled:text-slate-600'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-400'
                }`}
              >
                {testing ? '테스트 중...' : '연결 테스트'}
              </button>
              <button
                onClick={handleSave}
                disabled={!apiKey || loading}
                className={`flex-1 px-4 py-2 rounded-lg text-[13px] font-medium transition ${
                  isDarkMode
                    ? 'bg-blue-500 text-white hover:bg-blue-600 disabled:bg-blue-500/50 disabled:text-white/50'
                    : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300 disabled:text-white/70'
                }`}
              >
                저장
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div
        className={`rounded-lg p-4 border ${
          isDarkMode
            ? 'bg-slate-800/50 border-white/10'
            : 'bg-slate-50 border-slate-200'
        }`}
      >
        <div
          className={`text-[11px] ${
            isDarkMode ? 'text-slate-400' : 'text-slate-600'
          }`}
        >
          <p className="font-medium mb-1">보안 안내</p>
          <ul className="space-y-0.5 list-disc list-inside">
            <li>API 키는 macOS Keychain에 암호화되어 안전하게 저장됩니다</li>
            <li>API 키는 절대 서버로 전송되지 않으며, 기기에만 저장됩니다</li>
            <li>API 사용 비용은 해당 provider에 직접 청구됩니다</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
