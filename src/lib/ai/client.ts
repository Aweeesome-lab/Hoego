import { invoke } from '@tauri-apps/api/tauri';

export type AiEngineStatus = {
  reachable: boolean;
  running: boolean;
  port: number;
  activeModel?: string | null;
  message?: string | null;
};

export type LocalModel = {
  filename: string;
  sizeBytes: number;
};

export async function aiLlamaStatus(port?: number): Promise<AiEngineStatus> {
  try {
    return await invoke<AiEngineStatus>('ai_llama_status', { port });
  } catch (e) {
    return {
      reachable: false,
      running: false,
      port: port ?? 11435,
      activeModel: null,
      message: String(e),
    };
  }
}

export async function aiLlamaStartServer(args: {
  binary?: string;
  model: string;
  port: number;
  ctx: number;
  ngl: number;
  threads: number;
}): Promise<void> {
  return await invoke('ai_llama_start_server', args as Record<string, unknown>);
}

export async function aiLlamaStopServer(): Promise<void> {
  return await invoke('ai_llama_stop_server');
}

export async function aiModelsDir(): Promise<string> {
  return await invoke('ai_models_dir');
}

export async function aiModelsList(): Promise<LocalModel[]> {
  return await invoke('ai_models_list');
}

export async function aiModelDownload(
  url: string,
  filename: string
): Promise<void> {
  return await invoke('ai_model_download', { url, filename });
}

export async function aiModelDelete(filename: string): Promise<void> {
  return await invoke('ai_model_delete', { filename });
}

export async function aiSummarizeV1(args: {
  model?: string;
  port: number;
  note: string;
}): Promise<void> {
  return await invoke('ai_summarize_v1', { app: undefined, ...args } as Record<
    string,
    unknown
  >);
}

export async function saveAiSummary(content: string): Promise<string> {
  return await invoke('save_ai_summary', { content });
}

export async function openModelsFolder(): Promise<void> {
  return await invoke('open_models_folder');
}

export async function aiEngineDir(): Promise<string> {
  return await invoke('ai_engine_dir');
}

export async function aiEngineStatus(): Promise<{
  installed: boolean;
  path: string;
}> {
  return await invoke('ai_engine_status');
}

export async function aiEngineInstall(): Promise<void> {
  return await invoke('ai_engine_install');
}

export async function openEngineFolder(): Promise<void> {
  return await invoke('open_engine_folder');
}

export async function openSettingsWindow(): Promise<void> {
  return await invoke('open_settings_window_command');
}
