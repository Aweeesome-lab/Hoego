import { ChevronDown, Brain, Cloud, Check } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

import type { ModelOption, SelectedModel } from '@/types/model-selection';

import {
  getAllModelOptions,
  getSelectedModel,
  setSelectedModel,
} from '@/lib/model-selection';

interface ModelSelectorProps {
  isDarkMode: boolean;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({ isDarkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedModel, setSelectedModelState] =
    useState<SelectedModel>(getSelectedModel());
  const [modelOptions, setModelOptions] = useState<ModelOption[]>([]);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void loadModelOptions();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const loadModelOptions = async () => {
    try {
      const options = await getAllModelOptions();
      setModelOptions(options);
    } catch (error) {
      console.error('Failed to load model options:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectModel = async (option: ModelOption) => {
    const newSelection: SelectedModel = {
      type: option.type,
      modelId: option.id,
      provider: option.provider,
      displayName: option.displayName,
    };
    await setSelectedModel(newSelection);
    setSelectedModelState(newSelection);
    setIsOpen(false);
  };

  const currentOption = modelOptions.find(
    (opt) =>
      opt.id === selectedModel.modelId &&
      opt.type === selectedModel.type &&
      opt.provider === selectedModel.provider
  );

  // Group models by type
  const localModels = modelOptions.filter((opt) => opt.type === 'local');
  const cloudModels = modelOptions.filter((opt) => opt.type === 'cloud');

  // Group cloud models by provider
  const cloudModelsByProvider: Record<string, ModelOption[]> = {};
  cloudModels.forEach((model) => {
    if (model.provider) {
      if (!cloudModelsByProvider[model.provider]) {
        cloudModelsByProvider[model.provider] = [];
      }
      cloudModelsByProvider[model.provider].push(model);
    }
  });

  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
          isDarkMode
            ? 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-300 border border-white/10'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 border border-slate-200'
        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {currentOption?.type === 'local' ? (
          <Brain className="h-3 w-3" />
        ) : (
          <Cloud className="h-3 w-3" />
        )}
        <span className="max-w-[100px] truncate">
          {currentOption?.displayName || '모델 선택'}
        </span>
        <ChevronDown className="h-3 w-3" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute top-full right-0 mt-1 w-64 rounded-lg border shadow-lg overflow-hidden z-50 ${
            isDarkMode
              ? 'bg-[#1a1f2e] border-white/10'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="max-h-96 overflow-y-auto">
            {/* Local Models Section */}
            {localModels.length > 0 && (
              <div>
                <div
                  className={`px-3 py-2 text-[10px] font-semibold uppercase tracking-wider ${
                    isDarkMode ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  로컬 모델
                </div>
                {localModels.map((option) => (
                  <button
                    key={`${option.type}-${option.id}`}
                    onClick={() => option.isAvailable && handleSelectModel(option)}
                    disabled={!option.isAvailable}
                    className={`w-full flex items-start gap-2 px-3 py-2 text-left transition ${
                      option.id === selectedModel.modelId &&
                      option.type === selectedModel.type
                        ? isDarkMode
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'bg-blue-50 text-blue-700'
                        : isDarkMode
                          ? 'text-slate-300 hover:bg-white/5'
                          : 'text-slate-700 hover:bg-slate-50'
                    } ${!option.isAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Brain className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[12px] font-medium truncate">
                          {option.displayName}
                        </span>
                        {option.id === selectedModel.modelId &&
                          option.type === selectedModel.type && (
                            <Check className="h-3 w-3 flex-shrink-0" />
                          )}
                      </div>
                      <div
                        className={`text-[10px] ${
                          isDarkMode ? 'text-slate-500' : 'text-slate-500'
                        }`}
                      >
                        {option.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Cloud Models Section */}
            {Object.entries(cloudModelsByProvider).map(
              ([provider, models]) => (
                <div key={provider}>
                  <div
                    className={`px-3 py-2 text-[10px] font-semibold uppercase tracking-wider ${
                      isDarkMode ? 'text-slate-500' : 'text-slate-400'
                    } ${localModels.length > 0 ? 'border-t border-white/10' : ''}`}
                  >
                    {provider === 'openai'
                      ? 'OpenAI'
                      : provider === 'gemini'
                        ? 'Google Gemini'
                        : provider}
                  </div>
                  {models.map((option) => (
                    <button
                      key={`${option.type}-${option.id}-${option.provider}`}
                      onClick={() =>
                        option.isAvailable && handleSelectModel(option)
                      }
                      disabled={!option.isAvailable}
                      className={`w-full flex items-start gap-2 px-3 py-2 text-left transition ${
                        option.id === selectedModel.modelId &&
                        option.type === selectedModel.type &&
                        option.provider === selectedModel.provider
                          ? isDarkMode
                            ? 'bg-blue-500/20 text-blue-300'
                            : 'bg-blue-50 text-blue-700'
                          : isDarkMode
                            ? 'text-slate-300 hover:bg-white/5'
                            : 'text-slate-700 hover:bg-slate-50'
                      } ${!option.isAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Cloud className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[12px] font-medium truncate">
                            {option.displayName}
                          </span>
                          {option.id === selectedModel.modelId &&
                            option.type === selectedModel.type &&
                            option.provider === selectedModel.provider && (
                              <Check className="h-3 w-3 flex-shrink-0" />
                            )}
                        </div>
                        <div
                          className={`text-[10px] ${
                            isDarkMode ? 'text-slate-500' : 'text-slate-500'
                          }`}
                        >
                          {option.description}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )
            )}

            {/* Empty State */}
            {modelOptions.length === 0 && !loading && (
              <div
                className={`px-3 py-6 text-center text-[12px] ${
                  isDarkMode ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                사용 가능한 모델이 없습니다.
                <br />
                설정에서 모델을 다운로드하거나 API 키를 설정하세요.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
