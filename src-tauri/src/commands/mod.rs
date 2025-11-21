// commands/mod.rs
// Tauri IPC command handlers organized by the 3-stage workflow
// Dump → Feedback → Retrospect

pub mod dump;
pub mod feedback;
pub mod history;
pub mod llm;
pub mod retrospect;
pub mod settings;
pub mod window;

// Re-export commands for easy registration
// Organized by the 3-stage workflow

// ========================================
// STAGE 1: Dump (일지 작성 및 조회)
// ========================================
pub use dump::{
    // Daily dump (journal) operations
    append_history_entry,
    get_today_markdown,
    save_today_markdown,
    // Specific dump file operations
    get_history_markdown,
    save_history_markdown,
};

// ========================================
// STAGE 2: Feedback (AI 피드백)
// ========================================
pub use feedback::{
    cancel_ai_feedback_stream,
    generate_ai_feedback,
    generate_ai_feedback_stream,
    list_ai_summaries,
};


// ========================================
// STAGE 3: Retrospect (회고)
// ========================================
pub use retrospect::{
    get_retrospect_markdown,
    save_retrospect_markdown,
};

// ========================================
// History (히스토리 탐색 - 사이드바용)
// ========================================
pub use history::{
    get_week_data,
    list_history,
    open_history_folder,
};

// ========================================
// Settings (설정)
// ========================================
pub use settings::{
    // Model selection
    get_selected_model,
    set_selected_model,
    // App settings
    get_app_settings,
    reset_app_settings,
    update_app_settings,
    update_documents_path,
    update_quick_note_shortcut,
};
