use time::{OffsetDateTime, Weekday};
use time::macros::format_description;
use std::path::PathBuf;

/// 문서 폴더 경로를 가져옵니다
pub fn document_dir() -> Result<PathBuf, String> {
    tauri::api::path::document_dir().ok_or_else(|| "문서 폴더를 찾을 수 없습니다".to_string())
}

/// 히스토리 디렉토리 경로를 반환합니다
pub fn history_directory_path() -> Result<PathBuf, String> {
    let mut base = document_dir()?;
    base.push("Hoego");
    base.push("history");
    Ok(base)
}

/// AI 요약 디렉토리 경로를 반환합니다
pub fn summaries_directory_path() -> Result<PathBuf, String> {
    let mut base = document_dir()?;
    base.push("Hoego");
    base.push("summaries");
    Ok(base)
}


/// 현재 로컬 시간을 반환합니다
pub fn current_local_time() -> Result<OffsetDateTime, String> {
    OffsetDateTime::now_local().map_err(|error| error.to_string())
}

/// 날짜 레이블을 포맷합니다 (예: "2024년 1월 1일 월요일")
pub fn format_date_label(date: &OffsetDateTime) -> String {
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

/// 짧은 요일 레이블을 반환합니다 (예: "월")
pub fn short_weekday_label(date: &OffsetDateTime) -> &'static str {
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

/// 짧은 날짜 코드를 생성합니다 (예: "240101(월)")
pub fn short_day_code(date: &OffsetDateTime) -> String {
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

/// 날짜 키를 포맷합니다 (예: "20240101")
pub fn format_date_key(date: &OffsetDateTime) -> Result<String, String> {
    date.format(&format_description!("[year][month][day]"))
        .map_err(|error| error.to_string())
}

/// 시간 레이블을 포맷합니다 (예: "14:30:45")
pub fn format_time_with_seconds(date: &OffsetDateTime) -> Result<String, String> {
    date.format(&format_description!("[hour]:[minute]:[second]"))
        .map_err(|error| error.to_string())
}
