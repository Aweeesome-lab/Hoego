// Cloud LLM Types
// Backend Rust 타입과 동기화

export interface CompletionRequest {
  messages: Message[];
  model: string;
  temperature?: number;
  max_tokens?: number;
  system_prompt?: string;
  metadata?: Record<string, string>;
}

export interface CompletionResponse {
  content: string;
  finish_reason: FinishReason;
  usage: TokenUsage;
  model: string;
  provider: string;
}

export interface Message {
  role: MessageRole;
  content: string;
}

export type MessageRole = 'system' | 'user' | 'assistant';

export type FinishReason = 'stop' | 'length' | 'content_filter' | 'tool_calls';

export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ProviderConfig {
  name: string;
  enabled: boolean;
  default_model: string;
}

export type LLMBackend =
  | { type: 'local' }
  | { type: 'cloud'; provider: string };

// Provider 관련 타입 (GPT + Gemini only)
export type CloudProvider = 'openai' | 'gemini';

export interface ProviderInfo {
  id: CloudProvider;
  name: string;
  models: string[];
  description: string;
}

// OpenAI 모델
export const OPENAI_MODELS = [
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4-turbo',
  'gpt-3.5-turbo',
] as const;

export type OpenAIModel = (typeof OPENAI_MODELS)[number];

// Gemini 모델
export const GEMINI_MODELS = [
  'gemini-pro',
  'gemini-1.5-pro',
  'gemini-1.5-flash',
] as const;

export type GeminiModel = (typeof GEMINI_MODELS)[number];

// 에러 타입
export interface CloudLLMError {
  type:
    | 'network'
    | 'auth'
    | 'rate_limit'
    | 'invalid_request'
    | 'provider'
    | 'config';
  message: string;
}

// 설정 상태
export interface CloudLLMState {
  hasApiKey: boolean;
  currentProvider: CloudProvider | null;
  currentModel: string | null;
}
