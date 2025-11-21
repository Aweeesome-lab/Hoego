import React, { useState, useEffect } from 'react';

import type { ModelOption, SelectedModel } from '@/types/model-selection';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
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
        className={`h-7 w-auto gap-1 border-none bg-transparent px-2 text-xs shadow-none focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 ${
          isDarkMode
            ? 'text-slate-400 hover:text-slate-200'
            : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        <span className="truncate max-w-[100px]">
          {currentOption?.displayName || '모델'}
        </span>
      </SelectTrigger>
      <SelectContent
        align="end"
        className={`min-w-[140px] ${
          isDarkMode ? 'bg-[#1a1f2e] border-white/10' : 'bg-white'
        }`}
      >
        {/* Local Models Section */}
        {localModels.length > 0 && (
          <SelectGroup>
            <SelectLabel
              className={`text-[9px] uppercase tracking-wider pl-2 ${
                isDarkMode ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              로컬
            </SelectLabel>
            {localModels.map((option) => (
              <SelectItem
                key={getValueString(option)}
                value={getValueString(option)}
                disabled={!option.isAvailable}
                hideIndicator
                className={`pr-3 py-1.5 text-xs cursor-pointer ${
                  currentValueString === getValueString(option)
                    ? isDarkMode
                      ? 'bg-blue-500/20 text-blue-300'
                      : 'bg-blue-50 text-blue-700'
                    : ''
                }`}
              >
                {option.displayName}
              </SelectItem>
            ))}
          </SelectGroup>
        )}

        {/* TODO: Beta 테스트 후 클라우드 모델 활성화 */}
        {/* {localModels.length > 0 &&
          Object.keys(cloudModelsByProvider).length > 0 && <SelectSeparator />}

        {Object.entries(cloudModelsByProvider).map(([provider, models]) => (
          <SelectGroup key={provider}>
            <SelectLabel
              className={`text-[9px] uppercase tracking-wider pl-2 ${
                isDarkMode ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              {provider === 'openai'
                ? 'OpenAI'
                : provider === 'gemini'
                  ? 'Gemini'
                  : provider}
            </SelectLabel>
            {models.map((option) => (
              <SelectItem
                key={getValueString(option)}
                value={getValueString(option)}
                disabled={!option.isAvailable}
                hideIndicator
                className={`pr-3 py-1.5 text-xs cursor-pointer ${
                  currentValueString === getValueString(option)
                    ? isDarkMode
                      ? 'bg-blue-500/20 text-blue-300'
                      : 'bg-blue-50 text-blue-700'
                    : ''
                }`}
              >
                {option.displayName}
              </SelectItem>
            ))}
          </SelectGroup>
        ))} */}

        {/* Empty State */}
        {modelOptions.length === 0 && !loading && (
          <div
            className={`px-2 py-4 text-center text-[11px] ${
              isDarkMode ? 'text-slate-500' : 'text-slate-400'
            }`}
          >
            모델 없음
          </div>
        )}
      </SelectContent>
    </Select>
  );
};
