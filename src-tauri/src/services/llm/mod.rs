// 로컬 LLM 모듈 (기존)
pub mod download;
pub mod engine;
// pub mod native_engine;  // Disabled - llama-cpp-2 has macOS compatibility issues
pub mod models;
pub mod prompt_config;
pub mod prompts;
pub mod summarize;

// 클라우드 LLM 모듈 (신규)
pub mod commands;
pub mod providers;
pub mod security;
pub mod traits;
pub mod types;

pub use engine::LlamaCppEngine;
// pub use native_engine::NativeLlamaEngine;  // Disabled for now
pub use models::ModelManager;

// 클라우드 LLM exports
pub use commands::CloudLLMState;

use std::sync::Arc;
use tokio::sync::Mutex;

pub struct LLMManager {
    pub engine: Arc<Mutex<LlamaCppEngine>>,
    pub model_manager: Arc<ModelManager>,
}

impl LLMManager {
    pub fn new() -> Result<Self, Box<dyn std::error::Error>> {
        // Use the process-based engine which works well with our --jinja fix
        let engine = Arc::new(Mutex::new(LlamaCppEngine::new()?));
        let model_manager = Arc::new(ModelManager::new()?);

        Ok(Self {
            engine,
            model_manager,
        })
    }

    #[allow(dead_code)]
    pub async fn initialize(&self) -> Result<(), Box<dyn std::error::Error>> {
        // Ensure binary exists (no-op for native engine, extracts binary for process engine)
        self.engine.lock().await.ensure_binary_exists()?;

        // Load default model if available
        if let Some(default_model) = self.model_manager.get_default_model().await? {
            self.engine.lock().await.load_model(default_model.path)?;
        }

        Ok(())
    }
}

// Configuration structure
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct LLMConfig {
    pub model: String,
    pub max_context: usize,
    pub temperature: f32,
    pub max_tokens: usize,
    pub cpu_threads: usize,
    pub gpu_layers: usize,
}

impl Default for LLMConfig {
    fn default() -> Self {
        Self {
            model: "qwen2.5-3b-q4.gguf".to_string(),  // Qwen2.5가 더 안정적임
            // 더 긴 입력(오늘 전체 일지)을 수용하기 위해 컨텍스트 확장
            max_context: 16384,  // Qwen2.5-3B 모델 최적 설정
            temperature: 0.3,
            max_tokens: 2048,  // 충분한 응답 길이
            cpu_threads: 8,
            gpu_layers: 35,  // Metal GPU 가속 사용
        }
    }
}
