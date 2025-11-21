// services/feedback_service.rs
// AI feedback generation and storage service

use std::fs;
use std::path::PathBuf;
use time::format_description::well_known::Rfc3339;
use time::macros::format_description;
use time::OffsetDateTime;

use crate::models::feedback::AiSummaryFile;
use crate::utils::*;

/// Ensure AI summaries directory exists
pub fn ensure_summaries_dir(path: &PathBuf) -> Result<(), String> {
    fs::create_dir_all(path)
        .map_err(|error| format!("AI 요약 디렉토리 생성 실패: {error}, 경로: {:?}", path))
}

/// Write AI summary file
pub fn write_ai_summary_file(date: &OffsetDateTime, content: &str, pii_masked: bool) -> Result<AiSummaryFile, String> {
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
        pii_masked,
    })
}
