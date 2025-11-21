// services/history_service.rs
// Daily dump and history management service

use crate::models::dump::{AppendHistoryEntryPayload, HistoryFileInfo, HistoryOverview, HistoryState};
use crate::utils::*;
use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager};
use time::format_description::well_known::Rfc3339;
use time::{OffsetDateTime, UtcOffset};

/// Creates the history directory if it doesn't exist
pub fn ensure_history_dir(path: &Path) -> Result<(), String> {
    tracing::debug!("ensure_history_dir: {:?}", path);
    fs::create_dir_all(path)
        .map_err(|error| format!("디렉토리 생성 실패: {error}, 경로: {:?}", path))?;
    tracing::debug!("디렉토리 확인/생성 완료: {:?}", path);
    Ok(())
}

/// Creates or ensures a daily file exists for the given timestamp
pub fn ensure_daily_file(
    state: &HistoryState,
    timestamp: &OffsetDateTime,
) -> Result<(PathBuf, String), String> {
    tracing::debug!("히스토리 디렉토리: {:?}", state.directory);
    ensure_history_dir(&state.directory)?;

    let date_key = format_date_key(timestamp)?;
    let filename = format!("{date_key}.md");
    let file_path = state.directory.join(filename);

    tracing::debug!("파일 경로 확인: {:?}", file_path);

    if !file_path.exists() {
        let header = format!("# {}\n\n", format_date_label(timestamp));
        fs::write(&file_path, header)
            .map_err(|error| format!("파일 생성 실패: {error}, 경로: {:?}", file_path))?;
        tracing::debug!("새 파일 생성: {:?}", file_path);
    } else {
        tracing::debug!("기존 파일 사용: {:?}", file_path);
    }

    Ok((file_path, date_key))
}

/// Appends a markdown entry to the daily file
pub fn append_markdown_entry(
    state: &HistoryState,
    payload: &AppendHistoryEntryPayload,
) -> Result<PathBuf, String> {
    tracing::debug!("append_markdown_entry 시작");
    tracing::debug!("timestamp 문자열: {}", payload.timestamp);

    // Parse ISO 8601 format
    let timestamp = OffsetDateTime::parse(&payload.timestamp, &Rfc3339).map_err(|error| {
        format!(
            "잘못된 시간 형식입니다: {error}, 입력값: {}",
            payload.timestamp
        )
    })?;

    tracing::debug!("파싱된 시간(UTC): {:?}", timestamp);

    let kst_offset =
        UtcOffset::from_hms(9, 0, 0).map_err(|error| format!("KST 오프셋 계산 실패: {error}"))?;

    let kst_timestamp = timestamp.to_offset(kst_offset);
    tracing::debug!("변환된 시간(KST): {:?}", kst_timestamp);

    let time_label_with_seconds = format_time_with_seconds(&kst_timestamp)?;
    tracing::debug!("시간 레이블(초 포함): {}", time_label_with_seconds);

    // Ensure daily file exists
    let (file_path, _) = ensure_daily_file(state, &kst_timestamp)?;
    tracing::debug!("파일 경로: {:?}", file_path);
    tracing::debug!("작업 내용: {}", payload.task);
    tracing::debug!("새 분 여부: {}", payload.is_new_minute);

    // Open file in append mode
    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&file_path)
        .map_err(|error| format!("파일 열기 실패: {error}, 경로: {:?}", file_path))?;

    // Append task entry
    writeln!(file, "- {} ({})", payload.task, time_label_with_seconds)
        .map_err(|error| format!("작업 쓰기 실패: {error}"))?;

    // Flush file buffer
    file.flush()
        .map_err(|error| format!("파일 flush 실패: {error}"))?;

    tracing::debug!("항목 추가 완료: {}", payload.task);
    tracing::debug!("append_markdown_entry 성공");

    Ok(file_path)
}

/// Collects all history files from the directory
pub fn collect_history(state: &HistoryState) -> Result<HistoryOverview, String> {
    ensure_history_dir(&state.directory)?;

    let mut entries: Vec<HistoryFileInfo> = fs::read_dir(&state.directory)
        .map_err(|error| error.to_string())?
        .filter_map(|entry| match entry {
            Ok(entry) => {
                let path = entry.path();
                if path.extension().and_then(|e| e.to_str()) != Some("md") {
                    return None;
                }
                let filename = entry.file_name().to_string_lossy().into_owned();

                // Extract date key (remove .md from filename)
                let date = filename.trim_end_matches(".md").to_string();

                // Generate date label based on filename
                let title = parse_date_key(&date)
                    .map(|dt| format_date_label(&dt))
                    .unwrap_or_else(|_| date.clone());

                // Extract preview (first list item)
                let content = fs::read_to_string(&path).ok()?;
                let lines: Vec<&str> = content.lines().collect();
                let preview = lines
                    .iter()
                    .find(|line| line.starts_with("- "))
                    .map(|line| line.trim_start_matches("- ").trim().to_string());

                Some(HistoryFileInfo {
                    date,
                    title,
                    preview,
                    filename,
                    path: path.to_string_lossy().into_owned(),
                })
            }
            Err(_) => None,
        })
        .collect();

    entries.sort_by(|a, b| b.filename.cmp(&a.filename));

    Ok(HistoryOverview {
        directory: state.directory.to_string_lossy().into_owned(),
        files: entries,
    })
}

/// Emits a history update event to the app
pub fn emit_history_update(app: &AppHandle, state: &HistoryState) -> Result<(), String> {
    let overview = collect_history(state)?;
    app.emit_all("history_updated", overview)
        .map_err(|error| error.to_string())
}
