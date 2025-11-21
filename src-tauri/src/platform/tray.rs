use tauri::{
    AppHandle, CustomMenuItem, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu,
    SystemTrayMenuItem,
};

use crate::history::HistoryState;
use crate::platform::window_manager::{open_settings_window, toggle_overlay};

/// 시스템 트레이를 생성합니다
pub fn build_tray() -> SystemTray {
    let toggle_overlay = CustomMenuItem::new("toggle_overlay", "오버레이 열기");
    let open_history_folder = CustomMenuItem::new("open_history_folder", "히스토리 폴더 열기");
    let ai_settings = CustomMenuItem::new("ai_settings", "설정");
    let quit = CustomMenuItem::new("quit", "종료");

    let menu = SystemTrayMenu::new()
        .add_item(toggle_overlay)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(open_history_folder)
        .add_item(ai_settings)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(quit);

    SystemTray::new().with_menu(menu)
}

/// 시스템 트레이 이벤트를 처리합니다
pub fn handle_tray_event(app: &AppHandle, event: SystemTrayEvent) {
    match event {
        SystemTrayEvent::LeftClick { .. } | SystemTrayEvent::DoubleClick { .. } => {
            if let Some(window) = app.get_window("main") {
                let _ = toggle_overlay(&window);
            }
        }
        SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
            "toggle_overlay" => {
                if let Some(window) = app.get_window("main") {
                    let _ = toggle_overlay(&window);
                }
            }
            "open_history_folder" => {
                if let Some(state) = app.try_state::<HistoryState>() {
                    let target = state.directory.to_string_lossy().to_string();
                    tracing::info!("히스토리 폴더 열기: {}", target);
                    if let Err(error) = tauri::api::shell::open(&app.shell_scope(), target, None) {
                        tracing::error!("폴더 열기 실패: {}", error);
                    }
                }
            }
            "ai_settings" => {
                if let Err(e) = open_settings_window(app) {
                    tracing::error!("Failed to open AI settings: {}", e);
                }
            }
            "quit" => app.exit(0),
            _ => {}
        },
        _ => {}
    }
}
