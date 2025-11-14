// Common types for Cloud LLM integration

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// 완성 요청
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompletionRequest {
    /// 대화 메시지 목록
    pub messages: Vec<Message>,

    /// 사용할 모델 (예: "gpt-4-turbo", "claude-3-sonnet")
    pub model: String,

    /// 온도 (0.0 ~ 2.0, 기본 1.0)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub temperature: Option<f32>,

    /// 최대 토큰 수
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_tokens: Option<u32>,

    /// 시스템 프롬프트 (선택적)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub system_prompt: Option<String>,

    /// 추가 메타데이터
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<HashMap<String, String>>,
}

/// 완성 응답
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompletionResponse {
    /// 생성된 텍스트
    pub content: String,

    /// 완료 이유
    pub finish_reason: FinishReason,

    /// 토큰 사용량
    pub usage: TokenUsage,

    /// 사용된 모델
    pub model: String,

    /// Provider 이름
    pub provider: String,
}

/// 메시지
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    /// 역할 (system, user, assistant)
    pub role: Role,

    /// 메시지 내용
    pub content: String,
}

/// 역할
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum Role {
    System,
    User,
    Assistant,
}

/// 완료 이유
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum FinishReason {
    Stop,           // 정상 완료
    Length,         // 토큰 제한
    ContentFilter,  // 콘텐츠 필터링
    ToolCalls,      // 도구 호출 (향후)
}

/// 토큰 사용량
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TokenUsage {
    /// 프롬프트 토큰 수
    pub prompt_tokens: u32,

    /// 완성 토큰 수
    pub completion_tokens: u32,

    /// 총 토큰 수
    pub total_tokens: u32,
}

/// LLM 에러
#[derive(Debug, thiserror::Error)]
pub enum LLMError {
    #[error("Network error: {0}")]
    Network(String),

    #[error("Authentication failed: {0}")]
    Authentication(String),

    #[error("Rate limit exceeded")]
    RateLimitExceeded,

    #[error("Invalid request: {0}")]
    InvalidRequest(String),

    #[error("Provider error: {0}")]
    ProviderError(String),

    #[allow(dead_code)]
    #[error("Not implemented: {0}")]
    NotImplemented(String),

    #[error("Configuration error: {0}")]
    ConfigError(String),
}

// Serialize LLMError for Tauri commands
impl Serialize for LLMError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

/// Provider 설정
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProviderConfig {
    /// Provider 이름
    pub name: String,

    /// 활성화 여부
    pub enabled: bool,

    /// 기본 모델
    pub default_model: String,

    /// API 키 (keyring에 저장된 키의 참조)
    #[serde(skip)]
    #[allow(dead_code)]
    pub api_key: Option<String>,
}

/// LLM 백엔드 타입
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum LLMBackend {
    /// 로컬 모델 (기존)
    Local,

    /// 클라우드 모델
    Cloud {
        provider: String,
    },
}
