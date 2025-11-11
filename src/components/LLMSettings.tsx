import React, { useState, useEffect } from 'react';
import { llmApi, ModelInfo, LocalModel, DownloadProgress } from '../lib/llm';
import { Download, Trash2, Check, AlertCircle, HardDrive, Cpu, Info, Loader2 } from 'lucide-react';

interface LLMSettingsProps {
  isDarkMode?: boolean;
}

export const LLMSettings: React.FC<LLMSettingsProps> = ({ isDarkMode = false }) => {
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);
  const [localModels, setLocalModels] = useState<LocalModel[]>([]);
  const [downloadProgress, setDownloadProgress] = useState<Map<string, DownloadProgress>>(new Map());
  const [loading, setLoading] = useState(true);
  const [storageUsed, setStorageUsed] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [defaultModelId, setDefaultModelId] = useState<string | null>(null);

  useEffect(() => {
    loadModels();

    // Set up event listeners for real-time download progress
    let unsubscribeProgress: (() => void) | null = null;
    let unsubscribeComplete: (() => void) | null = null;
    let unsubscribeError: (() => void) | null = null;

    const setupListeners = async () => {
      unsubscribeProgress = await llmApi.onDownloadProgress((progress) => {
        setDownloadProgress(prev => {
          const next = new Map(prev);
          next.set(progress.model_id, progress);
          return next;
        });
      });

      unsubscribeComplete = await llmApi.onDownloadComplete((modelId) => {
        setDownloadProgress(prev => {
          const next = new Map(prev);
          next.delete(modelId);
          return next;
        });
        loadModels(); // Refresh model list after download completes
      });

      unsubscribeError = await llmApi.onDownloadError((error) => {
        console.error('Download error:', error);
        setError(`Download failed: ${error}`);
        loadModels(); // Refresh to clear any stale state
      });
    };

    setupListeners();

    return () => {
      if (unsubscribeProgress) unsubscribeProgress();
      if (unsubscribeComplete) unsubscribeComplete();
      if (unsubscribeError) unsubscribeError();
    };
  }, []);

  const loadModels = async () => {
    try {
      const [available, local, storage, defaultId] = await Promise.all([
        llmApi.getAvailableModels(),
        llmApi.getLocalModels(),
        llmApi.getStorageUsage(),
        llmApi.getDefaultModelId()
      ]);

      setAvailableModels(available);
      setLocalModels(local);
      setStorageUsed(storage);
      setDefaultModelId(defaultId);
      setError(null);
    } catch (err) {
      setError('Failed to load models');
      console.error('Failed to load models:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (model: ModelInfo) => {
    try {
      // Event listeners will handle progress updates
      await llmApi.downloadModel(model.id);
    } catch (err) {
      setError(`Failed to download ${model.name}`);
      console.error('Download failed:', err);
    }
  };

  const handleDelete = async (modelId: string) => {
    if (confirm('정말로 이 모델을 삭제하시겠습니까?')) {
      try {
        await llmApi.deleteModel(modelId);
        await loadModels();
      } catch (err) {
        setError('Failed to delete model');
        console.error('Delete failed:', err);
      }
    }
  };

  const handleSetDefault = async (modelId: string) => {
    try {
      await llmApi.setDefaultModel(modelId);
      await loadModels();
    } catch (err) {
      setError('Failed to set default model');
      console.error('Set default failed:', err);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isModelDownloaded = (modelId: string) => {
    return localModels.some(m => m.info.id === modelId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className={`h-8 w-8 animate-spin ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Storage Info */}
      <div className={`p-4 rounded-xl border ${
        isDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <HardDrive className={`h-4 w-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} />
            <span className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            }`}>
              저장 공간 사용량
            </span>
          </div>
          <span className={`text-sm font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
            {formatBytes(storageUsed)}
          </span>
        </div>
        <div className={`h-2 rounded-full overflow-hidden ${
          isDarkMode ? 'bg-white/10' : 'bg-slate-200'
        }`}>
          <div
            className={`h-full transition-all ${
              isDarkMode ? 'bg-blue-400' : 'bg-blue-500'
            }`}
            style={{ width: `${Math.min((storageUsed / (10 * 1024 * 1024 * 1024)) * 100, 100)}%` }}
          />
        </div>
        <p className={`mt-2 text-[11px] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
          10GB 중 {formatBytes(storageUsed)} 사용 중
        </p>
      </div>

      {/* Available Models */}
      <div>
        <h3 className={`text-[11px] font-semibold uppercase tracking-[0.2em] mb-3 ${
          isDarkMode ? 'text-slate-400' : 'text-slate-500'
        }`}>
          사용 가능한 모델
        </h3>

        <div className="space-y-3">
          {availableModels.map(model => {
            const isDownloaded = isModelDownloaded(model.id);
            const progress = downloadProgress.get(model.id);
            const isDownloading = progress && progress.status === 'downloading';

            return (
              <div
                key={model.id}
                className={`p-4 rounded-xl border transition ${
                  isDarkMode
                    ? 'bg-white/5 border-white/10 hover:bg-white/[0.07]'
                    : 'bg-white border-slate-200 hover:shadow-lg'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className={`text-[13px] font-semibold ${
                      isDarkMode ? 'text-slate-200' : 'text-slate-900'
                    }`}>
                      {model.name}
                    </h4>
                    <p className={`text-xs mt-0.5 ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      {model.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isDownloaded && (
                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        isDarkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'
                      }`}>
                        <Check className="h-3 w-3" />
                        다운로드됨
                      </div>
                    )}
                    {isDownloaded ? (
                      <button
                        onClick={() => handleDelete(model.id)}
                        className={`p-1.5 rounded-md transition ${
                          isDarkMode
                            ? 'text-red-400 hover:bg-red-500/20'
                            : 'text-red-500 hover:bg-red-50'
                        }`}
                        title="모델 삭제"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : isDownloading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className={`h-4 w-4 animate-spin ${
                          isDarkMode ? 'text-blue-400' : 'text-blue-500'
                        }`} />
                        <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          {progress.percentage.toFixed(0)}%
                        </span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleDownload(model)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                          isDarkMode
                            ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                        }`}
                      >
                        <Download className="h-3.5 w-3.5" />
                        다운로드
                      </button>
                    )}
                  </div>
                </div>

                <div className={`flex items-center gap-4 text-[11px] ${
                  isDarkMode ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  <span>크기: {formatBytes(model.size)}</span>
                  <span>양자화: {model.quantization}</span>
                  <span>최소 RAM: {formatBytes(model.requirements.min_ram * 1024 * 1024)}</span>
                </div>

                {isDownloading && progress && (
                  <div className="mt-3">
                    <div className={`h-1.5 rounded-full overflow-hidden ${
                      isDarkMode ? 'bg-white/10' : 'bg-slate-200'
                    }`}>
                      <div
                        className={`h-full transition-all ${
                          isDarkMode ? 'bg-blue-400' : 'bg-blue-500'
                        }`}
                        style={{ width: `${progress.percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className={`text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                        {formatBytes(progress.bytes_downloaded)} / {formatBytes(progress.total_bytes)}
                      </span>
                      {progress.speed > 0 && (
                        <span className={`text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                          {progress.speed.toFixed(2)} MB/s
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Downloaded Models */}
      {localModels.length > 0 && (
        <div>
          <h3 className={`text-[11px] font-semibold uppercase tracking-[0.2em] mb-3 ${
            isDarkMode ? 'text-slate-400' : 'text-slate-500'
          }`}>
            다운로드된 모델
          </h3>

          <div className="space-y-3">
            {localModels.map(model => {
              const isDefault = defaultModelId === model.info.id;
              return (
                <div
                  key={model.info.id}
                  className={`p-4 rounded-xl border ${
                    isDefault
                      ? isDarkMode
                        ? 'bg-blue-500/10 border-blue-500/30'
                        : 'bg-blue-50 border-blue-200'
                      : isDarkMode
                        ? 'bg-white/5 border-white/10'
                        : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className={`text-[13px] font-semibold ${
                          isDarkMode ? 'text-slate-200' : 'text-slate-900'
                        }`}>
                          {model.info.name}
                        </h4>
                        {isDefault && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'
                          }`}>
                            기본 모델
                          </span>
                        )}
                      </div>
                      <p className={`text-[11px] mt-0.5 ${
                        isDarkMode ? 'text-slate-500' : 'text-slate-400'
                      }`}>
                        {formatBytes(model.size_on_disk)} • 다운로드: {new Date(model.downloaded_at).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      {!isDefault && (
                        <button
                          onClick={() => handleSetDefault(model.info.id)}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                            isDarkMode
                              ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                              : 'bg-blue-500 text-white hover:bg-blue-600'
                          }`}
                          title="기본 모델로 설정"
                        >
                          기본 설정
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className={`p-4 rounded-xl border ${
        isDarkMode ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'
      }`}>
        <div className="flex items-start gap-3">
          <Info className={`h-4 w-4 mt-0.5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          <div className="space-y-1">
            <p className={`text-xs font-medium ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>
              사용 팁
            </p>
            <ul className={`text-[11px] space-y-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              <li>• 한국어 요약은 Qwen 2.5 3B 모델을 추천합니다</li>
              <li>• 모델은 로컬에 저장되어 오프라인에서도 사용 가능합니다</li>
              <li>• 다운로드가 중단되어도 자동으로 이어받기됩니다</li>
              <li>• GPU가 있으면 더 빠른 속도로 작동합니다</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className={`p-4 rounded-xl border ${
          isDarkMode
            ? 'bg-red-500/10 border-red-500/20'
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-2">
            <AlertCircle className={`h-4 w-4 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
            <p className={`text-xs ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
              {error}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};