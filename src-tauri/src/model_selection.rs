use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SelectedModel {
    pub model_type: String, // "local" or "cloud"
    pub model_id: String,
    pub provider: Option<String>, // For cloud models: "openai", "claude", "gemini"
    pub display_name: Option<String>,
}

pub struct ModelSelectionState {
    pub selected: Arc<RwLock<Option<SelectedModel>>>,
}

impl ModelSelectionState {
    pub fn new() -> Self {
        Self {
            selected: Arc::new(RwLock::new(None)),
        }
    }
}

#[tauri::command]
pub async fn set_selected_model(
    model: SelectedModel,
    state: tauri::State<'_, ModelSelectionState>,
) -> Result<(), String> {
    let mut selected = state.selected.write().await;
    *selected = Some(model);
    Ok(())
}

#[tauri::command]
pub async fn get_selected_model(
    state: tauri::State<'_, ModelSelectionState>,
) -> Result<Option<SelectedModel>, String> {
    let selected = state.selected.read().await;
    Ok(selected.clone())
}
