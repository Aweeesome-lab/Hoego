// utils/datetime.rs
use chrono::{DateTime, Utc};
use crate::models::errors::AppError;

/// ISO 8601 문자열을 DateTime으로 파싱
pub fn parse_iso8601(s: &str) -> Result<DateTime<Utc>, AppError> {
    DateTime::parse_from_rfc3339(s)
        .map(|dt| dt.with_timezone(&Utc))
        .map_err(|e| AppError::ValidationError(format!("Invalid datetime: {}", e)))
}

/// DateTime을 ISO 8601 문자열로 포맷
pub fn format_iso8601(dt: &DateTime<Utc>) -> String {
    dt.to_rfc3339()
}

/// 파일명용 타임스탬프 생성 (2025-01-21_14-30-00)
pub fn format_filename_timestamp(dt: &DateTime<Utc>) -> String {
    dt.format("%Y-%m-%d_%H-%M-%S").to_string()
}
