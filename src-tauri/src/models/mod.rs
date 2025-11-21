// models/mod.rs
// Data models and types used across the application

pub mod errors;
pub mod paths;
pub mod settings;

// Re-export commonly used types
pub use errors::AppError;
pub use paths::*;
// pub use settings::*;  // TODO: uncomment when implemented
