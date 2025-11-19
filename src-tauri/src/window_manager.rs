use serde::{Deserialize, Serialize};
use tauri::{AppHandle, LogicalPosition, Manager, PhysicalPosition, Position, Window};

#[cfg(target_os = "macos")]
use core_graphics::event::CGEvent;
#[cfg(target_os = "macos")]
use core_graphics::event_source::{CGEventSource, CGEventSourceStateID};

#[cfg(target_os = "macos")]
use objc::{msg_send, sel, sel_impl};

#[cfg(target_os = "macos")]
#[link(name = "ApplicationServices", kind = "framework")]
extern "C" {
    fn AXIsProcessTrusted() -> bool;
}

#[derive(Debug, Serialize, Deserialize, Clone, Copy)]
pub struct WindowPositionPayload {
    pub x: i32,
    pub y: i32,
}

/// 접근성 권한을 확인하고 필요시 안내합니다
#[cfg(target_os = "macos")]
pub fn ensure_accessibility_permission() {
    unsafe {
        if AXIsProcessTrusted() {
            tracing::info!("Accessibility permission already granted");
            return;
        }

        // Prompting with AXIsProcessTrustedWithOptions has caused regressions on macOS 15.
        // Instead of crashing the app we just log guidance for the user.
        eprintln!(
            "[shortcut] accessibility permission missing. \
            Allow \"Hoego\" under System Settings → Privacy & Security → Accessibility."
        );
    }
}

#[cfg(not(target_os = "macos"))]
pub fn ensure_accessibility_permission() {}

/// 윈도우 모서리를 둥글게 설정합니다 (macOS 전용)
#[cfg(target_os = "macos")]
#[allow(unexpected_cfgs)] // Allow false positives caused by objc's msg_send! macro under clippy
pub fn set_window_corner_radius(window: &Window) {
    unsafe {
        use objc::runtime::Object;

        if let Ok(ns_window_ptr) = window.ns_window() {
            let ns_window: *mut Object = ns_window_ptr as *mut Object;
            if ns_window.is_null() {
                return;
            }

            // contentView 가져오기
            let content_view: *mut Object = msg_send![ns_window, contentView];
            if content_view.is_null() {
                return;
            }

            // layer 활성화
            let _: () = msg_send![content_view, setWantsLayer: true];

            // layer 가져오기
            let layer: *mut Object = msg_send![content_view, layer];
            if !layer.is_null() {
                // cornerRadius 설정 (16px = 1rem)
                let radius: f64 = 16.0;
                let _: () = msg_send![layer, setCornerRadius: radius];

                // 마스크를 설정하여 라운드 처리
                let _: () = msg_send![layer, setMasksToBounds: true];
            }
        }
    }
}

#[cfg(not(target_os = "macos"))]
pub fn set_window_corner_radius(_window: &Window) {}

/// 현재 커서 위치를 반환합니다 (macOS)
#[cfg(target_os = "macos")]
fn cursor_position() -> Option<PhysicalPosition<f64>> {
    let source = CGEventSource::new(CGEventSourceStateID::HIDSystemState).ok()?;
    let event = CGEvent::new(source).ok()?;
    let location = event.location();
    Some(PhysicalPosition::new(location.x, location.y))
}

#[cfg(not(target_os = "macos"))]
fn cursor_position() -> Option<PhysicalPosition<f64>> {
    None
}

/// 오버레이 윈도우를 토글합니다
pub fn toggle_overlay(window: &Window) -> tauri::Result<()> {
    if window.is_visible()? {
        window.hide()?;
        return Ok(());
    }

    #[cfg(target_os = "macos")]
    set_window_corner_radius(window);

    // 1. 커서 위치 가져오기
    let cursor = match cursor_position() {
        Some(pos) => pos,
        None => {
            eprintln!("[hoego] 커서 위치를 가져올 수 없습니다");
            window.set_always_on_top(true)?;
            window.show()?;
            window.set_focus()?;
            return Ok(());
        }
    };
    tracing::debug!("커서: ({:.2}, {:.2})", cursor.x, cursor.y);

    // 2. 모든 모니터 가져오기
    let monitors = window.available_monitors()?;
    tracing::debug!("모니터 {}개", monitors.len());

    // 3. 커서가 위치한 모니터 찾기 (즉시)
    let mut target_monitor: Option<(i32, i32, i32, i32, f64)> = None;
    for monitor in &monitors {
        let pos = monitor.position();
        let size = monitor.size();
        let x_min = pos.x as f64;
        let x_max = x_min + size.width as f64;
        let y_min = pos.y as f64;
        let y_max = y_min + size.height as f64;

        if cursor.x >= x_min && cursor.x <= x_max && cursor.y >= y_min && cursor.y <= y_max {
            target_monitor = Some((
                pos.x,
                pos.y,
                size.width as i32,
                size.height as i32,
                monitor.scale_factor(),
            ));
            tracing::debug!(
                "커서 모니터: origin=({}, {}), size=({}, {})",
                pos.x,
                pos.y,
                size.width,
                size.height
            );
            break;
        }
    }

    // 4. 모니터를 찾지 못하면 첫 번째 모니터 사용
    let (origin_x, origin_y, width, height, scale_factor) = target_monitor.unwrap_or_else(|| {
        let first = monitors.first().expect("모니터가 없습니다");
        let pos = first.position();
        let size = first.size();
        tracing::debug!(
            "첫 번째 모니터 사용: origin=({}, {}), size=({}, {})",
            pos.x,
            pos.y,
            size.width,
            size.height
        );
        (
            pos.x,
            pos.y,
            size.width as i32,
            size.height as i32,
            first.scale_factor(),
        )
    });

    // 5. 고정 윈도우 크기로 중앙 좌표 계산 (tauri.conf.json과 동일)
    const WINDOW_WIDTH: f64 = 1000.0;
    const WINDOW_HEIGHT: f64 = 700.0;

    // 6. 모니터/창 크기를 모두 '논리 좌표계'로 변환해서 중앙 좌표 계산
    let origin_x_logical = origin_x as f64 / scale_factor;
    let origin_y_logical = origin_y as f64 / scale_factor;
    let width_logical = width as f64 / scale_factor;
    let height_logical = height as f64 / scale_factor;

    let center_x_logical = origin_x_logical + width_logical / 2.0;
    let center_y_logical = origin_y_logical + height_logical / 2.0;

    // 고정 크기를 사용하여 중앙 정렬
    let pos_x_logical = center_x_logical - WINDOW_WIDTH / 2.0;
    let pos_y_logical = center_y_logical - WINDOW_HEIGHT / 2.0;

    // 7. 최종 중앙 위치로 이동 후 표시
    window.set_position(Position::Logical(LogicalPosition::new(
        pos_x_logical.round(),
        pos_y_logical.round(),
    )))?;

    tracing::debug!(
        "창 이동 이벤트: ({}, {})",
        pos_x_logical.round(),
        pos_y_logical.round()
    );
    window.set_always_on_top(true)?;
    window.show()?;
    window.set_focus()?;

    Ok(())
}

/// 설정 윈도우를 엽니다
pub fn open_settings_window(app: &AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_window("settings") {
        // 이미 존재하는 창이 있으면 표시
        window.set_always_on_top(true).map_err(|e| e.to_string())?;
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
    } else {
        // 창이 없으면 새로 생성
        tauri::WindowBuilder::new(
            app,
            "settings",
            tauri::WindowUrl::App("index.html#settings".into()),
        )
        .title("설정")
        .inner_size(900.0, 700.0)
        .resizable(true)
        .decorations(true)
        .center()
        .always_on_top(true)
        .skip_taskbar(false)
        .visible(true)
        .focused(true)
        .build()
        .map_err(|e| e.to_string())?;
    }
    Ok(())
}

// Tauri Commands

#[tauri::command]
pub fn hide_main_window(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_window("main") {
        window.hide().map_err(|error| error.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn toggle_overlay_window(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_window("main") {
        toggle_overlay(&window).map_err(|error| error.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn set_window_position(app: AppHandle, position: WindowPositionPayload) -> Result<(), String> {
    if let Some(window) = app.get_window("main") {
        window
            .set_position(Position::Physical(PhysicalPosition::new(
                position.x, position.y,
            )))
            .map_err(|error| error.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn get_window_position(app: AppHandle) -> Result<Option<WindowPositionPayload>, String> {
    if let Some(window) = app.get_window("main") {
        match window.outer_position() {
            Ok(pos) => {
                return Ok(Some(WindowPositionPayload { x: pos.x, y: pos.y }));
            }
            Err(error) => {
                eprintln!("[hoego] window.outer_position 실패: {}", error);
                return Err(error.to_string());
            }
        }
    }
    Ok(None)
}

#[tauri::command]
pub fn open_llm_settings(app: AppHandle) -> Result<(), String> {
    open_settings_window(&app)
}

#[tauri::command]
pub fn open_settings_window_command(app: AppHandle) -> Result<(), String> {
    open_settings_window(&app)
}
