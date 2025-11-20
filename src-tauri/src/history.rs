use serde::{Deserialize, Serialize};
use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager, State};
use time::format_description::well_known::Rfc3339;
use time::{OffsetDateTime, UtcOffset};

use crate::utils::*;

pub struct HistoryState {
    pub directory: PathBuf,
}

impl Default for HistoryState {
    fn default() -> Self {
        Self {
            directory: history_directory_path().unwrap_or_else(|_| PathBuf::from("history")),
        }
    }
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppendHistoryEntryPayload {
    pub timestamp: String,
    #[allow(dead_code)]
    pub minute_key: Option<String>,
    pub task: String,
    #[allow(dead_code)]
    pub is_new_minute: bool,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct HistoryFileInfo {
    pub date: String,
    pub title: String,
    pub preview: Option<String>,
    pub filename: String,
    pub path: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct HistoryOverview {
    pub directory: String,
    pub files: Vec<HistoryFileInfo>,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct TodayMarkdown {
    pub date_key: String,
    pub short_label: String,
    pub header_title: String,
    pub file_path: String,
    pub content: String,
}

/// 히스토리 디렉토리를 생성합니다
pub fn ensure_history_dir(path: &Path) -> Result<(), String> {
    tracing::debug!("ensure_history_dir: {:?}", path);
    fs::create_dir_all(path)
        .map_err(|error| format!("디렉토리 생성 실패: {error}, 경로: {:?}", path))?;
    tracing::debug!("디렉토리 확인/생성 완료: {:?}", path);
    Ok(())
}

/// 일일 파일을 생성하거나 확인합니다
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

/// 마크다운 항목을 추가합니다
fn append_markdown_entry(
    state: &HistoryState,
    payload: &AppendHistoryEntryPayload,
) -> Result<PathBuf, String> {
    tracing::debug!("append_markdown_entry 시작");
    tracing::debug!("timestamp 문자열: {}", payload.timestamp);

    // ISO 8601 형식 파싱
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

    // 일일 파일 확인/생성
    let (file_path, _) = ensure_daily_file(state, &kst_timestamp)?;
    tracing::debug!("파일 경로: {:?}", file_path);
    tracing::debug!("작업 내용: {}", payload.task);
    tracing::debug!("새 분 여부: {}", payload.is_new_minute);

    // 파일 열기 (추가 모드)
    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&file_path)
        .map_err(|error| format!("파일 열기 실패: {error}, 경로: {:?}", file_path))?;

    // 작업 항목 추가
    writeln!(file, "- {} ({})", payload.task, time_label_with_seconds)
        .map_err(|error| format!("작업 쓰기 실패: {error}"))?;

    // 파일 버퍼 플러시
    file.flush()
        .map_err(|error| format!("파일 flush 실패: {error}"))?;

    tracing::debug!("항목 추가 완료: {}", payload.task);
    tracing::debug!("append_markdown_entry 성공");

    Ok(file_path)
}

/// 히스토리 목록을 수집합니다
fn collect_history(state: &HistoryState) -> Result<HistoryOverview, String> {
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
                let content = fs::read_to_string(&path).ok()?;
                let lines: Vec<&str> = content.lines().collect();
                let title = lines
                    .iter()
                    .find(|line| line.starts_with('#'))
                    .map(|line| line.trim_start_matches('#').trim())
                    .unwrap_or(&filename);
                let preview = lines
                    .iter()
                    .find(|line| line.starts_with("- "))
                    .map(|line| line.trim_start_matches("- ").trim().to_string());

                let date = filename.trim_end_matches(".md").to_string();
                Some(HistoryFileInfo {
                    date,
                    title: title.to_string(),
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

/// 히스토리 업데이트 이벤트를 발생시킵니다
pub fn emit_history_update(app: &AppHandle) -> Result<(), String> {
    let state = app.state::<HistoryState>();
    let overview = collect_history(&state)?;
    app.emit_all("history_updated", overview)
        .map_err(|error| error.to_string())
}

// Tauri Commands

#[tauri::command]
pub fn get_today_markdown(state: State<'_, HistoryState>) -> Result<TodayMarkdown, String> {
    tracing::debug!("get_today_markdown 호출됨");
    let now = current_local_time()?;
    tracing::debug!("현재 시간: {:?}", now);
    let (file_path, date_key) = ensure_daily_file(state.inner(), &now)?;
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

    // 파일에 항목 추가
    match append_markdown_entry(state.inner(), &payload) {
        Ok(_path) => {
            tracing::debug!("파일 저장 완료: {:?}", _path);
        }
        Err(e) => {
            tracing::error!("파일 저장 실패: {}", e);
            tracing::debug!("===== append_history_entry 실패 =====");
            return Err(e);
        }
    }

    // 히스토리 업데이트 이벤트 발송
    match emit_history_update(&app) {
        Ok(_) => {
            tracing::debug!("히스토리 업데이트 이벤트 발송 완료");
            tracing::debug!("===== append_history_entry 성공 =====");
            Ok(())
        }
        Err(e) => {
            tracing::error!("히스토리 업데이트 이벤트 발송 실패: {}", e);
            // 파일 저장은 성공했으므로 경고만 출력하고 성공으로 처리
            tracing::warn!("경고: 파일은 저장되었지만 이벤트 발송 실패");
            Ok(())
        }
    }
}

#[tauri::command]
pub fn save_today_markdown(
    content: String,
    app: AppHandle,
    state: State<'_, HistoryState>,
) -> Result<(), String> {
    let now = current_local_time()?;
    let (file_path, _) = ensure_daily_file(state.inner(), &now)?;
    fs::write(&file_path, content).map_err(|error| error.to_string())?;
    emit_history_update(&app)?;
    Ok(())
}

#[tauri::command]
pub fn save_history_markdown(
    file_path: String,
    content: String,
    app: AppHandle,
) -> Result<(), String> {
    fs::write(&file_path, content).map_err(|error| error.to_string())?;
    emit_history_update(&app)?;
    Ok(())
}

#[tauri::command]
pub fn list_history(state: State<'_, HistoryState>) -> Result<HistoryOverview, String> {
    collect_history(state.inner())
}

#[tauri::command]
pub fn open_history_folder(app: AppHandle, state: State<'_, HistoryState>) -> Result<(), String> {
    ensure_history_dir(&state.directory)?;
    let target = state.directory.to_string_lossy().to_string();
    tauri::api::shell::open(&app.shell_scope(), target, None).map_err(|error| error.to_string())
}

/// 특정 날짜의 마크다운 파일을 읽어옵니다
#[tauri::command]
pub fn get_history_markdown(
    file_path: String,
    state: State<'_, HistoryState>,
) -> Result<String, String> {
    tracing::debug!("get_history_markdown 호출됨: {}", file_path);

    // 보안: 파일이 히스토리 디렉토리 내에 있는지 확인
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

    // 파일 읽기
    fs::read_to_string(&requested_path).map_err(|error| error.to_string())
}

/// 특정 날짜의 회고 파일을 읽어옵니다
#[tauri::command]
pub fn get_retrospect_markdown(
    date_key: String,
    state: State<'_, HistoryState>,
) -> Result<String, String> {
    tracing::debug!("get_retrospect_markdown 호출됨: {}", date_key);

    ensure_history_dir(&state.directory)?;

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

/// 특정 날짜의 회고를 저장합니다
#[tauri::command]
pub fn save_retrospect_markdown(
    date_key: String,
    content: String,
    state: State<'_, HistoryState>,
) -> Result<(), String> {
    tracing::debug!("save_retrospect_markdown 호출됨: {}", date_key);

    ensure_history_dir(&state.directory)?;

    let filename = format!("{}.retro.md", date_key);
    let file_path = state.directory.join(&filename);

    fs::write(&file_path, content).map_err(|error| {
        format!("회고 파일 저장 실패: {}, 경로: {:?}", error, file_path)
    })?;

    tracing::debug!("회고 저장 완료: {:?}", file_path);
    Ok(())
}
