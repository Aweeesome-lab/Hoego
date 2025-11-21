// models/dump.rs
// Daily dump and history entry models

use serde::{Deserialize, Serialize};
use std::path::PathBuf;

/// History state - manages the history directory path
#[derive(Debug)]
pub struct HistoryState {
    pub directory: PathBuf,
}

impl Default for HistoryState {
    fn default() -> Self {
        use crate::utils::history_directory_path;
        Self {
            directory: history_directory_path().unwrap_or_else(|_| PathBuf::from("history")),
        }
    }
}

/// Payload for appending a history entry
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

/// Information about a single history file
#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct HistoryFileInfo {
    pub date: String,
    pub title: String,
    pub preview: Option<String>,
    pub filename: String,
    pub path: String,
}

/// Overview of all history files in the directory
#[derive(Debug, Serialize, Clone)]
pub struct HistoryOverview {
    pub directory: String,
    pub files: Vec<HistoryFileInfo>,
}

/// Today's markdown file data
#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct TodayMarkdown {
    pub date_key: String,
    pub short_label: String,
    pub header_title: String,
    pub file_path: String,
    pub content: String,
}
