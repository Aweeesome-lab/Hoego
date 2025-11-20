/**
 * Unified Model Selection Types
 * Manages both local and cloud LLM model selection
 */

export type ModelType = 'local' | 'cloud';

export interface SelectedModel {
  type: ModelType;
  modelId: string; // local: model file ID, cloud: "gpt-4-turbo", "gemini-pro", etc.
  provider?: string; // Only for cloud: "openai", "gemini"
  displayName?: string; // Human-readable name for UI
}

export interface ModelOption {
  id: string;
  type: ModelType;
  displayName: string;
  provider?: string;
  description?: string;
  isAvailable: boolean; // true if model is downloaded (local) or API key exists (cloud)
}

// Storage key for selected model
export const SELECTED_MODEL_KEY = 'hoego_selected_model';

// Default model configuration
export const DEFAULT_MODEL: SelectedModel = {
  type: 'local',
  modelId: '', // Will be set to first available local model or empty
  displayName: 'No model selected',
};

// Cloud model presets (GPT + Gemini only)
export const CLOUD_MODELS = {
  openai: [
    {
      id: 'gpt-4o',
      displayName: 'GPT-4o',
      description: '최신 멀티모달 모델',
    },
    {
      id: 'gpt-4o-mini',
      displayName: 'GPT-4o Mini',
      description: '빠르고 저렴한 모델',
    },
    {
      id: 'gpt-4-turbo',
      displayName: 'GPT-4 Turbo',
      description: '강력한 추론 모델',
    },
    {
      id: 'gpt-3.5-turbo',
      displayName: 'GPT-3.5 Turbo',
      description: '빠르고 효율적인 모델',
    },
  ],
  gemini: [
    {
      id: 'gemini-pro',
      displayName: 'Gemini Pro',
      description: '다목적 모델',
    },
    {
      id: 'gemini-1.5-pro',
      displayName: 'Gemini 1.5 Pro',
      description: '향상된 성능',
    },
    {
      id: 'gemini-1.5-flash',
      displayName: 'Gemini 1.5 Flash',
      description: '빠른 응답',
    },
  ],
} as const;
