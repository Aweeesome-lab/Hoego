// Secure API key storage using OS keychain

use keyring::Entry;
use super::types::LLMError;

const SERVICE_NAME: &str = "com.hoego.llm";

pub struct SecureKeyStore;

impl SecureKeyStore {
    /// API 키 저장 (OS 키체인 사용)
    /// - macOS: Keychain
    /// - Windows: Credential Manager
    /// - Linux: Secret Service
    pub fn store_api_key(provider: &str, api_key: &str) -> Result<(), LLMError> {
        let entry = Entry::new(SERVICE_NAME, provider)
            .map_err(|e| LLMError::ConfigError(format!("Failed to create keyring entry: {}", e)))?;

        entry
            .set_password(api_key)
            .map_err(|e| LLMError::ConfigError(format!("Failed to store API key: {}", e)))?;

        Ok(())
    }

    /// API 키 조회
    pub fn retrieve_api_key(provider: &str) -> Result<String, LLMError> {
        let entry = Entry::new(SERVICE_NAME, provider)
            .map_err(|e| LLMError::ConfigError(format!("Failed to create keyring entry: {}", e)))?;

        entry
            .get_password()
            .map_err(|e| match e {
                keyring::Error::NoEntry => {
                    LLMError::ConfigError(format!("No API key found for provider: {}", provider))
                }
                _ => LLMError::ConfigError(format!("Failed to retrieve API key: {}", e)),
            })
    }

    /// API 키 삭제
    pub fn delete_api_key(provider: &str) -> Result<(), LLMError> {
        let entry = Entry::new(SERVICE_NAME, provider)
            .map_err(|e| LLMError::ConfigError(format!("Failed to create keyring entry: {}", e)))?;

        match entry.delete_password() {
            Ok(_) | Err(keyring::Error::NoEntry) => Ok(()),
            Err(e) => Err(LLMError::ConfigError(format!(
                "Failed to delete API key: {}",
                e
            ))),
        }?;

        Ok(())
    }

    /// API 키 존재 여부 확인
    pub fn has_api_key(provider: &str) -> bool {
        Self::retrieve_api_key(provider).is_ok()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_store_and_retrieve() {
        let provider = "test_provider";
        let api_key = "test_key_12345";

        // Store
        assert!(SecureKeyStore::store_api_key(provider, api_key).is_ok());

        // Retrieve
        let retrieved = SecureKeyStore::retrieve_api_key(provider).unwrap();
        assert_eq!(retrieved, api_key);

        // Delete
        assert!(SecureKeyStore::delete_api_key(provider).is_ok());

        // Verify deleted
        assert!(!SecureKeyStore::has_api_key(provider));
    }

    #[test]
    fn test_delete_nonexistent_entry_is_ok() {
        let provider = "nonexistent_provider";
        assert!(SecureKeyStore::delete_api_key(provider).is_ok());
    }
}
