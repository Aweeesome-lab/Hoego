// models/mod.rs
// Data models and types used across the application

pub mod dump;
pub mod errors;
pub mod feedback;
pub mod paths;
pub mod settings;
pub mod weekly;

// Re-export commonly used types
pub use errors::AppError;
pub use paths::*;
// pub use settings::*;  // TODO: uncomment when implemented
