import { Brain, Cloud } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import type { ModelOption, SelectedModel } from '@/types/model-selection';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from '@/components/ui/select';
import {
  getAllModelOptions,
  getSelectedModel,
  setSelectedModel,
} from '@/lib/model-selection';

interface ModelSelectorProps {
  isDarkMode: boolean;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({ isDarkMode }) => {
  const [selectedModel, setSelectedModelState] =
    useState<SelectedModel>(getSelectedModel());
  const [modelOptions, setModelOptions] = useState<ModelOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadModelOptions();
  }, []);

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

  const handleSelectModel = async (value: string) => {
    // value format: "type:id:provider" or "type:id"
    const [type, id, provider] = value.split(':');
    const option = modelOptions.find(
      (opt) =>
        opt.id === id &&
        opt.type === type &&
        (opt.provider === provider || (!opt.provider && !provider))
    );

    if (option) {
      const newSelection: SelectedModel = {
        type: option.type,
        modelId: option.id,
        provider: option.provider,
        displayName: option.displayName,
      };
      await setSelectedModel(newSelection);
      setSelectedModelState(newSelection);
    }
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
      const providerModels = cloudModelsByProvider[model.provider];
      if (providerModels) {
        providerModels.push(model);
      }
    }
  });

  const getValueString = (option: ModelOption) => {
    return `${option.type}:${option.id}${option.provider ? `:${option.provider}` : ''}`;
  };

  const currentValueString = currentOption ? getValueString(currentOption) : '';

  return (
    <Select
      value={currentValueString}
      onValueChange={(value) => {
        void handleSelectModel(value);
      }}
      disabled={loading}
    >
      <SelectTrigger
        className={`w-auto min-w-[140px] h-8 gap-2 border-none shadow-none focus:ring-0 ${
          isDarkMode
            ? 'bg-white/5 text-slate-300 hover:bg-white/10'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          {currentOption?.type === 'local' ? (
            <Brain className="h-3.5 w-3.5 flex-shrink-0" />
          ) : (
            <Cloud className="h-3.5 w-3.5 flex-shrink-0" />
          )}
          <SelectValue placeholder="모델 선택" />
        </div>
      </SelectTrigger>
      <SelectContent
        align="end"
        className={`w-[280px] ${
          isDarkMode ? 'bg-[#1a1f2e] border-white/10' : 'bg-white'
        }`}
      >
        {/* Local Models Section */}
        {localModels.length > 0 && (
          <SelectGroup>
            <SelectLabel
              className={`text-[10px] uppercase tracking-wider ${
                isDarkMode ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              로컬 모델
            </SelectLabel>
            {localModels.map((option) => (
              <SelectItem
                key={getValueString(option)}
                value={getValueString(option)}
                disabled={!option.isAvailable}
                className="py-2"
              >
                <div className="flex flex-col gap-0.5 text-left">
                  <div className="flex items-center gap-2">
                    <Brain className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="font-medium">{option.displayName}</span>
                  </div>
                  <span
                    className={`text-[10px] ${
                      isDarkMode ? 'text-slate-500' : 'text-slate-500'
                    }`}
                  >
                    {option.description}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        )}

        {localModels.length > 0 &&
          Object.keys(cloudModelsByProvider).length > 0 && <SelectSeparator />}

        {/* Cloud Models Section */}
        {Object.entries(cloudModelsByProvider).map(([provider, models]) => (
          <SelectGroup key={provider}>
            <SelectLabel
              className={`text-[10px] uppercase tracking-wider ${
                isDarkMode ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              {provider === 'openai'
                ? 'OpenAI'
                : provider === 'gemini'
                  ? 'Google Gemini'
                  : provider}
            </SelectLabel>
            {models.map((option) => (
              <SelectItem
                key={getValueString(option)}
                value={getValueString(option)}
                disabled={!option.isAvailable}
                className="py-2"
              >
                <div className="flex flex-col gap-0.5 text-left">
                  <div className="flex items-center gap-2">
                    <Cloud className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="font-medium">{option.displayName}</span>
                  </div>
                  <span
                    className={`text-[10px] ${
                      isDarkMode ? 'text-slate-500' : 'text-slate-500'
                    }`}
                  >
                    {option.description}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        ))}

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
      </SelectContent>
    </Select>
  );
};
