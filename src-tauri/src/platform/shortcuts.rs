use tauri::{AppHandle, GlobalShortcutManager, Manager};

use crate::models::settings::AppSettingsState;
use crate::platform::window_manager::{open_settings_window, toggle_overlay};

/// 단축키가 사용 가능한지 테스트합니다 (충돌 검사)
#[tauri::command]
pub fn test_shortcut_available(app: AppHandle, shortcut: String) -> Result<bool, String> {
    let mut manager = app.global_shortcut_manager();

    // 임시로 등록 시도
    let test_result = manager.register(&shortcut, || {
        // 아무것도 하지 않음 (테스트용)
    });

    match test_result {
        Ok(_) => {
            // 등록 성공 - 즉시 해제하고 사용 가능으로 반환
            let _ = manager.unregister(&shortcut);
            Ok(true)
        }
        Err(e) => {
            // 등록 실패 - 이미 사용 중
            tracing::warn!("단축키 {} 사용 불가: {}", shortcut, e);
            Ok(false)
        }
    }
}

/// 글로벌 단축키를 등록합니다 (빠른 메모 윈도우 토글)
pub fn register_shortcuts(app: &AppHandle) -> Result<(), String> {
    tracing::debug!("단축키 등록 시작");

    let mut manager = app.global_shortcut_manager();

    // 기존 단축키 모두 해제
    if let Err(error) = manager.unregister_all() {
        tracing::warn!("기존 단축키 해제 실패 (무시됨): {}", error);
    }

    // 설정에서 단축키 가져오기
    let shortcut = if let Some(settings_state) = app.try_state::<AppSettingsState>() {
        settings_state
            .settings
            .lock()
            .map(|s| s.quick_note_shortcut.clone())
            .unwrap_or_else(|e| {
                tracing::error!("설정 잠금 실패: {}", e);
                "CommandOrControl+J".to_string()
            })
    } else {
        tracing::warn!("설정 상태를 찾을 수 없음, 기본값 사용");
        "CommandOrControl+J".to_string()
    };

    tracing::debug!("단축키 등록 시도: {}", shortcut);

    let handle = app.clone();
    let shortcut_display = shortcut.clone();

    // 단축키 등록
    match manager.register(&shortcut, move || {
        tracing::debug!("{} fired - 빠른 메모 토글", shortcut_display);
        if let Some(window) = handle.get_window("main") {
            if let Err(error) = toggle_overlay(&window) {
                tracing::error!("빠른 메모 토글 실패: {}", error);
            }
        } else {
            tracing::warn!("No main window found");
        }
    }) {
        Ok(_) => {
            tracing::info!("단축키 등록 성공: {}", shortcut);
        }
        Err(error) => {
            tracing::error!("단축키 등록 실패: {}", error);
            return Err(format!("'{}' 단축키를 등록할 수 없습니다. 이미 다른 앱에서 사용 중이거나 시스템 단축키일 수 있습니다", shortcut));
        }
    }

    // 설정 창 단축키 (Cmd+,)
    let settings_handle = app.clone();
    if let Err(e) = manager.register("CommandOrControl+,", move || {
        tracing::debug!("Cmd+, fired - 설정 창 열기");
        if let Err(error) = open_settings_window(&settings_handle) {
            tracing::error!("설정 창 열기 실패: {}", error);
        }
    }) {
        tracing::warn!("설정 단축키 등록 실패 (무시됨): {}", e);
    }

    Ok(())
}
