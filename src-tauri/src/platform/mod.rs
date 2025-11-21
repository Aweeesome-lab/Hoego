// platform/mod.rs
// Platform-specific integrations (macOS/Windows/Linux)

pub mod shortcuts;
pub mod tray;
pub mod window_manager;

// Re-export commonly used platform features
pub use shortcuts::*;
pub use tray::*;
pub use window_manager::*;
