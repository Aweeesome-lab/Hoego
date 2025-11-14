mod ai_summary;
mod history;
mod llm;
mod shortcuts;
mod tray;
mod utils;
mod window_manager;

use std::sync::Arc;
use tauri::{Manager, WindowEvent};

use ai_summary::{generate_ai_feedback, generate_ai_feedback_stream, list_ai_summaries};
use history::{
    append_history_entry, get_today_markdown, list_history, open_history_folder,
    save_today_markdown, HistoryState,
};
use shortcuts::register_shortcuts;
use tray::{build_tray, handle_tray_event};
use window_manager::{
    ensure_accessibility_permission, get_window_position, hide_main_window, open_llm_settings,
    set_window_corner_radius, set_window_position, toggle_overlay_window,
};

// LLM Command Handlers
#[tauri::command]
async fn llm_get_available_models(
    state: tauri::State<'_, Arc<llm::LLMManager>>,
) -> Result<Vec<llm::models::ModelInfo>, String> {
    state
        .model_manager
        .get_available_models()
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn llm_get_local_models(
    state: tauri::State<'_, Arc<llm::LLMManager>>,
) -> Result<Vec<llm::models::LocalModel>, String> {
    state
        .model_manager
        .get_local_models()
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn llm_download_model(
    state: tauri::State<'_, Arc<llm::LLMManager>>,
    app: tauri::AppHandle,
    model_id: String,
) -> Result<(), String> {
    let model_info = state
        .model_manager
        .get_model_by_id(&model_id)
        .await
        .ok_or_else(|| "Model not found".to_string())?;

    let dest_path = state.model_manager.get_model_path(&model_id);

    // Download with progress events
    let app_handle = app.clone();
    let model_manager = state.model_manager.clone();
    let info_clone = model_info.clone();

    let model_info_url = model_info.url.clone();
    let app_for_complete = app.clone();
    let app_for_error = app.clone();

    tokio::spawn(async move {
        let result = llm::download::download_model(
            model_id.clone(),
            model_info_url,
            dest_path.clone(),
            move |progress| {
                let _ = app_handle.emit_all("llm_download_progress", &progress);
            },
        )
        .await;

        match result {
            Ok(path) => {
                // Register the downloaded model
                if let Err(e) = model_manager
                    .register_downloaded_model(info_clone, path)
                    .await
                {
                    let _ = app_for_error
                        .emit_all("llm_download_error", format!("{}: {}", model_id, e));
                } else {
                    let _ = app_for_complete.emit_all("llm_download_complete", &model_id);
                }
            }
            Err(e) => {
                let _ =
                    app_for_error.emit_all("llm_download_error", format!("{}: {}", model_id, e));
            }
        }
    });

    Ok(())
}

#[tauri::command]
async fn llm_delete_model(
    state: tauri::State<'_, Arc<llm::LLMManager>>,
    model_id: String,
) -> Result<(), String> {
    state
        .model_manager
        .delete_model(&model_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn llm_get_storage_usage(state: tauri::State<'_, Arc<llm::LLMManager>>) -> Result<u64, String> {
    state
        .model_manager
        .get_storage_usage()
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn llm_get_default_model_id(
    state: tauri::State<'_, Arc<llm::LLMManager>>,
) -> Result<Option<String>, String> {
    Ok(state.model_manager.get_default_model_id().await)
}

#[tauri::command]
async fn llm_set_default_model(
    state: tauri::State<'_, Arc<llm::LLMManager>>,
    model_id: String,
) -> Result<(), String> {
    // 1) Save as default
    state
        .model_manager
        .set_default_model(model_id.clone())
        .await
        .map_err(|e| e.to_string())?;

    // 2) If engine is running with another model, reload to apply immediately
    let models = state
        .model_manager
        .get_local_models()
        .await
        .map_err(|e| e.to_string())?;
    if let Some(target) = models.iter().find(|m| m.info.id == model_id) {
        let mut engine = state.engine.lock().await;
        engine
            .load_model(target.path.clone())
            .map_err(|e| format!("Failed to load default model: {}", e))?;
        eprintln!("[LLM] Default model applied and reloaded: {}", target.info.name);
    }

    Ok(())
}

#[tauri::command]
async fn llm_load_model(
    state: tauri::State<'_, Arc<llm::LLMManager>>,
    model_id: String,
) -> Result<(), String> {
    eprintln!("Loading model: {}", model_id);

    // Get the model info
    let models = state
        .model_manager
        .get_local_models()
        .await
        .map_err(|e| e.to_string())?;

    let model = models
        .iter()
        .find(|m| m.info.id == model_id)
        .ok_or_else(|| format!("Model not found: {}", model_id))?;

    // Load the model (non-blocking)
    let mut engine = state.engine.lock().await;
    engine.load_model(model.path.clone()).map_err(|e| {
        eprintln!("Failed to load model: {}", e);
        e.to_string()
    })?;

    eprintln!("Model loaded successfully: {}", model_id);
    Ok(())
}

#[tauri::command]
async fn llm_is_ready(
    state: tauri::State<'_, Arc<llm::LLMManager>>,
) -> Result<bool, String> {
    let engine = state.engine.lock().await;
    engine.wait_for_ready().await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_prompt_configs() -> Result<Vec<llm::prompt_config::PromptConfig>, String> {
    let store = llm::prompt_config::PromptConfigStore::load()
        .map_err(|e| e.to_string())?;
    Ok(store.get_all_configs())
}

#[tauri::command]
async fn save_prompt_config(name: String, user_prompt: String) -> Result<llm::prompt_config::PromptConfig, String> {
    let mut store = llm::prompt_config::PromptConfigStore::load()
        .map_err(|e| e.to_string())?;
    store.add_config(name, user_prompt)
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn activate_prompt_config(prompt_id: String) -> Result<(), String> {
    let mut store = llm::prompt_config::PromptConfigStore::load()
        .map_err(|e| e.to_string())?;
    store.activate_config(&prompt_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn delete_prompt_config(prompt_id: String) -> Result<(), String> {
    let mut store = llm::prompt_config::PromptConfigStore::load()
        .map_err(|e| e.to_string())?;
    store.delete_config(&prompt_id)
        .map_err(|e| e.to_string())
}

fn main() {
    // Initialize LLM Manager
    let llm_manager = Arc::new(llm::LLMManager::new().expect("Failed to initialize LLM manager"));

    tauri::Builder::default()
        .manage(HistoryState::default())
        .manage(llm_manager.clone())
        .system_tray(build_tray())
        .on_system_tray_event(handle_tray_event)
        .invoke_handler(tauri::generate_handler![
            append_history_entry,
            save_today_markdown,
            get_today_markdown,
            list_history,
            generate_ai_feedback,
            generate_ai_feedback_stream,
            list_ai_summaries,
            open_history_folder,
            hide_main_window,
            toggle_overlay_window,
            set_window_position,
            get_window_position,
            open_llm_settings,
            // LLM commands
            llm::summarize::summarize_note,
            llm::summarize::batch_summarize,
            llm::summarize::get_note_insights,
            llm::summarize::create_meeting_minutes,
            llm::summarize::daily_review,
            llm_get_available_models,
            llm_get_local_models,
            llm_download_model,
            llm_delete_model,
            llm_get_storage_usage,
            llm_get_default_model_id,
            llm_set_default_model,
            llm_load_model,
            llm_is_ready,
            // Prompt configuration commands
            get_prompt_configs,
            save_prompt_config,
            activate_prompt_config,
            delete_prompt_config
        ])
        .setup(|app| {
            let state = app.state::<HistoryState>();
            debug_log!("[hoego] 앱 시작 - 히스토리 디렉토리: {:?}", state.directory);
            history::ensure_history_dir(&state.directory).map_err(|error| {
                format!(
                    "히스토리 디렉토리 생성 실패: {error}, 경로: {:?}",
                    state.directory
                )
            })?;
            debug_log!(
                "[hoego] 히스토리 디렉토리 확인/생성 완료: {:?}",
                state.directory
            );

            ensure_accessibility_permission();
            register_shortcuts(&app.handle())?;
            history::emit_history_update(&app.handle())?;

            // 백그라운드에서 LLM 서버 예열: 기본 모델이 설정되어 있으면 자동 로드
            let llm_state = app.state::<Arc<llm::LLMManager>>().inner().clone();
            tauri::async_runtime::spawn_blocking(move || {
                let rt = match tokio::runtime::Runtime::new() {
                    Ok(rt) => rt,
                    Err(e) => {
                        eprintln!("[LLM] runtime init failed: {}", e);
                        return;
                    }
                };
                match rt.block_on(llm_state.initialize()) {
                    Ok(()) => eprintln!("[LLM] initialize started (background)"),
                    Err(e) => eprintln!("[LLM] initialize failed: {}", e),
                }
            });

            if let Some(window) = app.get_window("main") {
                #[cfg(target_os = "macos")]
                set_window_corner_radius(&window);
                window.hide()?;
            }

            Ok(())
        })
        .on_window_event(|event| match event.event() {
            WindowEvent::Moved(position) => {
                if event.window().label() == "main" {
                    let _pos = *position;
                    debug_log!("[hoego] 창 이동 이벤트: ({}, {})", _pos.x, _pos.y);
                }
            }
            WindowEvent::CloseRequested { api, .. } => {
                if event.window().label() == "main" {
                    event.window().hide().ok();
                    api.prevent_close();
                }
                if event.window().label() == "history" {
                    event.window().hide().ok();
                    api.prevent_close();
                }
            }
            _ => {}
        })
        .run(tauri::generate_context!())
        .expect("error while running Tauri application");
}
