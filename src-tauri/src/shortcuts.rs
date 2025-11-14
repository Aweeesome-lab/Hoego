use tauri::{AppHandle, GlobalShortcutManager, Manager};

use crate::debug_log;
use crate::window_manager::toggle_overlay;

/// 글로벌 단축키를 등록합니다
pub fn register_shortcuts(app: &AppHandle) -> Result<(), String> {
    let mut manager = app.global_shortcut_manager();
    if let Err(error) = manager.unregister_all() {
        eprintln!("[shortcut] failed to clear shortcuts: {error}");
    }

    let handle = app.clone();
    manager
        .register("CommandOrControl+J", move || {
            debug_log!("[shortcut] CommandOrControl+J fired");
            if let Some(window) = handle.get_window("main") {
                if let Err(error) = toggle_overlay(&window) {
                    eprintln!("[shortcut] toggle failed: {error}");
                }
            } else {
                debug_log!("[shortcut] no main window");
            }
        })
        .map_err(|error| error.to_string())?;
    debug_log!("[shortcut] registered CommandOrControl+J");
    Ok(())
}
