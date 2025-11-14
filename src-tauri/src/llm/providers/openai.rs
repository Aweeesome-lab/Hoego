// OpenAI Provider Implementation

use async_trait::async_trait;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::json;

use crate::llm::traits::CloudLLMProvider;
use crate::llm::types::*;

pub struct OpenAIProvider {
    client: Client,
    api_key: String,
    base_url: String,
}

impl OpenAIProvider {
    pub fn new(api_key: String) -> Self {
        Self {
            client: Client::new(),
            api_key,
            base_url: "https://api.openai.com/v1".to_string(),
        }
    }

    #[allow(dead_code)]
    pub fn with_base_url(mut self, base_url: String) -> Self {
        self.base_url = base_url;
        self
    }
}

// OpenAI API 응답 구조
#[derive(Debug, Deserialize)]
struct OpenAIResponse {
    choices: Vec<OpenAIChoice>,
    usage: OpenAIUsage,
    model: String,
}

#[derive(Debug, Deserialize)]
struct OpenAIChoice {
    message: OpenAIMessage,
    finish_reason: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct OpenAIMessage {
    role: String,
    content: String,
}

#[derive(Debug, Deserialize)]
struct OpenAIUsage {
    prompt_tokens: u32,
    completion_tokens: u32,
    total_tokens: u32,
}

#[async_trait]
impl CloudLLMProvider for OpenAIProvider {
    fn name(&self) -> &str {
        "openai"
    }

    fn supported_models(&self) -> Vec<String> {
        vec![
            "gpt-4-turbo".to_string(),
            "gpt-4".to_string(),
            "gpt-3.5-turbo".to_string(),
            "gpt-4o".to_string(),
            "gpt-4o-mini".to_string(),
        ]
    }

    async fn validate_api_key(&self, api_key: &str) -> Result<bool, LLMError> {
        // 간단한 모델 목록 조회로 키 검증
        let response = self
            .client
            .get(format!("{}/models", self.base_url))
            .header("Authorization", format!("Bearer {}", api_key))
            .send()
            .await
            .map_err(|e| LLMError::Network(e.to_string()))?;

        match response.status().as_u16() {
            200 => Ok(true),
            401 => Err(LLMError::Authentication(
                "Invalid API key".to_string(),
            )),
            _ => Err(LLMError::ProviderError(format!(
                "Unexpected status: {}",
                response.status()
            ))),
        }
    }

    async fn complete(
        &self,
        request: CompletionRequest,
    ) -> Result<CompletionResponse, LLMError> {
        // CompletionRequest를 OpenAI 형식으로 변환
        let mut messages: Vec<OpenAIMessage> = request
            .messages
            .iter()
            .map(|m| OpenAIMessage {
                role: match m.role {
                    Role::System => "system".to_string(),
                    Role::User => "user".to_string(),
                    Role::Assistant => "assistant".to_string(),
                },
                content: m.content.clone(),
            })
            .collect();

        // 시스템 프롬프트가 있으면 맨 앞에 추가
        if let Some(system_prompt) = request.system_prompt {
            messages.insert(
                0,
                OpenAIMessage {
                    role: "system".to_string(),
                    content: system_prompt,
                },
            );
        }

        let body = json!({
            "model": request.model,
            "messages": messages,
            "temperature": request.temperature.unwrap_or(1.0),
            "max_tokens": request.max_tokens,
        });

        let response = self
            .client
            .post(format!("{}/chat/completions", self.base_url))
            .header("Authorization", format!("Bearer {}", self.api_key))
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .await
            .map_err(|e| LLMError::Network(e.to_string()))?;

        let status = response.status();
        if !status.is_success() {
            let error_text = response
                .text()
                .await
                .unwrap_or_else(|_| "Unknown error".to_string());

            return Err(match status.as_u16() {
                401 => LLMError::Authentication("Invalid API key".to_string()),
                429 => LLMError::RateLimitExceeded,
                400 => LLMError::InvalidRequest(error_text),
                _ => LLMError::ProviderError(error_text),
            });
        }

        let openai_response: OpenAIResponse = response
            .json()
            .await
            .map_err(|e| LLMError::ProviderError(format!("Failed to parse response: {}", e)))?;

        let choice = openai_response
            .choices
            .first()
            .ok_or_else(|| LLMError::ProviderError("No choices in response".to_string()))?;

        Ok(CompletionResponse {
            content: choice.message.content.clone(),
            finish_reason: match choice.finish_reason.as_str() {
                "stop" => FinishReason::Stop,
                "length" => FinishReason::Length,
                "content_filter" => FinishReason::ContentFilter,
                _ => FinishReason::Stop,
            },
            usage: TokenUsage {
                prompt_tokens: openai_response.usage.prompt_tokens,
                completion_tokens: openai_response.usage.completion_tokens,
                total_tokens: openai_response.usage.total_tokens,
            },
            model: openai_response.model,
            provider: self.name().to_string(),
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_provider_creation() {
        let provider = OpenAIProvider::new("test-key".to_string());
        assert_eq!(provider.name(), "openai");
        assert!(!provider.supported_models().is_empty());
    }

    #[test]
    fn test_supported_models() {
        let provider = OpenAIProvider::new("test-key".to_string());
        let models = provider.supported_models();
        assert!(models.contains(&"gpt-4-turbo".to_string()));
        assert!(models.contains(&"gpt-3.5-turbo".to_string()));
    }
}
