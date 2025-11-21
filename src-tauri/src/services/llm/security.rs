// API key storage - currently disabled (no cloud LLM needed)

use std::collections::HashMap;
use std::sync::{OnceLock, RwLock};
use super::types::LLMError;

// 인메모리 저장소 (키체인 대신 임시 사용)
static KEY_STORE: OnceLock<RwLock<HashMap<String, String>>> = OnceLock::new();

fn get_store() -> &'static RwLock<HashMap<String, String>> {
    KEY_STORE.get_or_init(|| RwLock::new(HashMap::new()))
}

pub struct SecureKeyStore;

impl SecureKeyStore {
    /// API 키 저장 (인메모리)
    pub fn store_api_key(provider: &str, api_key: &str) -> Result<(), LLMError> {
        let mut store = get_store().write()
            .map_err(|e| LLMError::ConfigError(format!("Failed to lock key store: {}", e)))?;
        store.insert(provider.to_string(), api_key.to_string());
        Ok(())
    }

    /// API 키 조회
    pub fn retrieve_api_key(provider: &str) -> Result<String, LLMError> {
        // 환경변수에서 먼저 확인
        let env_key = format!("{}_API_KEY", provider.to_uppercase().replace("-", "_"));
        if let Ok(key) = std::env::var(&env_key) {
            return Ok(key);
        }

        // 인메모리 저장소에서 확인
        let store = get_store().read()
            .map_err(|e| LLMError::ConfigError(format!("Failed to lock key store: {}", e)))?;

        store.get(provider)
            .cloned()
            .ok_or_else(|| LLMError::ConfigError(format!("No API key found for provider: {}", provider)))
    }

    /// API 키 삭제
    pub fn delete_api_key(provider: &str) -> Result<(), LLMError> {
        let mut store = get_store().write()
            .map_err(|e| LLMError::ConfigError(format!("Failed to lock key store: {}", e)))?;
        store.remove(provider);
        Ok(())
    }

    /// API 키 존재 여부 확인
    pub fn has_api_key(provider: &str) -> bool {
        Self::retrieve_api_key(provider).is_ok()
    }
}
