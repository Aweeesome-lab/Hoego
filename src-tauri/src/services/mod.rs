// services/mod.rs
// Business logic layer organized by domain

pub mod ai_service;
pub mod feedback_service;
pub mod history_service;
pub mod llm;
pub mod storage_service;
pub mod weekly_service;

// Re-export commonly used services (TODO: uncomment when implemented)
// pub use ai_service::*;
// pub use history_service::*;
// pub use storage_service::*;
