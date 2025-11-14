// Tauri commands for Cloud LLM

use tauri::State;
use std::sync::Arc;
use tokio::sync::RwLock;

use super::providers::OpenAIProvider;
use super::security::SecureKeyStore;
use super::traits::CloudLLMProvider;
use super::types::*;

/// 클라우드 LLM 상태
pub struct CloudLLMState {
    pub current_provider: Arc<RwLock<Option<Box<dyn CloudLLMProvider>>>>,
}

impl CloudLLMState {
    pub fn new() -> Self {
        Self {
            current_provider: Arc::new(RwLock::new(None)),
        }
    }
}

/// API 키 설정 및 검증
#[tauri::command]
pub async fn set_cloud_api_key(
    provider_name: String,
    api_key: String,
    state: State<'_, CloudLLMState>,
) -> Result<String, String> {
    // Provider 생성
    let provider: Box<dyn CloudLLMProvider> = match provider_name.as_str() {
        "openai" => Box::new(OpenAIProvider::new(api_key.clone())),
        _ => return Err(format!("Unsupported provider: {}", provider_name)),
    };

    // API 키 검증
    provider
        .validate_api_key(&api_key)
        .await
        .map_err(|e| e.to_string())?;

    // OS 키체인에 저장
    SecureKeyStore::store_api_key(&provider_name, &api_key).map_err(|e| e.to_string())?;

    // 현재 provider로 설정
    let mut current = state.current_provider.write().await;
    *current = Some(provider);

    Ok(format!("API key for {} saved successfully", provider_name))
}

/// API 키 테스트
#[tauri::command]
pub async fn test_cloud_api_key(provider_name: String, api_key: String) -> Result<bool, String> {
    let provider: Box<dyn CloudLLMProvider> = match provider_name.as_str() {
        "openai" => Box::new(OpenAIProvider::new(api_key.clone())),
        _ => return Err(format!("Unsupported provider: {}", provider_name)),
    };

    provider
        .validate_api_key(&api_key)
        .await
        .map_err(|e| e.to_string())
}

/// 클라우드 LLM 완성 요청
#[tauri::command]
pub async fn cloud_llm_complete(
    request: CompletionRequest,
    state: State<'_, CloudLLMState>,
) -> Result<CompletionResponse, String> {
    let provider_lock = state.current_provider.read().await;
    let provider = provider_lock
        .as_ref()
        .ok_or("No cloud provider configured")?;

    provider.complete(request).await.map_err(|e| e.to_string())
}

/// 저장된 API 키 확인
#[tauri::command]
pub fn has_cloud_api_key(provider_name: String) -> bool {
    SecureKeyStore::has_api_key(&provider_name)
}

/// API 키 삭제
#[tauri::command]
pub fn delete_cloud_api_key(provider_name: String) -> Result<(), String> {
    SecureKeyStore::delete_api_key(&provider_name).map_err(|e| e.to_string())
}

/// 지원하는 provider 목록
#[tauri::command]
pub fn get_supported_providers() -> Vec<String> {
    vec!["openai".to_string()]
    // TODO: Phase 2에서 추가
    // vec!["openai".to_string(), "claude".to_string(), "gemini".to_string()]
}

/// Provider의 지원 모델 목록
#[tauri::command]
pub fn get_provider_models(provider_name: String) -> Result<Vec<String>, String> {
    match provider_name.as_str() {
        "openai" => {
            let provider = OpenAIProvider::new("dummy".to_string());
            Ok(provider.supported_models())
        }
        _ => Err(format!("Unsupported provider: {}", provider_name)),
    }
}

/// 저장된 API 키로 provider 초기화 (앱 시작 시 호출)
#[tauri::command]
pub async fn initialize_cloud_provider(
    provider_name: String,
    state: State<'_, CloudLLMState>,
) -> Result<(), String> {
    // API 키 조회
    let api_key = SecureKeyStore::retrieve_api_key(&provider_name).map_err(|e| e.to_string())?;

    // Provider 생성
    let provider: Box<dyn CloudLLMProvider> = match provider_name.as_str() {
        "openai" => Box::new(OpenAIProvider::new(api_key)),
        _ => return Err(format!("Unsupported provider: {}", provider_name)),
    };

    // 현재 provider로 설정
    let mut current = state.current_provider.write().await;
    *current = Some(provider);

    Ok(())
}
