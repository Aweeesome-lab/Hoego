// models/settings.rs
// App settings data models

use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use tokio::sync::RwLock;

/// App settings
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    /// Quick note shortcut (e.g., "CommandOrControl+J")
    pub quick_note_shortcut: String,

    /// Document storage path (absolute path)
    pub documents_path: String,
}

impl Default for AppSettings {
    fn default() -> Self {
        let default_path = tauri::api::path::document_dir()
            .map(|mut p| {
                p.push("Hoego");
                p.push("history");
                p.to_string_lossy().to_string()
            })
            .unwrap_or_else(|| "~/Documents/Hoego/history".to_string());

        Self {
            quick_note_shortcut: "CommandOrControl+J".to_string(),
            documents_path: default_path,
        }
    }
}

/// App settings state management
pub struct AppSettingsState {
    pub settings: Mutex<AppSettings>,
}

impl Default for AppSettingsState {
    fn default() -> Self {
        Self::new()
    }
}

impl AppSettingsState {
    pub fn new() -> Self {
        Self {
            settings: Mutex::new(AppSettings::default()),
        }
    }
}

/// Selected LLM model information
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SelectedModel {
    pub model_type: String, // "local" or "cloud"
    pub model_id: String,
    pub provider: Option<String>, // For cloud models: "openai", "claude", "gemini"
    pub display_name: Option<String>,
}

/// Model selection state management
pub struct ModelSelectionState {
    pub selected: Arc<RwLock<Option<SelectedModel>>>,
}

impl Default for ModelSelectionState {
    fn default() -> Self {
        Self::new()
    }
}

impl ModelSelectionState {
    pub fn new() -> Self {
        Self {
            selected: Arc::new(RwLock::new(None)),
        }
    }
}
