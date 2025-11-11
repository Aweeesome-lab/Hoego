mod llm;

use serde::{Deserialize, Serialize};
use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use tauri::api::shell;
use tauri::{
    AppHandle, CustomMenuItem, GlobalShortcutManager, LogicalPosition, Manager, PhysicalPosition,
    Position, State, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem, Window,
    WindowEvent,
};
use time::format_description::well_known::Rfc3339;
use time::macros::format_description;
use time::{OffsetDateTime, UtcOffset, Weekday};

#[cfg(target_os = "macos")]
use core_foundation::{base::TCFType, boolean::CFBoolean};
#[cfg(target_os = "macos")]
use core_foundation_sys::{
    base::{CFRelease, CFTypeRef},
    dictionary::{
        kCFTypeDictionaryKeyCallBacks, kCFTypeDictionaryValueCallBacks, CFDictionaryCreate,
        CFDictionaryRef,
    },
    string::{kCFStringEncodingUTF8, CFStringCreateWithCString},
};
#[cfg(target_os = "macos")]
use core_graphics::event::CGEvent;
#[cfg(target_os = "macos")]
use core_graphics::event_source::{CGEventSource, CGEventSourceStateID};
#[cfg(target_os = "macos")]
use std::{ffi::CString, ptr};

#[cfg(target_os = "macos")]
use objc::{msg_send, sel, sel_impl};

#[cfg(target_os = "macos")]
#[link(name = "ApplicationServices", kind = "framework")]
extern "C" {
    fn AXIsProcessTrusted() -> bool;
    fn AXIsProcessTrustedWithOptions(options: CFDictionaryRef) -> u8;
}

struct HistoryState {
    directory: PathBuf,
}

// Debug logging macro disabled: avoid stdout noise
macro_rules! debug_log {
    ($($arg:tt)*) => {{}};
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct AppendHistoryEntryPayload {
    timestamp: String,
    #[allow(dead_code)]
    minute_key: Option<String>,
    task: String,
    #[allow(dead_code)]
    is_new_minute: bool,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct HistoryFileInfo {
    date: String,
    title: String,
    preview: Option<String>,
    filename: String,
    path: String,
}

#[derive(Debug, Serialize, Clone)]
struct HistoryOverview {
    directory: String,
    files: Vec<HistoryFileInfo>,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct TodayMarkdown {
    date_key: String,
    short_label: String,
    header_title: String,
    file_path: String,
    content: String,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct AiSummaryFile {
    filename: String,
    path: String,
    created_at: Option<String>,
    content: String,
}

#[derive(Debug, Serialize, Deserialize, Clone, Copy)]
struct WindowPositionPayload {
    x: i32,
    y: i32,
}

// overlay 창의 기본 논리 크기 (tauri.conf.json과 동일하게 유지)
const OVERLAY_LOGICAL_WIDTH: f64 = 800.0;
const OVERLAY_LOGICAL_HEIGHT: f64 = 600.0;

#[cfg(target_os = "macos")]
fn ensure_accessibility_permission() {
    unsafe {
        if AXIsProcessTrusted() {
            debug_log!("[shortcut] accessibility permission already granted");
            return;
        }

        let key_cstr = match CString::new("kAXTrustedCheckOptionPrompt") {
            Ok(value) => value,
            Err(error) => {
                eprintln!("[shortcut] failed to build accessibility key: {error}");
                return;
            }
        };

        let key = CFStringCreateWithCString(ptr::null(), key_cstr.as_ptr(), kCFStringEncodingUTF8);
        if key.is_null() {
            eprintln!("[shortcut] failed to create accessibility key string");
            return;
        }

        let keys = [key as *const _];
        let values = [CFBoolean::true_value().as_concrete_TypeRef() as CFTypeRef];

        let options = CFDictionaryCreate(
            ptr::null(),
            keys.as_ptr(),
            values.as_ptr(),
            1,
            &kCFTypeDictionaryKeyCallBacks,
            &kCFTypeDictionaryValueCallBacks,
        );

        if options.is_null() {
            eprintln!("[shortcut] failed to create accessibility options dictionary");
            CFRelease(key as _);
            return;
        }

        let trusted = AXIsProcessTrustedWithOptions(options) != 0;

        CFRelease(options as _);
        CFRelease(key as _);

        if trusted {
            debug_log!("[shortcut] accessibility permission granted after prompt");
        } else {
            eprintln!("[shortcut] accessibility permission missing. Allow this app under System Settings → Privacy & Security → Accessibility.");
        }
    }
}

#[cfg(not(target_os = "macos"))]
fn ensure_accessibility_permission() {}

#[cfg(target_os = "macos")]
#[allow(unexpected_cfgs)] // Allow false positives caused by objc's msg_send! macro under clippy
fn set_window_corner_radius(window: &Window) {
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
fn set_window_corner_radius(_window: &Window) {}

fn history_directory_path() -> Result<PathBuf, String> {
    let mut base = tauri::api::path::document_dir().ok_or("문서 폴더를 찾을 수 없습니다")?;
    base.push("OTRA");
    base.push("history");
    Ok(base)
}

fn summaries_directory_path() -> Result<PathBuf, String> {
    let mut base = tauri::api::path::document_dir().ok_or("문서 폴더를 찾을 수 없습니다")?;
    base.push("OTRA");
    base.push("summaries");
    Ok(base)
}

fn ensure_history_dir(path: &Path) -> Result<(), String> {
    debug_log!("[otra] ensure_history_dir: {:?}", path);
    fs::create_dir_all(path)
        .map_err(|error| format!("디렉토리 생성 실패: {error}, 경로: {:?}", path))?;
    debug_log!("[otra] 디렉토리 확인/생성 완료: {:?}", path);
    Ok(())
}

fn ensure_summaries_dir(path: &Path) -> Result<(), String> {
    fs::create_dir_all(path)
        .map_err(|error| format!("AI 요약 디렉토리 생성 실패: {error}, 경로: {:?}", path))
}


fn write_ai_summary_file(date: &OffsetDateTime, content: &str) -> Result<AiSummaryFile, String> {
    let dir = summaries_directory_path()?;
    ensure_summaries_dir(&dir)?;

    let date_key = date
        .format(&format_description!(
            "[year][month][day]-[hour][minute][second]"
        ))
        .map_err(|error| error.to_string())?;

    let mut filename = format!("ai-feedback-{date_key}.md");
    let mut path = dir.join(&filename);
    let mut suffix = 1;

    while path.exists() {
        filename = format!("ai-feedback-{date_key}-{suffix}.md");
        path = dir.join(&filename);
        suffix += 1;
    }

    fs::write(&path, content.as_bytes()).map_err(|error| format!("AI 요약 저장 실패: {error}"))?;

    let created_at = date.format(&Rfc3339).ok();

    Ok(AiSummaryFile {
        filename,
        path: path.to_string_lossy().into_owned(),
        created_at,
        content: content.to_string(),
    })
}

fn format_date_label(date: &OffsetDateTime) -> String {
    let weekday = match date.weekday() {
        Weekday::Monday => "월요일",
        Weekday::Tuesday => "화요일",
        Weekday::Wednesday => "수요일",
        Weekday::Thursday => "목요일",
        Weekday::Friday => "금요일",
        Weekday::Saturday => "토요일",
        Weekday::Sunday => "일요일",
    };

    format!(
        "{}년 {}월 {}일 {}",
        date.year(),
        date.month() as u8,
        date.day(),
        weekday
    )
}

fn short_weekday_label(date: &OffsetDateTime) -> &'static str {
    match date.weekday() {
        Weekday::Monday => "월",
        Weekday::Tuesday => "화",
        Weekday::Wednesday => "수",
        Weekday::Thursday => "목",
        Weekday::Friday => "금",
        Weekday::Saturday => "토",
        Weekday::Sunday => "일",
    }
}

fn ensure_daily_file(
    state: &HistoryState,
    timestamp: &OffsetDateTime,
) -> Result<(PathBuf, String), String> {
    debug_log!("[otra] 히스토리 디렉토리: {:?}", state.directory);
    ensure_history_dir(&state.directory)?;

    let date_key = timestamp
        .format(&format_description!("[year][month][day]"))
        .map_err(|error| error.to_string())?;
    let filename = format!("{date_key}.md");
    let file_path = state.directory.join(filename);

    debug_log!("[otra] 파일 경로 확인: {:?}", file_path);

    if !file_path.exists() {
        let header = format!("# {}\n\n", format_date_label(timestamp));
        fs::write(&file_path, header)
            .map_err(|error| format!("파일 생성 실패: {error}, 경로: {:?}", file_path))?;
        debug_log!("[otra] 새 파일 생성: {:?}", file_path);
    } else {
        debug_log!("[otra] 기존 파일 사용: {:?}", file_path);
    }

    Ok((file_path, date_key))
}

fn current_local_time() -> Result<OffsetDateTime, String> {
    OffsetDateTime::now_local().map_err(|error| error.to_string())
}

fn append_markdown_entry(
    state: &HistoryState,
    payload: &AppendHistoryEntryPayload,
) -> Result<PathBuf, String> {
    debug_log!("[otra] append_markdown_entry 시작");
    debug_log!("[otra] timestamp 문자열: {}", payload.timestamp);

    // ISO 8601 형식 파싱
    let timestamp = OffsetDateTime::parse(&payload.timestamp, &Rfc3339).map_err(|error| {
        format!(
            "잘못된 시간 형식입니다: {error}, 입력값: {}",
            payload.timestamp
        )
    })?;

    debug_log!("[otra] 파싱된 시간(UTC): {:?}", timestamp);

    let kst_offset =
        UtcOffset::from_hms(9, 0, 0).map_err(|error| format!("KST 오프셋 계산 실패: {error}"))?;

    let kst_timestamp = timestamp.to_offset(kst_offset);
    debug_log!("[otra] 변환된 시간(KST): {:?}", kst_timestamp);

    // 시간 레이블 생성 (HH:MM 형식)
    let _time_label = kst_timestamp
        .format(&format_description!("[hour]:[minute]"))
        .map_err(|error| format!("시간 포맷 실패: {error}"))?;

    debug_log!("[otra] 시간 레이블: {}", _time_label);

    let time_label_with_seconds = kst_timestamp
        .format(&format_description!("[hour]:[minute]:[second]"))
        .map_err(|error| format!("시간 포맷(초 포함) 실패: {error}"))?;

    debug_log!("[otra] 시간 레이블(초 포함): {}", time_label_with_seconds);

    // 일일 파일 확인/생성
    let (file_path, _) = ensure_daily_file(state, &kst_timestamp)?;
    debug_log!("[otra] 파일 경로: {:?}", file_path);
    debug_log!("[otra] 작업 내용: {}", payload.task);
    debug_log!("[otra] 새 분 여부: {}", payload.is_new_minute);

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

    debug_log!("[otra] 항목 추가 완료: {}", payload.task);
    debug_log!("[otra] append_markdown_entry 성공");

    Ok(file_path)
}

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

fn short_day_code(date: &OffsetDateTime) -> String {
    let mut year = date.year() % 100;
    if year < 0 {
        year += 100;
    }

    format!(
        "{:02}{:02}{:02}({})",
        year,
        date.month() as u8,
        date.day(),
        short_weekday_label(date)
    )
}

#[tauri::command]
fn get_today_markdown(state: State<'_, HistoryState>) -> Result<TodayMarkdown, String> {
    debug_log!("[otra] get_today_markdown 호출됨");
    let now = current_local_time()?;
    debug_log!("[otra] 현재 시간: {:?}", now);
    let (file_path, date_key) = ensure_daily_file(state.inner(), &now)?;
    debug_log!("[otra] 파일 경로: {:?}, date_key: {}", file_path, date_key);

    let mut content = fs::read_to_string(&file_path).unwrap_or_default();
    debug_log!("[otra] 파일 내용 길이: {}", content.len());

    if content.trim().is_empty() {
        content = format!("# {}\n\n", format_date_label(&now));
        fs::write(&file_path, &content)
            .map_err(|error| format!("파일 쓰기 실패: {error}, 경로: {:?}", file_path))?;
        debug_log!("[otra] 빈 파일에 헤더 작성 완료");
    }

    debug_log!(
        "[otra] get_today_markdown 완료, 내용 길이: {}",
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

fn emit_history_update(app: &AppHandle) -> Result<(), String> {
    let state = app.state::<HistoryState>();
    let overview = collect_history(&state)?;
    app.emit_all("history_updated", overview)
        .map_err(|error| error.to_string())
}

fn toggle_overlay(window: &Window) -> tauri::Result<()> {
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
            eprintln!("[otra] 커서 위치를 가져올 수 없습니다");
            window.set_always_on_top(true)?;
            window.show()?;
            window.set_focus()?;
            return Ok(());
        }
    };
    debug_log!("[otra] 커서: ({:.2}, {:.2})", cursor.x, cursor.y);

    // 2. 모든 모니터 가져오기
    let monitors = window.available_monitors()?;
    debug_log!("[otra] 모니터 {}개", monitors.len());

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
            debug_log!(
                "[otra] 커서 모니터: origin=({}, {}), size=({}, {})",
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
        debug_log!(
            "[otra] 첫 번째 모니터 사용: origin=({}, {}), size=({}, {})",
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

    // 5. 모니터/창 크기를 모두 '논리 좌표계'로 변환해서 중앙 좌표 계산
    let origin_x_logical = origin_x as f64 / scale_factor;
    let origin_y_logical = origin_y as f64 / scale_factor;
    let width_logical = width as f64 / scale_factor;
    let height_logical = height as f64 / scale_factor;

    let center_x_logical = origin_x_logical + width_logical / 2.0;
    let center_y_logical = origin_y_logical + height_logical / 2.0;

    let pos_x_logical = center_x_logical - OVERLAY_LOGICAL_WIDTH / 2.0;
    let pos_y_logical = center_y_logical - OVERLAY_LOGICAL_HEIGHT / 2.0;

    // 6. 최종 중앙 위치로 이동 후 표시
    window.set_position(Position::Logical(LogicalPosition::new(
        pos_x_logical.round(),
        pos_y_logical.round(),
    )))?;
    window.set_always_on_top(true)?;
    window.show()?;
    window.set_focus()?;

    Ok(())
}

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

#[tauri::command]
fn append_history_entry(
    payload: AppendHistoryEntryPayload,
    app: AppHandle,
    state: State<'_, HistoryState>,
) -> Result<(), String> {
    debug_log!("[otra] ===== append_history_entry 호출됨 =====");
    debug_log!("[otra] payload 전체: {:?}", payload);
    debug_log!("[otra] timestamp: {}", payload.timestamp);
    debug_log!("[otra] task: {}", payload.task);
    debug_log!("[otra] is_new_minute: {}", payload.is_new_minute);
    debug_log!("[otra] minute_key: {:?}", payload.minute_key);

    // 파일에 항목 추가
    match append_markdown_entry(state.inner(), &payload) {
        Ok(_path) => {
            debug_log!("[otra] 파일 저장 완료: {:?}", _path);
        }
        Err(e) => {
            eprintln!("[otra] 파일 저장 실패: {}", e);
            debug_log!("[otra] ===== append_history_entry 실패 =====");
            return Err(e);
        }
    }

    // 히스토리 업데이트 이벤트 발송
    match emit_history_update(&app) {
        Ok(_) => {
            debug_log!("[otra] 히스토리 업데이트 이벤트 발송 완료");
            debug_log!("[otra] ===== append_history_entry 성공 =====");
            Ok(())
        }
        Err(e) => {
            eprintln!("[otra] 히스토리 업데이트 이벤트 발송 실패: {}", e);
            // 파일 저장은 성공했으므로 경고만 출력하고 성공으로 처리
            debug_log!("[otra] 경고: 파일은 저장되었지만 이벤트 발송 실패");
            Ok(())
        }
    }
}

#[tauri::command]
fn save_today_markdown(
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
fn list_history(state: State<'_, HistoryState>) -> Result<HistoryOverview, String> {
    collect_history(state.inner())
}

#[tauri::command]
async fn generate_ai_feedback(
    history: State<'_, HistoryState>,
    llm_state: tauri::State<'_, Arc<llm::LLMManager>>,
) -> Result<AiSummaryFile, String> {
    let now = current_local_time()?;
    let (today_path, _) = ensure_daily_file(history.inner(), &now)?;
    let today_content = fs::read_to_string(&today_path).unwrap_or_default();

    if today_content.trim().is_empty() {
        return Err("오늘 기록된 내용이 없어 요약을 생성할 수 없습니다.".into());
    }

    eprintln!("[AI Feedback] Today's content length: {} chars", today_content.len());
    eprintln!("[AI Feedback] First 200 chars: {}", &today_content.chars().take(200).collect::<String>());

    // 길이 조정: 코치형 피드백(Paragraph)로 500단어 내외 요청 → 충분한 밀도의 결과
    let request = llm::summarize::SummaryRequest {
        content: today_content,
        style: None, // business_journal_coach 사용
        max_length: Some(500),
        model_id: None,
    };

    let summary = match tokio::time::timeout(
        std::time::Duration::from_secs(90),
        llm::summarize::summarize_note(llm_state, request),
    )
    .await
    {
        Ok(result) => result?,
        Err(_) => return Err("요약 생성 시간이 초과되었습니다 (90초)".into()),
    };

    let summary_body = summary.summary.trim();
    let markdown = format!(
        "# 정리하기 ({})\n\n## 오늘 정리\n{}\n\n---\n*모델: {} · 처리시간: {}ms*",
        format_date_label(&now),
        if summary_body.is_empty() {
            "(생성된 요약이 비어 있습니다)".to_string()
        } else {
            summary_body.to_string()
        },
        summary.model_used,
        summary.processing_time_ms
    );

    write_ai_summary_file(&now, &markdown)
}

#[tauri::command]
fn list_ai_summaries(limit: Option<usize>) -> Result<Vec<AiSummaryFile>, String> {
    let dir = summaries_directory_path()?;
    ensure_summaries_dir(&dir)?;

    // Get today's date in YYYYMMDD format
    let today = current_local_time()?;
    let today_date_key = today
        .format(&format_description!("[year][month][day]"))
        .map_err(|error| error.to_string())?;

    let mut summaries: Vec<(OffsetDateTime, AiSummaryFile)> = fs::read_dir(&dir)
        .map_err(|error| error.to_string())?
        .filter_map(|entry| match entry {
            Ok(entry) => {
                let path = entry.path();
                if path.extension().and_then(|ext| ext.to_str()) != Some("md") {
                    return None;
                }
                let filename = entry.file_name().to_string_lossy().into_owned();

                // Filter for today's summaries only (ai-feedback-YYYYMMDD*.md pattern)
                if !filename.starts_with(&format!("ai-feedback-{today_date_key}")) {
                    return None;
                }

                let content = fs::read_to_string(&path).unwrap_or_default();
                let metadata = entry.metadata().ok();
                let (sort_key, created_at) = metadata
                    .and_then(|meta| meta.modified().ok())
                    .map(|modified| {
                        let odt: OffsetDateTime = modified.into();
                        let iso = odt.format(&Rfc3339).unwrap_or_else(|_| odt.to_string());
                        (odt, Some(iso))
                    })
                    .unwrap_or((OffsetDateTime::UNIX_EPOCH, None));

                Some((
                    sort_key,
                    AiSummaryFile {
                        filename,
                        path: path.to_string_lossy().into_owned(),
                        created_at,
                        content,
                    },
                ))
            }
            Err(_) => None,
        })
        .collect();

    summaries.sort_by(|a, b| b.0.cmp(&a.0));
    let limit = limit.unwrap_or(10);
    Ok(summaries
        .into_iter()
        .take(limit)
        .map(|(_, summary)| summary)
        .collect())
}

#[tauri::command]
fn open_history_folder(app: AppHandle, state: State<'_, HistoryState>) -> Result<(), String> {
    ensure_history_dir(&state.directory)?;
    let target = state.directory.to_string_lossy().to_string();
    shell::open(&app.shell_scope(), target, None).map_err(|error| error.to_string())
}

#[tauri::command]
fn hide_main_window(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_window("main") {
        window.hide().map_err(|error| error.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn toggle_overlay_window(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_window("main") {
        toggle_overlay(&window).map_err(|error| error.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn set_window_position(app: AppHandle, position: WindowPositionPayload) -> Result<(), String> {
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
fn open_llm_settings(app: AppHandle) -> Result<(), String> {
    open_settings_window(&app)
}

fn open_settings_window(app: &AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_window("settings") {
        window.set_always_on_top(true).map_err(|e| e.to_string())?;
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn get_window_position(app: AppHandle) -> Result<Option<WindowPositionPayload>, String> {
    if let Some(window) = app.get_window("main") {
        match window.outer_position() {
            Ok(pos) => {
                return Ok(Some(WindowPositionPayload { x: pos.x, y: pos.y }));
            }
            Err(error) => {
                eprintln!("[otra] window.outer_position 실패: {}", error);
                return Err(error.to_string());
            }
        }
    }
    Ok(None)
}

fn build_tray() -> SystemTray {
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

fn handle_tray_event(app: &AppHandle, event: SystemTrayEvent) {
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
                    debug_log!("[otra] 히스토리 폴더 열기: {}", target);
                    if let Err(error) = shell::open(&app.shell_scope(), target, None) {
                        eprintln!("[otra] 폴더 열기 실패: {}", error);
                    }
                }
            }
            "ai_settings" => {
                if let Err(e) = open_llm_settings(app.clone()) {
                    eprintln!("[otra] Failed to open AI settings: {}", e);
                }
            }
            "quit" => app.exit(0),
            _ => {}
        },
        _ => {}
    }
}

// LLM Command Handlers
#[tauri::command]
async fn llm_get_available_models(
    state: tauri::State<'_, Arc<llm::LLMManager>>,
) -> Result<Vec<llm::models::ModelInfo>, String> {
    state
        .model_manager
        .get_available_models()
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn llm_get_local_models(
    state: tauri::State<'_, Arc<llm::LLMManager>>,
) -> Result<Vec<llm::models::LocalModel>, String> {
    state
        .model_manager
        .get_local_models()
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn llm_download_model(
    state: tauri::State<'_, Arc<llm::LLMManager>>,
    app: AppHandle,
    model_id: String,
) -> Result<(), String> {
    let model_info = state
        .model_manager
        .get_model_by_id(&model_id)
        .await
        .ok_or_else(|| "Model not found".to_string())?;

    let dest_path = state.model_manager.get_model_path(&model_id);

    // Download with progress events
    let app_handle = app.clone();
    let model_manager = state.model_manager.clone();
    let info_clone = model_info.clone();

    let model_info_url = model_info.url.clone();
    let app_for_complete = app.clone();
    let app_for_error = app.clone();

    tokio::spawn(async move {
        let result = llm::download::download_model(
            model_id.clone(),
            model_info_url,
            dest_path.clone(),
            move |progress| {
                let _ = app_handle.emit_all("llm_download_progress", &progress);
            },
        )
        .await;

        match result {
            Ok(path) => {
                // Register the downloaded model
                if let Err(e) = model_manager
                    .register_downloaded_model(info_clone, path)
                    .await
                {
                    let _ = app_for_error
                        .emit_all("llm_download_error", format!("{}: {}", model_id, e));
                } else {
                    let _ = app_for_complete.emit_all("llm_download_complete", &model_id);
                }
            }
            Err(e) => {
                let _ =
                    app_for_error.emit_all("llm_download_error", format!("{}: {}", model_id, e));
            }
        }
    });

    Ok(())
}

#[tauri::command]
async fn llm_delete_model(
    state: tauri::State<'_, Arc<llm::LLMManager>>,
    model_id: String,
) -> Result<(), String> {
    state
        .model_manager
        .delete_model(&model_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn llm_get_storage_usage(state: tauri::State<'_, Arc<llm::LLMManager>>) -> Result<u64, String> {
    state
        .model_manager
        .get_storage_usage()
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn llm_get_default_model_id(
    state: tauri::State<'_, Arc<llm::LLMManager>>,
) -> Result<Option<String>, String> {
    Ok(state.model_manager.get_default_model_id().await)
}

#[tauri::command]
async fn llm_set_default_model(
    state: tauri::State<'_, Arc<llm::LLMManager>>,
    model_id: String,
) -> Result<(), String> {
    // 1) Save as default
    state
        .model_manager
        .set_default_model(model_id.clone())
        .await
        .map_err(|e| e.to_string())?;

    // 2) If engine is running with another model, reload to apply immediately
    let models = state
        .model_manager
        .get_local_models()
        .await
        .map_err(|e| e.to_string())?;
    if let Some(target) = models.iter().find(|m| m.info.id == model_id) {
        let mut engine = state.engine.lock().await;
        engine
            .load_model(target.path.clone())
            .map_err(|e| format!("Failed to load default model: {}", e))?;
        eprintln!("[LLM] Default model applied and reloaded: {}", target.info.name);
    }

    Ok(())
}

#[tauri::command]
async fn llm_load_model(
    state: tauri::State<'_, Arc<llm::LLMManager>>,
    model_id: String,
) -> Result<(), String> {
    eprintln!("Loading model: {}", model_id);

    // Get the model info
    let models = state
        .model_manager
        .get_local_models()
        .await
        .map_err(|e| e.to_string())?;

    let model = models
        .iter()
        .find(|m| m.info.id == model_id)
        .ok_or_else(|| format!("Model not found: {}", model_id))?;

    // Load the model (non-blocking)
    let mut engine = state.engine.lock().await;
    engine.load_model(model.path.clone()).map_err(|e| {
        eprintln!("Failed to load model: {}", e);
        e.to_string()
    })?;

    eprintln!("Model loaded successfully: {}", model_id);
    Ok(())
}

#[tauri::command]
async fn llm_is_ready(
    state: tauri::State<'_, Arc<llm::LLMManager>>,
) -> Result<bool, String> {
    let engine = state.engine.lock().await;
    engine.wait_for_ready().await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_prompt_configs() -> Result<Vec<llm::prompt_config::PromptConfig>, String> {
    let store = llm::prompt_config::PromptConfigStore::load()
        .map_err(|e| e.to_string())?;
    Ok(store.get_all_configs())
}

#[tauri::command]
async fn save_prompt_config(name: String, user_prompt: String) -> Result<llm::prompt_config::PromptConfig, String> {
    let mut store = llm::prompt_config::PromptConfigStore::load()
        .map_err(|e| e.to_string())?;
    store.add_config(name, user_prompt)
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn activate_prompt_config(prompt_id: String) -> Result<(), String> {
    let mut store = llm::prompt_config::PromptConfigStore::load()
        .map_err(|e| e.to_string())?;
    store.activate_config(&prompt_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn delete_prompt_config(prompt_id: String) -> Result<(), String> {
    let mut store = llm::prompt_config::PromptConfigStore::load()
        .map_err(|e| e.to_string())?;
    store.delete_config(&prompt_id)
        .map_err(|e| e.to_string())
}

fn register_shortcuts(app: &AppHandle) -> Result<(), String> {
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

fn main() {
    // Initialize LLM Manager
    let llm_manager = Arc::new(llm::LLMManager::new().expect("Failed to initialize LLM manager"));

    tauri::Builder::default()
        .manage(HistoryState {
            directory: history_directory_path().unwrap_or_else(|_| PathBuf::from("history")),
        })
        .manage(llm_manager.clone())
        .system_tray(build_tray())
        .on_system_tray_event(handle_tray_event)
        .invoke_handler(tauri::generate_handler![
            append_history_entry,
            save_today_markdown,
            get_today_markdown,
            list_history,
            generate_ai_feedback,
            list_ai_summaries,
            open_history_folder,
            hide_main_window,
            toggle_overlay_window,
            set_window_position,
            get_window_position,
            open_llm_settings,
            // LLM commands
            llm::summarize::summarize_note,
            llm::summarize::batch_summarize,
            llm::summarize::get_note_insights,
            llm::summarize::create_meeting_minutes,
            llm::summarize::daily_review,
            llm_get_available_models,
            llm_get_local_models,
            llm_download_model,
            llm_delete_model,
            llm_get_storage_usage,
            llm_get_default_model_id,
            llm_set_default_model,
            llm_load_model,
            llm_is_ready,
            // Prompt configuration commands
            get_prompt_configs,
            save_prompt_config,
            activate_prompt_config,
            delete_prompt_config
        ])
        .setup(|app| {
            let state = app.state::<HistoryState>();
            debug_log!("[otra] 앱 시작 - 히스토리 디렉토리: {:?}", state.directory);
            ensure_history_dir(&state.directory).map_err(|error| {
                format!(
                    "히스토리 디렉토리 생성 실패: {error}, 경로: {:?}",
                    state.directory
                )
            })?;
            debug_log!(
                "[otra] 히스토리 디렉토리 확인/생성 완료: {:?}",
                state.directory
            );

            ensure_accessibility_permission();
            register_shortcuts(&app.handle())?;
            emit_history_update(&app.handle())?;

            // 백그라운드에서 LLM 서버 예열: 기본 모델이 설정되어 있으면 자동 로드
            let llm_state = app.state::<Arc<llm::LLMManager>>().inner().clone();
            tauri::async_runtime::spawn_blocking(move || {
                let rt = match tokio::runtime::Runtime::new() {
                    Ok(rt) => rt,
                    Err(e) => {
                        eprintln!("[LLM] runtime init failed: {}", e);
                        return;
                    }
                };
                match rt.block_on(llm_state.initialize()) {
                    Ok(()) => eprintln!("[LLM] initialize started (background)"),
                    Err(e) => eprintln!("[LLM] initialize failed: {}", e),
                }
            });

            if let Some(window) = app.get_window("main") {
                #[cfg(target_os = "macos")]
                set_window_corner_radius(&window);
                window.hide()?;
            }

            Ok(())
        })
        .on_window_event(|event| match event.event() {
            WindowEvent::Moved(position) => {
                if event.window().label() == "main" {
                    let _pos = *position;
                    debug_log!("[otra] 창 이동 이벤트: ({}, {})", _pos.x, _pos.y);
                }
            }
            WindowEvent::CloseRequested { api, .. } => {
                if event.window().label() == "main" {
                    event.window().hide().ok();
                    api.prevent_close();
                }
                if event.window().label() == "history" {
                    event.window().hide().ok();
                    api.prevent_close();
                }
            }
            _ => {}
        })
        .run(tauri::generate_context!())
        .expect("error while running Tauri application");
}
