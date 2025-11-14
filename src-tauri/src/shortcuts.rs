use tauri::{AppHandle, GlobalShortcutManager, Manager};

use crate::window_manager::toggle_overlay;

/// 글로벌 단축키를 등록합니다
pub fn register_shortcuts(app: &AppHandle) -> Result<(), String> {
    let mut manager = app.global_shortcut_manager();
    if let Err(error) = manager.unregister_all() {
        tracing::warn!("Failed to clear shortcuts: {error}");
    }

    let handle = app.clone();
    manager
        .register("CommandOrControl+J", move || {
            tracing::debug!("CommandOrControl+J fired");
            if let Some(window) = handle.get_window("main") {
                if let Err(error) = toggle_overlay(&window) {
                    tracing::error!("Toggle failed: {error}");
                }
            } else {
                tracing::warn!("No main window found");
            }
        })
        .map_err(|error| error.to_string())?;
    tracing::info!("Registered CommandOrControl+J shortcut");
    Ok(())
}
