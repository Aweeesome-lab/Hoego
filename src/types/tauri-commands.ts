/**
 * TypeScript type definitions for Tauri commands
 * Generated from Rust type definitions in src-tauri/src/
 */

// ============================================================================
// History Types (src-tauri/src/history.rs)
// ============================================================================

export interface AppendHistoryEntryPayload {
  timestamp: string;
  minuteKey?: string;
  task: string;
  isNewMinute: boolean;
}

export interface HistoryFileInfo {
  date: string;
  title: string;
  preview?: string;
  filename: string;
  path: string;
}

export interface HistoryOverview {
  directory: string;
  files: HistoryFileInfo[];
}

export interface TodayMarkdown {
  dateKey: string;
  shortLabel: string;
  headerTitle: string;
  filePath: string;
  content: string;
}

// ============================================================================
// Window Manager Types (src-tauri/src/window_manager.rs)
// ============================================================================

export interface WindowPositionPayload {
  x: number;
  y: number;
}

// ============================================================================
// App Settings Types (src-tauri/src/app_settings.rs)
// ============================================================================

export interface AppSettings {
  quickNoteShortcut: string;
  documentsPath: string;
}

// ============================================================================
// LLM Types (src-tauri/src/llm/)
// ============================================================================

export interface ModelInfo {
  name: string;
  display_name: string;
  size_gb: number;
  url: string;
  sha256: string;
  requirements: ModelRequirements;
  description: string;
}

export interface ModelRequirements {
  min_ram_gb: number;
  recommended_ram_gb: number;
  context_length: number;
}

export interface LocalModel {
  name: string;
  path: string;
  size_bytes: number;
  last_modified: string;
}

export interface DownloadProgress {
  model_name: string;
  downloaded_bytes: number;
  total_bytes: number;
  percentage: number;
  status: string;
}

export interface SummaryRequest {
  content: string;
  style: string;
}

export interface SummaryResult {
  summary: string;
  model: string;
  timestamp: string;
}

export interface NoteToSummarize {
  date: string;
  content: string;
}

export interface BatchSummaryRequest {
  notes: NoteToSummarize[];
  style: string;
}

export interface NoteSummary {
  date: string;
  summary: string;
}

export interface BatchSummaryResult {
  summaries: NoteSummary[];
  model: string;
  timestamp: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMConfig {
  model_path?: string;
  n_ctx: number;
  n_gpu_layers: number;
  seed: number;
  temperature: number;
  max_tokens: number;
}

export interface PromptConfig {
  system_prompts: Record<string, string>;
  style_instructions: Record<string, string>;
  default_style: string;
}

// ============================================================================
// AI Summary Types (src-tauri/src/ai_summary.rs)
// ============================================================================

export interface AiSummaryPayload {
  content: string;
  targetDate?: string; // Optional target date (YYYY-MM-DD format) - defaults to today
  options?: {
    style?: string;
    maxTokens?: number;
    temperature?: number;
  };
}

export interface AiSummaryInfo {
  date: string;
  filename: string;
  summary: string;
  model: string;
  timestamp: string;
  path?: string;
  content?: string;
  createdAt?: string;
  piiMasked?: boolean; // 개인정보 보호 여부
}

// ============================================================================
// Weekly Dashboard Types (src-tauri/src/weekly_data.rs)
// ============================================================================

export interface GetWeekDataPayload {
  startDate: string; // ISO 8601 format: YYYY-MM-DD
  weekStartDay: 'sunday' | 'monday';
}

export interface WeekData {
  startDate: string;
  endDate: string;
  dailyEntries: DailyEntry[];
  aggregatedStats: AggregatedStats;
}

export interface DailyEntry {
  date: string;
  dumpContent: string;
  aiFeedback?: string | null;
  retrospectContent?: string | null;
  categorizedTime: Record<string, number>; // category -> seconds
}

export interface AggregatedStats {
  totalCategories: Record<string, number>; // category -> total seconds
  productivityVsWaste: ProductivityStats;
  dailyTrend: DailyTrend[];
}

export interface ProductivityStats {
  productiveSeconds: number;
  wasteSeconds: number;
  productivePercentage: number;
  wastePercentage: number;
}

export interface DailyTrend {
  date: string;
  categories: Record<string, number>; // category -> seconds for this day
}

export interface WeeklyActionItem {
  id: string;
  text: string;
  source: 'ai' | 'user';
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  userEdited: boolean;
}

export interface WeeklyActionsData {
  weekId: string;
  startDate: string;
  generatedAt: string;
  actions: WeeklyActionItem[];
}

// ============================================================================
// Tauri Command Function Types
// ============================================================================

export type TauriCommands = {
  // History commands
  get_today_markdown: () => Promise<TodayMarkdown>;
  append_history_entry: (payload: AppendHistoryEntryPayload) => Promise<void>;
  save_today_markdown: (content: string) => Promise<void>;
  list_history: () => Promise<HistoryOverview>;
  open_history_folder: () => Promise<void>;

  // Window manager commands
  hide_main_window: () => Promise<void>;
  toggle_overlay_window: () => Promise<void>;
  set_window_position: (position: WindowPositionPayload) => Promise<void>;
  get_window_position: () => Promise<WindowPositionPayload | null>;
  open_llm_settings: () => Promise<void>;
  ensure_accessibility_permission: () => Promise<boolean>;
  set_window_corner_radius: (radius: number) => Promise<void>;

  // LLM model commands
  llm_get_available_models: () => Promise<ModelInfo[]>;
  llm_get_local_models: () => Promise<LocalModel[]>;
  llm_download_model: (modelName: string) => Promise<void>;
  llm_cancel_download: (modelName: string) => Promise<void>;
  llm_delete_model: (modelName: string) => Promise<void>;
  llm_get_active_model: () => Promise<string | null>;
  llm_set_active_model: (modelName: string) => Promise<void>;
  llm_unload_model: () => Promise<void>;

  // LLM summarization commands
  summarize_note: (request: SummaryRequest) => Promise<SummaryResult>;
  batch_summarize: (
    request: BatchSummaryRequest
  ) => Promise<BatchSummaryResult>;
  get_note_insights: (content: string) => Promise<string>;
  create_meeting_minutes: (content: string) => Promise<string>;
  daily_review: (content: string) => Promise<string>;

  // LLM prompt configuration commands
  llm_get_prompt_config: () => Promise<PromptConfig>;
  llm_update_prompt_config: (config: PromptConfig) => Promise<void>;
  llm_reset_prompt_config: () => Promise<void>;

  // AI summary commands
  generate_ai_feedback: (targetDate?: string) => Promise<string>;
  generate_ai_feedback_stream: (targetDate?: string) => Promise<void>;
  list_ai_summaries: (
    limit?: number,
    targetDate?: string
  ) => Promise<AiSummaryInfo[]>;

  // Weekly dashboard commands
  get_week_data: (payload: GetWeekDataPayload) => Promise<WeekData>;
  generate_weekly_summary: (weekData: WeekData) => Promise<void>;
  save_weekly_actions: (
    weekId: string,
    actions: WeeklyActionItem[]
  ) => Promise<void>;
  get_weekly_actions: (weekId: string) => Promise<WeeklyActionsData | null>;
};
