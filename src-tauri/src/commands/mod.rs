// commands/mod.rs
// Tauri IPC command handlers organized by domain

pub mod ai;
pub mod history;
pub mod llm;
pub mod settings;
pub mod window;

// Re-export all commands for easy registration (TODO: uncomment when implemented)
// pub use ai::*;
// pub use history::*;
// pub use llm::*;
// pub use settings::*;
// pub use window::*;
