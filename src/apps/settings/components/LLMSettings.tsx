import {
  Download,
  Trash2,
  Check,
  AlertCircle,
  HardDrive,
  Info,
  Loader2,
  Sparkles,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

import type { ModelInfo, LocalModel, DownloadProgress } from '@/lib/llm';

import { llmApi } from '@/lib/llm';

interface LLMSettingsProps {
  isDarkMode?: boolean;
}

// 고정 모델 ID - Gemma 3 4B QAT (Google Latest)
const FIXED_MODEL_ID = 'gemma-3-4b-qat';

export const LLMSettings: React.FC<LLMSettingsProps> = ({
  isDarkMode = false,
}) => {
  const [fixedModel, setFixedModel] = useState<ModelInfo | null>(null);
  const [localModel, setLocalModel] = useState<LocalModel | null>(null);
  const [downloadProgress, setDownloadProgress] =
    useState<DownloadProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [storageUsed, setStorageUsed] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadModel();

    // Set up event listeners for real-time download progress
    let unsubscribeProgress: (() => void) | null = null;
    let unsubscribeComplete: (() => void) | null = null;
    let unsubscribeError: (() => void) | null = null;

    const setupListeners = async () => {
      unsubscribeProgress = await llmApi.onDownloadProgress((progress) => {
        if (progress.model_id === FIXED_MODEL_ID) {
          setDownloadProgress(progress);
        }
      });

      unsubscribeComplete = await llmApi.onDownloadComplete((modelId) => {
        if (modelId === FIXED_MODEL_ID) {
          setDownloadProgress(null);
          void loadModel(); // Refresh model after download completes
        }
      });

      unsubscribeError = await llmApi.onDownloadError((error) => {
        console.error('Download error:', error);
        setError(`다운로드 실패: ${error}`);
        setDownloadProgress(null);
        void loadModel(); // Refresh to clear any stale state
      });
    };

    void setupListeners();

    return () => {
      if (unsubscribeProgress) unsubscribeProgress();
      if (unsubscribeComplete) unsubscribeComplete();
      if (unsubscribeError) unsubscribeError();
    };
  }, []);

  const loadModel = async () => {
    try {
      const [available, local, storage] = await Promise.all([
        llmApi.getAvailableModels(),
        llmApi.getLocalModels(),
        llmApi.getStorageUsage(),
      ]);

      // Find our fixed model
      const model = available.find((m) => m.id === FIXED_MODEL_ID);
      setFixedModel(model || null);

      // Check if it's downloaded
      const downloaded = local.find((m) => m.info.id === FIXED_MODEL_ID);
      setLocalModel(downloaded || null);

      setStorageUsed(storage);
      setError(null);
    } catch (err) {
      setError('모델 정보를 불러올 수 없습니다');
      console.error('Failed to load model:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!fixedModel) return;

    try {
      // Event listeners will handle progress updates
      await llmApi.downloadModel(fixedModel.id);
    } catch (err) {
      setError(`다운로드 실패: ${fixedModel.name}`);
      console.error('Download failed:', err);
    }
  };

  const handleDelete = async () => {
    try {
      await llmApi.deleteModel(FIXED_MODEL_ID);
      await loadModel();
    } catch (err) {
      setError('모델 삭제 실패');
      console.error('Delete failed:', err);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2
          className={`h-8 w-8 animate-spin ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}
        />
      </div>
    );
  }

  if (!fixedModel) {
    return (
      <div
        className={`p-6 rounded-xl border ${
          isDarkMode
            ? 'bg-red-500/10 border-red-500/20'
            : 'bg-red-50 border-red-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <AlertCircle
            className={`h-5 w-5 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}
          />
          <p
            className={`text-sm ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}
          >
            모델 정보를 찾을 수 없습니다
          </p>
        </div>
      </div>
    );
  }

  const isDownloading = downloadProgress && downloadProgress.status === 'downloading';

  return (
    <div className="space-y-6">
      {/* Model Status */}
      <div
        className={`p-5 rounded-xl border ${
          isDarkMode
            ? 'bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/30'
            : 'bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200'
        }`}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles
              className={`h-4 w-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}
            />
            <span
              className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${
                isDarkMode ? 'text-blue-400' : 'text-blue-600'
              }`}
            >
              로컬 AI 모델
            </span>
          </div>
          {localModel && (
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium ${
                isDarkMode
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-green-100 text-green-700'
              }`}
            >
              <Check className="h-3 w-3" />
              다운로드 완료
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <h3
              className={`text-[15px] font-semibold mb-1 ${
                isDarkMode ? 'text-slate-100' : 'text-slate-900'
              }`}
            >
              {fixedModel.name}
            </h3>
            <p
              className={`text-[12px] ${
                isDarkMode ? 'text-slate-400' : 'text-slate-600'
              }`}
            >
              {fixedModel.description}
            </p>
          </div>

          <div
            className={`flex items-center gap-4 text-[11px] ${
              isDarkMode ? 'text-slate-500' : 'text-slate-400'
            }`}
          >
            <span>크기: {formatBytes(fixedModel.size)}</span>
            <span>양자화: {fixedModel.quantization}</span>
            <span>
              최소 RAM:{' '}
              {formatBytes(fixedModel.requirements.min_ram * 1024 * 1024)}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            {localModel ? (
              <button
                onClick={handleDelete}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-medium transition ${
                  isDarkMode
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                    : 'bg-red-50 text-red-600 hover:bg-red-100'
                }`}
              >
                <Trash2 className="h-3.5 w-3.5" />
                모델 삭제
              </button>
            ) : isDownloading ? (
              <div className="flex items-center gap-2">
                <Loader2
                  className={`h-4 w-4 animate-spin ${
                    isDarkMode ? 'text-blue-400' : 'text-blue-500'
                  }`}
                />
                <span
                  className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}
                >
                  다운로드 중... {downloadProgress?.percentage.toFixed(0)}%
                </span>
              </div>
            ) : (
              <button
                onClick={handleDownload}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-medium transition ${
                  isDarkMode
                    ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                <Download className="h-3.5 w-3.5" />
                모델 다운로드
              </button>
            )}
          </div>

          {/* Download Progress */}
          {isDownloading && downloadProgress && (
            <div className="pt-2">
              <div
                className={`h-2 rounded-full overflow-hidden ${
                  isDarkMode ? 'bg-white/10' : 'bg-slate-200'
                }`}
              >
                <div
                  className={`h-full transition-all ${
                    isDarkMode ? 'bg-blue-400' : 'bg-blue-500'
                  }`}
                  style={{ width: `${downloadProgress.percentage}%` }}
                />
              </div>
              <div className="flex justify-between mt-1.5">
                <span
                  className={`text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}
                >
                  {formatBytes(downloadProgress.bytes_downloaded)} /{' '}
                  {formatBytes(downloadProgress.total_bytes)}
                </span>
                {downloadProgress.speed > 0 && (
                  <span
                    className={`text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}
                  >
                    {downloadProgress.speed.toFixed(2)} MB/s
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Local Model Info */}
          {localModel && (
            <div
              className={`p-3 rounded-lg border ${
                isDarkMode
                  ? 'bg-white/5 border-white/10'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div
                className={`text-[11px] ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                <div className="flex justify-between">
                  <span>디스크 사용량</span>
                  <span className="font-medium">
                    {formatBytes(localModel.size_on_disk)}
                  </span>
                </div>
                <div className="flex justify-between mt-1">
                  <span>다운로드 날짜</span>
                  <span className="font-medium">
                    {new Date(localModel.downloaded_at).toLocaleDateString(
                      'ko-KR'
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Storage Info */}
      <div
        className={`p-4 rounded-xl border ${
          isDarkMode
            ? 'bg-white/5 border-white/10'
            : 'bg-slate-50 border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <HardDrive
              className={`h-4 w-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}
            />
            <span
              className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${
                isDarkMode ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              저장 공간 사용량
            </span>
          </div>
          <span
            className={`text-sm font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}
          >
            {formatBytes(storageUsed)}
          </span>
        </div>
        <div
          className={`h-2 rounded-full overflow-hidden ${
            isDarkMode ? 'bg-white/10' : 'bg-slate-200'
          }`}
        >
          <div
            className={`h-full transition-all ${
              isDarkMode ? 'bg-blue-400' : 'bg-blue-500'
            }`}
            style={{
              width: `${Math.min((storageUsed / (10 * 1024 * 1024 * 1024)) * 100, 100)}%`,
            }}
          />
        </div>
        <p
          className={`mt-2 text-[11px] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}
        >
          10GB 중 {formatBytes(storageUsed)} 사용 중
        </p>
      </div>

      {/* Info Tips */}
      <div
        className={`p-4 rounded-xl border ${
          isDarkMode
            ? 'bg-blue-500/10 border-blue-500/20'
            : 'bg-blue-50 border-blue-200'
        }`}
      >
        <div className="flex items-start gap-3">
          <Info
            className={`h-4 w-4 mt-0.5 flex-shrink-0 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}
          />
          <div className="space-y-2">
            <p
              className={`text-xs font-medium ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}
            >
              Qwen 2.5 3B 모델 정보
            </p>
            <ul
              className={`text-[11px] space-y-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}
            >
              <li>• 한국어 요약 및 회고 작성에 최적화된 모델입니다</li>
              <li>• 완전 오프라인으로 작동하여 개인정보가 보호됩니다</li>
              <li>• 다운로드가 중단되어도 자동으로 이어받기됩니다</li>
              <li>• GPU가 있으면 더 빠른 속도로 작동합니다</li>
              <li>• 최소 4GB RAM 권장, 8GB 이상에서 최적 성능</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div
          className={`p-4 rounded-xl border ${
            isDarkMode
              ? 'bg-red-500/10 border-red-500/20'
              : 'bg-red-50 border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertCircle
              className={`h-4 w-4 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}
            />
            <p
              className={`text-xs ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}
            >
              {error}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
