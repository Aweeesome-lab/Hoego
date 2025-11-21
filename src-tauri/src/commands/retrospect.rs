// commands/retrospect.rs
// Retrospect (reflection) command handlers

use std::fs;
use tauri::State;

use crate::models::dump::HistoryState;
use crate::services::history_service;

/// Get retrospect markdown for a specific date
#[tauri::command]
pub fn get_retrospect_markdown(
    date_key: String,
    state: State<'_, HistoryState>,
) -> Result<String, String> {
    tracing::debug!("get_retrospect_markdown 호출됨: {}", date_key);

    history_service::ensure_history_dir(&state.directory)?;

    let filename = format!("{}.retro.md", date_key);
    let file_path = state.directory.join(&filename);

    if !file_path.exists() {
        tracing::debug!("회고 파일이 없음: {:?}", file_path);
        return Ok(String::new());
    }

    fs::read_to_string(&file_path).map_err(|error| {
        format!("회고 파일 읽기 실패: {}, 경로: {:?}", error, file_path)
    })
}

/// Save retrospect markdown for a specific date
#[tauri::command]
pub fn save_retrospect_markdown(
    date_key: String,
    content: String,
    state: State<'_, HistoryState>,
) -> Result<(), String> {
    tracing::debug!("save_retrospect_markdown 호출됨: {}", date_key);

    history_service::ensure_history_dir(&state.directory)?;

    let filename = format!("{}.retro.md", date_key);
    let file_path = state.directory.join(&filename);

    fs::write(&file_path, content).map_err(|error| {
        format!("회고 파일 저장 실패: {}, 경로: {:?}", error, file_path)
    })?;

    tracing::debug!("회고 저장 완료: {:?}", file_path);
    Ok(())
}
