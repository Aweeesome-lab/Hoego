/**
 * Model Selection Utilities
 * Manages unified model selection for both local and cloud LLMs
 */

import { CloudLLMClient } from './cloud-llm';
import { llmApi } from './llm';

import type { SelectedModel, ModelOption } from '@/types/model-selection';

import {
  SELECTED_MODEL_KEY,
  DEFAULT_MODEL,
  CLOUD_MODELS,
} from '@/types/model-selection';

/**
 * Get currently selected model from localStorage
 */
export function getSelectedModel(): SelectedModel {
  try {
    const stored = localStorage.getItem(SELECTED_MODEL_KEY);
    if (!stored) return DEFAULT_MODEL;

    const parsed = JSON.parse(stored) as SelectedModel;
    return parsed;
  } catch (error) {
    console.error('[Model Selection] Failed to load selected model:', error);
    return DEFAULT_MODEL;
  }
}

/**
 * Save selected model to localStorage and sync to backend
 */
export async function setSelectedModel(model: SelectedModel): Promise<void> {
  try {
    localStorage.setItem(SELECTED_MODEL_KEY, JSON.stringify(model));

    // Sync to backend
    const { invoke } = await import('@tauri-apps/api/tauri');
    await invoke('set_selected_model', {
      model: {
        modelType: model.type,
        modelId: model.modelId,
        provider: model.provider || null,
        displayName: model.displayName || null,
      },
    });
  } catch (error) {
    console.error('[Model Selection] Failed to save selected model:', error);
  }
}

/**
 * Get all available model options (local + cloud)
 */
export async function getAllModelOptions(): Promise<ModelOption[]> {
  const options: ModelOption[] = [];

  try {
    // Get local models
    const localModels = await llmApi.getLocalModels();
    for (const model of localModels) {
      options.push({
        id: model.info.id,
        type: 'local',
        displayName: model.info.name || model.info.id,
        description: `로컬 모델 • ${formatBytes(model.size_on_disk)}`,
        isAvailable: true,
      });
    }

    // Get cloud models
    const providers = ['openai', 'claude', 'gemini'] as const;

    for (const provider of providers) {
      const hasApiKey = await CloudLLMClient.hasApiKey(provider);
      const models = CLOUD_MODELS[provider];

      for (const model of models) {
        options.push({
          id: model.id,
          type: 'cloud',
          displayName: model.displayName,
          provider,
          description: hasApiKey ? model.description : '⚠️ API 키 필요',
          isAvailable: hasApiKey,
        });
      }
    }
  } catch (error) {
    console.error('[Model Selection] Failed to load model options:', error);
  }

  return options;
}

/**
 * Get currently selected model option with availability check
 */
export async function getSelectedModelOption(): Promise<ModelOption | null> {
  const selected = getSelectedModel();
  const allOptions = await getAllModelOptions();

  return (
    allOptions.find(
      (opt) =>
        opt.id === selected.modelId &&
        opt.type === selected.type &&
        opt.provider === selected.provider
    ) || null
  );
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Auto-select first available model if none selected
 */
export async function autoSelectModel(): Promise<SelectedModel> {
  const current = getSelectedModel();

  // If already selected and valid, return it
  const currentOption = await getSelectedModelOption();
  if (currentOption && currentOption.isAvailable) {
    return current;
  }

  // Try to find first available model
  const allOptions = await getAllModelOptions();
  const firstAvailable = allOptions.find((opt) => opt.isAvailable);

  if (firstAvailable) {
    const newSelection: SelectedModel = {
      type: firstAvailable.type,
      modelId: firstAvailable.id,
      provider: firstAvailable.provider,
      displayName: firstAvailable.displayName,
    };
    void setSelectedModel(newSelection);
    return newSelection;
  }

  return DEFAULT_MODEL;
}
