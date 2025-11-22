// services/storage_service.rs
// File storage and retrieval service

use std::fs;
use std::path::PathBuf;

use crate::models::settings::AppSettings;

/// Get the settings file path
pub fn get_settings_path() -> Result<PathBuf, String> {
    let config_dir = tauri::api::path::config_dir()
        .ok_or_else(|| "설정 디렉토리를 찾을 수 없습니다".to_string())?;

    let app_config_dir = config_dir.join("hoego");
    fs::create_dir_all(&app_config_dir)
        .map_err(|e| format!("설정 디렉토리 생성 실패: {}", e))?;

    Ok(app_config_dir.join("settings.json"))
}

/// Load settings from file
pub fn load_settings() -> Result<AppSettings, String> {
    let settings_path = get_settings_path()?;

    if !settings_path.exists() {
        // Return default settings if file doesn't exist
        return Ok(AppSettings::default());
    }

    let content = fs::read_to_string(&settings_path)
        .map_err(|e| format!("설정 파일 읽기 실패: {}", e))?;

    let settings: AppSettings = serde_json::from_str(&content)
        .map_err(|e| format!("설정 파일 파싱 실패: {}", e))?;

    Ok(settings)
}

/// Save settings to file
pub fn save_settings(settings: &AppSettings) -> Result<(), String> {
    let settings_path = get_settings_path()?;

    let content = serde_json::to_string_pretty(settings)
        .map_err(|e| format!("설정 직렬화 실패: {}", e))?;

    fs::write(&settings_path, content)
        .map_err(|e| format!("설정 파일 저장 실패: {}", e))?;

    tracing::info!("설정 저장 완료: {:?}", settings_path);
    Ok(())
}

/// Check if this is the first launch of the app
/// Returns true if first launch, false otherwise
pub fn is_first_launch() -> bool {
    let marker_path = match get_first_launch_marker_path() {
        Ok(path) => path,
        Err(_) => return false,
    };
    !marker_path.exists()
}

/// Mark that the app has been launched (call after first launch setup)
pub fn mark_first_launch_done() -> Result<(), String> {
    let marker_path = get_first_launch_marker_path()?;
    fs::write(&marker_path, "1")
        .map_err(|e| format!("최초 실행 마커 생성 실패: {}", e))?;
    tracing::info!("최초 실행 마커 생성 완료: {:?}", marker_path);
    Ok(())
}

fn get_first_launch_marker_path() -> Result<PathBuf, String> {
    let config_dir = tauri::api::path::config_dir()
        .ok_or_else(|| "설정 디렉토리를 찾을 수 없습니다".to_string())?;
    let app_config_dir = config_dir.join("hoego");
    fs::create_dir_all(&app_config_dir)
        .map_err(|e| format!("설정 디렉토리 생성 실패: {}", e))?;
    Ok(app_config_dir.join(".first_launch_done"))
}
