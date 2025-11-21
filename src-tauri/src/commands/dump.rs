// commands/dump.rs
// Dump stage: Daily journal writing and reading commands
// Part of the 3-stage workflow: Dump → Feedback → Retrospect

use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, State};

use crate::models::dump::{AppendHistoryEntryPayload, HistoryState, TodayMarkdown};
use crate::services::history_service;
use crate::utils::{current_local_time, format_date_label, short_day_code};

/// Get today's markdown file
#[tauri::command]
pub fn get_today_markdown(state: State<'_, HistoryState>) -> Result<TodayMarkdown, String> {
    tracing::debug!("get_today_markdown 호출됨");
    let now = current_local_time()?;
    tracing::debug!("현재 시간: {:?}", now);
    let (file_path, date_key) = history_service::ensure_daily_file(state.inner(), &now)?;
    tracing::debug!("파일 경로: {:?}, date_key: {}", file_path, date_key);

    let mut content = fs::read_to_string(&file_path).unwrap_or_default();
    tracing::debug!("파일 내용 길이: {}", content.len());

    if content.trim().is_empty() {
        content = format!("# {}\n\n", format_date_label(&now));
        fs::write(&file_path, &content)
            .map_err(|error| format!("파일 쓰기 실패: {error}, 경로: {:?}", file_path))?;
        tracing::debug!("빈 파일에 헤더 작성 완료");
    }

    tracing::debug!(
        "get_today_markdown 완료, 내용 길이: {}",
        content.len()
    );
    Ok(TodayMarkdown {
        date_key,
        short_label: short_day_code(&now),
        header_title: format_date_label(&now),
        file_path: file_path.to_string_lossy().into_owned(),
        content,
    })
}

/// Append a history entry to today's file
#[tauri::command]
pub fn append_history_entry(
    payload: AppendHistoryEntryPayload,
    app: AppHandle,
    state: State<'_, HistoryState>,
) -> Result<(), String> {
    tracing::debug!("===== append_history_entry 호출됨 =====");
    tracing::debug!("payload 전체: {:?}", payload);
    tracing::debug!("timestamp: {}", payload.timestamp);
    tracing::debug!("task: {}", payload.task);
    tracing::debug!("is_new_minute: {}", payload.is_new_minute);
    tracing::debug!("minute_key: {:?}", payload.minute_key);

    // Append entry to file
    match history_service::append_markdown_entry(state.inner(), &payload) {
        Ok(_path) => {
            tracing::debug!("파일 저장 완료: {:?}", _path);
        }
        Err(e) => {
            tracing::error!("파일 저장 실패: {}", e);
            tracing::debug!("===== append_history_entry 실패 =====");
            return Err(e);
        }
    }

    // Emit history update event
    match history_service::emit_history_update(&app, state.inner()) {
        Ok(_) => {
            tracing::debug!("히스토리 업데이트 이벤트 발송 완료");
            tracing::debug!("===== append_history_entry 성공 =====");
            Ok(())
        }
        Err(e) => {
            tracing::error!("히스토리 업데이트 이벤트 발송 실패: {}", e);
            // File save succeeded, so just log warning and return success
            tracing::warn!("경고: 파일은 저장되었지만 이벤트 발송 실패");
            Ok(())
        }
    }
}

/// Save today's markdown content
#[tauri::command]
pub fn save_today_markdown(
    content: String,
    app: AppHandle,
    state: State<'_, HistoryState>,
) -> Result<(), String> {
    let now = current_local_time()?;
    let (file_path, _) = history_service::ensure_daily_file(state.inner(), &now)?;
    fs::write(&file_path, content).map_err(|error| error.to_string())?;
    history_service::emit_history_update(&app, state.inner())?;
    Ok(())
}

/// Read a specific dump (journal) file
#[tauri::command]
pub fn get_history_markdown(
    file_path: String,
    state: State<'_, HistoryState>,
) -> Result<String, String> {
    tracing::debug!("get_history_markdown 호출됨: {}", file_path);

    // Security: verify file is within history directory
    let requested_path = PathBuf::from(&file_path);
    let canonical_requested = requested_path
        .canonicalize()
        .map_err(|e| format!("파일 경로를 확인할 수 없습니다: {}", e))?;

    let history_dir = state
        .directory
        .canonicalize()
        .map_err(|e| format!("히스토리 디렉토리를 확인할 수 없습니다: {}", e))?;

    if !canonical_requested.starts_with(&history_dir) {
        return Err("히스토리 디렉토리 외부의 파일에는 접근할 수 없습니다".to_string());
    }

    // Read file
    fs::read_to_string(&requested_path).map_err(|error| error.to_string())
}

/// Save a specific dump (journal) file
#[tauri::command]
pub fn save_history_markdown(
    file_path: String,
    content: String,
    app: AppHandle,
    state: State<'_, HistoryState>,
) -> Result<(), String> {
    fs::write(&file_path, content).map_err(|error| error.to_string())?;
    history_service::emit_history_update(&app, state.inner())?;
    Ok(())
}
