// Cloud LLM Provider Trait
// 모든 클라우드 LLM provider가 구현해야 하는 공통 인터페이스

use async_trait::async_trait;
use super::types::{CompletionRequest, CompletionResponse, LLMError};

#[async_trait]
pub trait CloudLLMProvider: Send + Sync {
    /// Provider 이름 (예: "openai", "claude", "gemini")
    fn name(&self) -> &str;

    /// 지원하는 모델 목록
    fn supported_models(&self) -> Vec<String>;

    /// API 키 검증
    async fn validate_api_key(&self, api_key: &str) -> Result<bool, LLMError>;

    /// 텍스트 완성 요청 (일반)
    async fn complete(
        &self,
        request: CompletionRequest,
    ) -> Result<CompletionResponse, LLMError>;

    /// 스트리밍 완성 (선택적 - Phase 2에서 구현)
    #[allow(dead_code)]
    async fn stream(
        &self,
        _request: CompletionRequest,
    ) -> Result<tokio::sync::mpsc::Receiver<String>, LLMError> {
        Err(LLMError::NotImplemented("Streaming not supported".to_string()))
    }
}
