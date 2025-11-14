import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/tauri';

// Types
export interface ModelInfo {
  id: string;
  name: string;
  size: number;
  url: string;
  quantization: string;
  description: string;
  requirements: ModelRequirements;
}

export interface ModelRequirements {
  min_ram: number;
  recommended_ram: number;
  supports_gpu: boolean;
}

export interface LocalModel {
  info: ModelInfo;
  path: string;
  downloaded_at: string;
  size_on_disk: number;
}

export interface DownloadProgress {
  model_id: string;
  bytes_downloaded: number;
  total_bytes: number;
  percentage: number;
  speed: number; // MB/s
  eta_seconds?: number;
  status:
    | 'pending'
    | 'downloading'
    | 'paused'
    | 'completed'
    | 'failed'
    | 'verifying';
}

export type SummarizationStyle =
  | 'Bullet'
  | 'Paragraph'
  | 'Keywords'
  | 'Outline'
  | 'Brief';

export interface SummaryRequest {
  content: string;
  style?: SummarizationStyle;
  max_length?: number;
  model_id?: string;
}

export interface SummaryResult {
  summary: string;
  style: SummarizationStyle;
  model_used: string;
  tokens_used: number;
  processing_time_ms: number;
}

export interface BatchSummaryRequest {
  notes: NoteToSummarize[];
  style?: SummarizationStyle;
  combine: boolean;
}

export interface NoteToSummarize {
  id: string;
  content: string;
  title?: string;
}

export interface BatchSummaryResult {
  summaries: NoteSummary[];
  combined_summary?: string;
  total_tokens: number;
  total_time_ms: number;
}

export interface NoteSummary {
  note_id: string;
  summary: string;
}

// API Functions
export const llmApi = {
  // Model Management
  async getAvailableModels(): Promise<ModelInfo[]> {
    return invoke('llm_get_available_models');
  },

  async getLocalModels(): Promise<LocalModel[]> {
    return invoke('llm_get_local_models');
  },

  async downloadModel(modelId: string): Promise<void> {
    return invoke('llm_download_model', { modelId });
  },

  async deleteModel(modelId: string): Promise<void> {
    return invoke('llm_delete_model', { modelId });
  },

  async getStorageUsage(): Promise<number> {
    return invoke('llm_get_storage_usage');
  },

  async getDefaultModelId(): Promise<string | null> {
    return invoke('llm_get_default_model_id');
  },

  async setDefaultModel(modelId: string): Promise<void> {
    return invoke('llm_set_default_model', { modelId });
  },

  // Summarization
  async summarizeNote(request: SummaryRequest): Promise<SummaryResult> {
    return invoke('summarize_note', { request });
  },

  async batchSummarize(
    request: BatchSummaryRequest
  ): Promise<BatchSummaryResult> {
    return invoke('batch_summarize', { request });
  },

  async getNoteInsights(content: string): Promise<string> {
    return invoke('get_note_insights', { content });
  },

  async createMeetingMinutes(content: string): Promise<string> {
    return invoke('create_meeting_minutes', { content });
  },

  async dailyReview(notes: string[]): Promise<string> {
    return invoke('daily_review', { notes });
  },

  // Event Listeners
  onDownloadProgress(
    callback: (progress: DownloadProgress) => void
  ): Promise<() => void> {
    return listen<DownloadProgress>('llm_download_progress', (event) => {
      callback(event.payload);
    });
  },

  onDownloadComplete(callback: (modelId: string) => void): Promise<() => void> {
    return listen<string>('llm_download_complete', (event) => {
      callback(event.payload);
    });
  },

  onDownloadError(callback: (error: string) => void): Promise<() => void> {
    return listen<string>('llm_download_error', (event) => {
      callback(event.payload);
    });
  },
};

// Helper functions
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}
