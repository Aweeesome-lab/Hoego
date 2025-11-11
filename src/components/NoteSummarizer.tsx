import React, { useState, useEffect } from 'react';
import { llmApi, SummaryResult, LocalModel } from '../lib/llm';
import { Sparkles, Loader2, Copy, Check, Settings } from 'lucide-react';
import { invoke } from '@tauri-apps/api/tauri';

interface NoteSummarizerProps {
  content: string;
  onSummaryInsert?: (summary: string) => void;
  isDarkMode?: boolean;
}

export const NoteSummarizer: React.FC<NoteSummarizerProps> = ({
  content,
  onSummaryInsert,
  isDarkMode = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<SummaryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [hasModel, setHasModel] = useState(false);

  useEffect(() => {
    checkForModels();
    const interval = setInterval(checkForModels, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen) {
      checkForModels();
      // 모달이 열리면 자동으로 요약 시작
      if (hasModel && content.trim() && !summary && !loading) {
        handleSummarize();
      }
    }
  }, [isOpen, hasModel]);

  const checkForModels = async () => {
    try {
      const models = await llmApi.getLocalModels();
      setHasModel(models.length > 0);
    } catch (err) {
      console.error('Failed to check models:', err);
    }
  };

  const handleSummarize = async () => {
    if (!content.trim()) {
      setError('요약할 내용이 없습니다');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 간단한 설정으로 전체 내용 요약
      const result = await llmApi.summarizeNote({
        content,
        style: 'Bullet', // 기본값: 불릿 포인트
        max_length: 200, // 적당한 길이
      });

      setSummary(result);
    } catch (err) {
      // 더 구체적인 에러 메시지 처리
      const errorMessage = err instanceof Error ? err.message : '요약 생성 실패';

      // 모델이 없을 때의 에러 메시지 개선
      if (errorMessage.includes('No model loaded') || errorMessage.includes('model')) {
        setError('AI 모델을 먼저 다운로드해주세요');
        // 모델 상태 재확인
        checkForModels();
      } else if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
        setError('요약 생성 시간이 초과되었습니다. 다시 시도해주세요');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!summary) return;

    try {
      await navigator.clipboard.writeText(summary.summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError('클립보드 복사 실패');
    }
  };

  const handleInsert = () => {
    if (summary && onSummaryInsert) {
      onSummaryInsert(summary.summary);
      setIsOpen(false);
      setSummary(null); // 다음 번을 위해 초기화
    }
  };

  // 모달을 닫을 때 요약 결과 초기화
  const handleClose = () => {
    setIsOpen(false);
    setSummary(null);
    setError(null);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ${
          isDarkMode
            ? "border-white/10 text-slate-300 hover:bg-white/5 hover:text-white"
            : "border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        }`}
      >
        <Sparkles className="h-3.5 w-3.5" />
        <span>AI 요약</span>
      </button>

      {isOpen && (
        <>
          {/* 배경 오버레이 */}
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* 모달 - 중앙 배치 */}
          <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[420px] max-h-[80vh] flex flex-col rounded-xl shadow-2xl border ${
            isDarkMode
              ? "bg-[#1a1f2e] border-white/10"
              : "bg-white border-slate-200"
          }`}>
            {/* 헤더 */}
            <div className={`px-5 py-4 border-b flex items-center justify-between ${
              isDarkMode ? "border-white/10" : "border-slate-100"
            }`}>
              <h3 className={`text-[13px] font-semibold flex items-center gap-2 ${
                isDarkMode ? "text-slate-200" : "text-slate-800"
              }`}>
                <Sparkles className="h-4 w-4" />
                AI 요약
              </h3>
              <button
                onClick={handleClose}
                className={`text-[18px] leading-none px-1 hover:opacity-60 transition ${
                  isDarkMode ? "text-slate-400" : "text-slate-500"
                }`}
              >
                ×
              </button>
            </div>

            {/* 컨텐츠 */}
            <div className="flex-1 overflow-y-auto p-5">
              {!hasModel ? (
                // 모델 없을 때
                <div className="text-center py-8">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    isDarkMode ? "bg-yellow-500/10" : "bg-yellow-50"
                  }`}>
                    <Sparkles className={`h-6 w-6 ${
                      isDarkMode ? "text-yellow-400" : "text-yellow-600"
                    }`} />
                  </div>
                  <p className={`text-[13px] font-medium mb-2 ${
                    isDarkMode ? "text-slate-200" : "text-slate-700"
                  }`}>
                    AI 모델이 필요합니다
                  </p>
                  <p className={`text-xs mb-4 ${
                    isDarkMode ? "text-slate-400" : "text-slate-500"
                  }`}>
                    모델을 다운로드하여 요약 기능을 사용하세요
                  </p>
                  <button
                    onClick={async () => {
                      try {
                        await invoke('open_llm_settings');
                        handleClose();
                      } catch (err) {
                        console.error('Failed to open settings:', err);
                      }
                    }}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs font-medium transition ${
                      isDarkMode
                        ? "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                        : "bg-blue-500 text-white hover:bg-blue-600"
                    }`}
                  >
                    <Settings className="h-3.5 w-3.5" />
                    모델 다운로드
                  </button>
                </div>
              ) : loading ? (
                // 로딩 중
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className={`h-8 w-8 animate-spin mb-4 ${
                    isDarkMode ? "text-blue-400" : "text-blue-500"
                  }`} />
                  <p className={`text-[13px] ${
                    isDarkMode ? "text-slate-300" : "text-slate-600"
                  }`}>
                    요약을 생성하고 있습니다...
                  </p>
                </div>
              ) : error ? (
                // 에러
                <div className="text-center py-8">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    isDarkMode ? "bg-red-500/10" : "bg-red-50"
                  }`}>
                    <Sparkles className={`h-6 w-6 ${
                      isDarkMode ? "text-red-400" : "text-red-600"
                    }`} />
                  </div>
                  <p className={`text-[13px] font-medium mb-2 ${
                    isDarkMode ? "text-red-400" : "text-red-600"
                  }`}>
                    요약 생성 실패
                  </p>
                  <p className={`text-xs mb-4 ${
                    isDarkMode ? "text-slate-400" : "text-slate-500"
                  }`}>
                    {error}
                  </p>
                  <button
                    onClick={handleSummarize}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs font-medium transition ${
                      isDarkMode
                        ? "bg-white/10 text-slate-300 hover:bg-white/15"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    다시 시도
                  </button>
                </div>
              ) : summary ? (
                // 요약 결과
                <div>
                  <div className={`p-4 rounded-lg text-[13px] leading-relaxed mb-4 ${
                    isDarkMode
                      ? "bg-white/5 text-slate-200"
                      : "bg-gray-50 text-slate-700"
                  }`}>
                    {summary.summary}
                  </div>

                  {/* 액션 버튼들 */}
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopy}
                      className={`flex-1 py-2 rounded-md text-xs font-medium transition flex items-center justify-center gap-1.5 ${
                        isDarkMode
                          ? "bg-white/10 text-slate-300 hover:bg-white/15"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          복사됨
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          복사
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleInsert}
                      className={`flex-1 py-2 rounded-md text-xs font-medium transition ${
                        isDarkMode
                          ? "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                          : "bg-blue-500 text-white hover:bg-blue-600"
                      }`}
                    >
                      노트에 추가
                    </button>

                    <button
                      onClick={handleSummarize}
                      className={`px-4 py-2 rounded-md text-xs font-medium transition ${
                        isDarkMode
                          ? "bg-white/5 text-slate-400 hover:bg-white/10"
                          : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                      }`}
                      title="다시 생성"
                    >
                      ↻
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </>
      )}
    </>
  );
};