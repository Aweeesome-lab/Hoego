use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, State};

/// 앱 설정
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    /// 빠른 메모 단축키 (예: "CommandOrControl+J")
    pub quick_note_shortcut: String,

    /// 문서 저장 위치 (절대 경로)
    pub documents_path: String,
}

impl Default for AppSettings {
    fn default() -> Self {
        let default_path = tauri::api::path::document_dir()
            .and_then(|mut p| {
                p.push("Hoego");
                p.push("history");
                Some(p.to_string_lossy().to_string())
            })
            .unwrap_or_else(|| "~/Documents/Hoego/history".to_string());

        Self {
            quick_note_shortcut: "CommandOrControl+J".to_string(),
            documents_path: default_path,
        }
    }
}

pub struct AppSettingsState {
    pub settings: std::sync::Mutex<AppSettings>,
}

impl AppSettingsState {
    pub fn new() -> Self {
        Self {
            settings: std::sync::Mutex::new(AppSettings::default()),
        }
    }
}

/// 설정 파일 경로를 반환합니다
fn get_settings_path() -> Result<PathBuf, String> {
    let config_dir = tauri::api::path::config_dir()
        .ok_or_else(|| "설정 디렉토리를 찾을 수 없습니다".to_string())?;

    let app_config_dir = config_dir.join("hoego");
    fs::create_dir_all(&app_config_dir)
        .map_err(|e| format!("설정 디렉토리 생성 실패: {}", e))?;

    Ok(app_config_dir.join("settings.json"))
}

/// 설정을 파일에서 로드합니다
pub fn load_settings() -> Result<AppSettings, String> {
    let settings_path = get_settings_path()?;

    if !settings_path.exists() {
        // 설정 파일이 없으면 기본값 반환
        return Ok(AppSettings::default());
    }

    let content = fs::read_to_string(&settings_path)
        .map_err(|e| format!("설정 파일 읽기 실패: {}", e))?;

    let settings: AppSettings = serde_json::from_str(&content)
        .map_err(|e| format!("설정 파일 파싱 실패: {}", e))?;

    Ok(settings)
}

/// 설정을 파일에 저장합니다
pub fn save_settings(settings: &AppSettings) -> Result<(), String> {
    let settings_path = get_settings_path()?;

    let content = serde_json::to_string_pretty(settings)
        .map_err(|e| format!("설정 직렬화 실패: {}", e))?;

    fs::write(&settings_path, content)
        .map_err(|e| format!("설정 파일 저장 실패: {}", e))?;

    tracing::info!("설정 저장 완료: {:?}", settings_path);
    Ok(())
}

// Tauri Commands

#[tauri::command]
pub fn get_app_settings(state: State<'_, AppSettingsState>) -> Result<AppSettings, String> {
    let settings = state.settings.lock()
        .map_err(|e| format!("설정 잠금 실패: {}", e))?;
    Ok(settings.clone())
}

#[tauri::command]
pub fn update_app_settings(
    settings: AppSettings,
    state: State<'_, AppSettingsState>,
) -> Result<(), String> {
    // 설정 저장
    save_settings(&settings)?;

    // 상태 업데이트
    let mut current_settings = state.settings.lock()
        .map_err(|e| format!("설정 잠금 실패: {}", e))?;
    *current_settings = settings;

    Ok(())
}

#[tauri::command]
pub fn update_quick_note_shortcut(
    app: AppHandle,
    shortcut: String,
    state: State<'_, AppSettingsState>,
) -> Result<(), String> {
    // 설정 업데이트
    let mut settings = state.settings.lock()
        .map_err(|e| format!("설정 잠금 실패: {}", e))?;
    settings.quick_note_shortcut = shortcut.clone();

    // 파일에 저장
    save_settings(&settings)?;

    // 명시적으로 mutex 해제
    drop(settings);

    // 단축키 재등록 - 실패해도 설정은 저장됨
    if let Err(e) = crate::shortcuts::register_shortcuts(&app) {
        tracing::warn!("단축키 재등록 실패: {}", e);
        // 실패 메시지를 반환하되, 설정은 이미 저장되었음을 명시
        return Err(format!("단축키 등록 실패: {}. 설정은 저장되었습니다. 다른 단축키를 시도해보세요.", e));
    }

    tracing::info!("단축키 변경 및 재등록 완료: {}", shortcut);
    Ok(())
}

#[tauri::command]
pub fn update_documents_path(
    path: String,
    state: State<'_, AppSettingsState>,
) -> Result<(), String> {
    // 경로 유효성 검사
    let path_buf = PathBuf::from(&path);
    if !path_buf.exists() {
        fs::create_dir_all(&path_buf)
            .map_err(|e| format!("디렉토리 생성 실패: {}", e))?;
    }

    // 설정 업데이트
    let mut settings = state.settings.lock()
        .map_err(|e| format!("설정 잠금 실패: {}", e))?;
    settings.documents_path = path;

    // 파일에 저장
    save_settings(&settings)?;

    Ok(())
}

#[tauri::command]
pub fn reset_app_settings(state: State<'_, AppSettingsState>) -> Result<AppSettings, String> {
    let default_settings = AppSettings::default();

    // 파일에 저장
    save_settings(&default_settings)?;

    // 상태 업데이트
    let mut settings = state.settings.lock()
        .map_err(|e| format!("설정 잠금 실패: {}", e))?;
    *settings = default_settings.clone();

    Ok(default_settings)
}
