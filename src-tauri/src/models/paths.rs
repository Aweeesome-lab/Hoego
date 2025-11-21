// models/paths.rs
// Path-related data structures
//
// Provides type-safe path handling for:
// - History directory paths
// - LLM model paths
// - Settings file paths
// - Cache directories

// Placeholder - will be implemented with PathBuf wrappers and validation
use std::path::PathBuf;

#[derive(Debug, Clone)]
pub struct AppPaths {
    pub history_dir: PathBuf,
    pub settings_file: PathBuf,
    pub llm_models_dir: PathBuf,
    pub cache_dir: PathBuf,
}

impl AppPaths {
    pub fn new() -> Self {
        // TODO: Implement proper path resolution
        Self {
            history_dir: PathBuf::new(),
            settings_file: PathBuf::new(),
            llm_models_dir: PathBuf::new(),
            cache_dir: PathBuf::new(),
        }
    }
}

impl Default for AppPaths {
    fn default() -> Self {
        Self::new()
    }
}
