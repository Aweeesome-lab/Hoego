/**
 * Unified Model Selection Types
 * Manages both local and cloud LLM model selection
 */

export type ModelType = 'local' | 'cloud';

export interface SelectedModel {
  type: ModelType;
  modelId: string; // local: model file ID, cloud: "gpt-4-turbo", "claude-3-opus", etc.
  provider?: string; // Only for cloud: "openai", "claude", "gemini"
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

// Cloud model presets
export const CLOUD_MODELS = {
  openai: [
    {
      id: 'gpt-4-turbo',
      displayName: 'GPT-4 Turbo',
      description: '가장 강력한 OpenAI 모델',
    },
    {
      id: 'gpt-4',
      displayName: 'GPT-4',
      description: '고품질 추론 모델',
    },
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
      id: 'gpt-3.5-turbo',
      displayName: 'GPT-3.5 Turbo',
      description: '빠르고 효율적인 모델',
    },
  ],
  claude: [
    {
      id: 'claude-3-opus',
      displayName: 'Claude 3 Opus',
      description: '가장 강력한 Claude 모델',
    },
    {
      id: 'claude-3-sonnet',
      displayName: 'Claude 3 Sonnet',
      description: '균형잡힌 성능',
    },
    {
      id: 'claude-3-haiku',
      displayName: 'Claude 3 Haiku',
      description: '빠른 응답',
    },
  ],
  gemini: [
    {
      id: 'gemini-pro',
      displayName: 'Gemini Pro',
      description: '다목적 모델',
    },
    {
      id: 'gemini-ultra',
      displayName: 'Gemini Ultra',
      description: '최고 성능 모델',
    },
  ],
} as const;
