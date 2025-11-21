// models/feedback.rs
// AI feedback data models

use serde::Serialize;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

/// AI feedback streaming cancellation state
pub struct StreamCancellationState {
    pub is_cancelled: Arc<AtomicBool>,
}

impl Default for StreamCancellationState {
    fn default() -> Self {
        Self {
            is_cancelled: Arc::new(AtomicBool::new(false)),
        }
    }
}

impl StreamCancellationState {
    pub fn reset(&self) {
        self.is_cancelled.store(false, Ordering::SeqCst);
    }

    pub fn cancel(&self) {
        self.is_cancelled.store(true, Ordering::SeqCst);
    }

    pub fn is_cancelled(&self) -> bool {
        self.is_cancelled.load(Ordering::SeqCst)
    }
}

/// AI summary file metadata and content
#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AiSummaryFile {
    pub filename: String,
    pub path: String,
    pub created_at: Option<String>,
    pub content: String,
    pub pii_masked: bool,
}
