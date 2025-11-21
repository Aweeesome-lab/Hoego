// commands/settings.rs
// App settings command handlers

use std::path::PathBuf;
use tauri::{AppHandle, State};

use crate::models::settings::{AppSettings, AppSettingsState, ModelSelectionState, SelectedModel};
use crate::services::storage_service;

// Model Selection Commands

/// Set the currently selected LLM model
#[tauri::command]
pub async fn set_selected_model(
    model: SelectedModel,
    state: State<'_, ModelSelectionState>,
) -> Result<(), String> {
    let mut selected = state.selected.write().await;
    *selected = Some(model);
    Ok(())
}

/// Get the currently selected LLM model
#[tauri::command]
pub async fn get_selected_model(
    state: State<'_, ModelSelectionState>,
) -> Result<Option<SelectedModel>, String> {
    let selected = state.selected.read().await;
    Ok(selected.clone())
}

// App Settings Commands

/// Get app settings
#[tauri::command]
pub fn get_app_settings(state: State<'_, AppSettingsState>) -> Result<AppSettings, String> {
    let settings = state.settings.lock()
        .map_err(|e| format!("설정 잠금 실패: {}", e))?;
    Ok(settings.clone())
}

/// Update app settings
#[tauri::command]
pub fn update_app_settings(
    settings: AppSettings,
    state: State<'_, AppSettingsState>,
) -> Result<(), String> {
    // Save settings to file
    storage_service::save_settings(&settings)?;

    // Update state
    let mut current_settings = state.settings.lock()
        .map_err(|e| format!("설정 잠금 실패: {}", e))?;
    *current_settings = settings;

    Ok(())
}

/// Update quick note shortcut
#[tauri::command]
pub fn update_quick_note_shortcut(
    app: AppHandle,
    shortcut: String,
    state: State<'_, AppSettingsState>,
) -> Result<(), String> {
    // Update settings
    let mut settings = state.settings.lock()
        .map_err(|e| format!("설정 잠금 실패: {}", e))?;
    settings.quick_note_shortcut = shortcut.clone();

    // Save to file
    storage_service::save_settings(&settings)?;

    // Explicitly release mutex
    drop(settings);

    // Re-register shortcuts - settings are already saved even if this fails
    if let Err(e) = crate::platform::shortcuts::register_shortcuts(&app) {
        tracing::warn!("단축키 재등록 실패: {}", e);
        return Err(format!("단축키 등록 실패: {}. 설정은 저장되었습니다. 다른 단축키를 시도해보세요.", e));
    }

    tracing::info!("단축키 변경 및 재등록 완료: {}", shortcut);
    Ok(())
}

/// Update documents path
#[tauri::command]
pub fn update_documents_path(
    path: String,
    state: State<'_, AppSettingsState>,
) -> Result<(), String> {
    // Validate path
    let path_buf = PathBuf::from(&path);
    if !path_buf.exists() {
        std::fs::create_dir_all(&path_buf)
            .map_err(|e| format!("디렉토리 생성 실패: {}", e))?;
    }

    // Update settings
    let mut settings = state.settings.lock()
        .map_err(|e| format!("설정 잠금 실패: {}", e))?;
    settings.documents_path = path;

    // Save to file
    storage_service::save_settings(&settings)?;

    Ok(())
}

/// Reset app settings to defaults
#[tauri::command]
pub fn reset_app_settings(state: State<'_, AppSettingsState>) -> Result<AppSettings, String> {
    let default_settings = AppSettings::default();

    // Save to file
    storage_service::save_settings(&default_settings)?;

    // Update state
    let mut settings = state.settings.lock()
        .map_err(|e| format!("설정 잠금 실패: {}", e))?;
    *settings = default_settings.clone();

    Ok(default_settings)
}
