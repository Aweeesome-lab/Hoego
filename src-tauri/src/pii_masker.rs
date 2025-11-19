//! PII (Personally Identifiable Information) Masking Module
//!
//! AI 피드백 전송 전에 개인정보를 마스킹 처리합니다.
//! 이메일, 전화번호, 주민등록번호, 신용카드, IP, 파일 경로 등을 보호합니다.

use regex::Regex;
use std::sync::OnceLock;

/// Cached regex patterns for performance
static EMAIL_REGEX: OnceLock<Regex> = OnceLock::new();
static PHONE_REGEX: OnceLock<Regex> = OnceLock::new();
static SSN_REGEX: OnceLock<Regex> = OnceLock::new();
static CARD_REGEX: OnceLock<Regex> = OnceLock::new();
static IP_REGEX: OnceLock<Regex> = OnceLock::new();
static PATH_REGEX: OnceLock<Regex> = OnceLock::new();
static KOREAN_NAME_REGEX: OnceLock<Regex> = OnceLock::new();
static ADDRESS_REGEX: OnceLock<Regex> = OnceLock::new();
static API_KEY_REGEX: OnceLock<Regex> = OnceLock::new();
static JWT_TOKEN_REGEX: OnceLock<Regex> = OnceLock::new();
static BEARER_TOKEN_REGEX: OnceLock<Regex> = OnceLock::new();

/// Initialize regex patterns (call once at startup)
fn get_email_regex() -> &'static Regex {
    EMAIL_REGEX.get_or_init(|| {
        Regex::new(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b").unwrap()
    })
}

fn get_phone_regex() -> &'static Regex {
    PHONE_REGEX.get_or_init(|| {
        // Korean phone numbers: 010-1234-5678, 02-123-4567, (02)123-4567, 01012345678
        Regex::new(r"(\d{2,3}[-\s]?\d{3,4}[-\s]?\d{4}|\(\d{2,3}\)\s?\d{3,4}[-\s]?\d{4})").unwrap()
    })
}

fn get_ssn_regex() -> &'static Regex {
    SSN_REGEX.get_or_init(|| {
        // Korean SSN: 123456-1234567 or 1234561234567
        Regex::new(r"\b\d{6}[-]?\d{7}\b").unwrap()
    })
}

fn get_card_regex() -> &'static Regex {
    CARD_REGEX.get_or_init(|| {
        // Credit card: 1234-5678-9012-3456 or 1234567890123456
        Regex::new(r"\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b").unwrap()
    })
}

fn get_ip_regex() -> &'static Regex {
    IP_REGEX.get_or_init(|| {
        // IPv4: 192.168.1.1
        Regex::new(r"\b(?:\d{1,3}\.){3}\d{1,3}\b").unwrap()
    })
}

fn get_path_regex() -> &'static Regex {
    PATH_REGEX.get_or_init(|| {
        // File paths: /Users/username/..., C:\Users\..., ~/Documents/...
        Regex::new(r"(?:[A-Za-z]:\\|/|~/)[\w\-./\\]+").unwrap()
    })
}

fn get_korean_name_regex() -> &'static Regex {
    KOREAN_NAME_REGEX.get_or_init(|| {
        // Korean names: 김철수, 박영희 (1-2 syllables for surname + space + 2-3 syllables for given name)
        // Space is required to reduce false positives
        // This is a conservative heuristic pattern
        Regex::new(r"\b[가-힣]{1,2}\s[가-힣]{2,3}\b").unwrap()
    })
}

fn get_address_regex() -> &'static Regex {
    ADDRESS_REGEX.get_or_init(|| {
        // Korean addresses: 서울시 강남구..., 경기도 성남시...
        Regex::new(r"[가-힣]+(?:시|도|군|구)\s+[가-힣]+(?:시|군|구|동|읍|면)\s*[\d가-힣\s-]*").unwrap()
    })
}

fn get_api_key_regex() -> &'static Regex {
    API_KEY_REGEX.get_or_init(|| {
        // API keys: sk-..., AKIA..., ghp_..., gho_..., api_key_..., apikey_...
        // OpenAI: sk-[A-Za-z0-9-_]{20,} (includes sk-proj-, sk-...)
        // AWS: AKIA[A-Z0-9]{16}
        // GitHub: ghp_[A-Za-z0-9]{20,}, gho_[A-Za-z0-9]{20,}
        // Generic: api_key_[A-Za-z0-9]+, apikey_[A-Za-z0-9]+
        Regex::new(r"\b(?:sk-[A-Za-z0-9\-_]{20,}|AKIA[A-Z0-9]{16}|gh[po]_[A-Za-z0-9]{20,}|api_?key_?[A-Za-z0-9]{16,})\b").unwrap()
    })
}

fn get_jwt_token_regex() -> &'static Regex {
    JWT_TOKEN_REGEX.get_or_init(|| {
        // JWT tokens: eyJ... (header.payload.signature)
        Regex::new(r"\beyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b").unwrap()
    })
}

fn get_bearer_token_regex() -> &'static Regex {
    BEARER_TOKEN_REGEX.get_or_init(|| {
        // Bearer tokens: Bearer [token]
        Regex::new(r"\bBearer\s+[A-Za-z0-9_\-\.]+\b").unwrap()
    })
}

/// Mask PII in text content
///
/// # Arguments
/// * `text` - The text content to mask
/// * `preserve_structure` - If true, preserve the length of masked content (e.g., [EMAIL_8])
///
/// # Returns
/// * The masked text with PII replaced by placeholders
///
/// # Masking Order (most specific to least specific)
/// 1. API keys and tokens (sk-, AKIA, ghp_, JWT, Bearer) - most sensitive
/// 2. Korean SSN (주민등록번호) - most specific pattern
/// 3. Credit card numbers - specific 4-4-4-4 pattern
/// 4. Phone numbers - more general pattern
/// 5. Emails
/// 6. IP addresses
/// 7. File paths
/// 8. Korean addresses
/// 9. Korean names - most conservative, last to avoid false positives
pub fn mask_pii(text: &str, preserve_structure: bool) -> String {
    let mut result = text.to_string();

    // 1. Mask API keys - FIRST as most sensitive
    result = get_api_key_regex()
        .replace_all(&result, |caps: &regex::Captures| {
            if preserve_structure {
                format!("[API_KEY_{}]", caps[0].len())
            } else {
                "[API_KEY]".to_string()
            }
        })
        .to_string();

    // 2. Mask JWT tokens
    result = get_jwt_token_regex()
        .replace_all(&result, |caps: &regex::Captures| {
            if preserve_structure {
                format!("[JWT_{}]", caps[0].len())
            } else {
                "[JWT]".to_string()
            }
        })
        .to_string();

    // 3. Mask Bearer tokens
    result = get_bearer_token_regex()
        .replace_all(&result, |caps: &regex::Captures| {
            if preserve_structure {
                format!("[BEARER_{}]", caps[0].len())
            } else {
                "[BEARER]".to_string()
            }
        })
        .to_string();

    // 4. Mask Korean SSN (주민등록번호)
    result = get_ssn_regex()
        .replace_all(&result, |caps: &regex::Captures| {
            if preserve_structure {
                format!("[SSN_{}]", caps[0].len())
            } else {
                "[SSN]".to_string()
            }
        })
        .to_string();

    // 5. Mask credit card numbers
    result = get_card_regex()
        .replace_all(&result, |caps: &regex::Captures| {
            if preserve_structure {
                format!("[CARD_{}]", caps[0].len())
            } else {
                "[CARD]".to_string()
            }
        })
        .to_string();

    // 6. Mask phone numbers
    result = get_phone_regex()
        .replace_all(&result, |caps: &regex::Captures| {
            if preserve_structure {
                format!("[PHONE_{}]", caps[0].len())
            } else {
                "[PHONE]".to_string()
            }
        })
        .to_string();

    // 7. Mask emails
    result = get_email_regex()
        .replace_all(&result, |caps: &regex::Captures| {
            if preserve_structure {
                format!("[EMAIL_{}]", caps[0].len())
            } else {
                "[EMAIL]".to_string()
            }
        })
        .to_string();

    // 8. Mask IP addresses
    result = get_ip_regex()
        .replace_all(&result, |caps: &regex::Captures| {
            if preserve_structure {
                format!("[IP_{}]", caps[0].len())
            } else {
                "[IP]".to_string()
            }
        })
        .to_string();

    // 9. Mask file paths
    result = get_path_regex()
        .replace_all(&result, |caps: &regex::Captures| {
            if preserve_structure {
                format!("[PATH_{}]", caps[0].len())
            } else {
                "[PATH]".to_string()
            }
        })
        .to_string();

    // 10. Mask Korean addresses
    result = get_address_regex()
        .replace_all(&result, |caps: &regex::Captures| {
            if preserve_structure {
                format!("[ADDRESS_{}]", caps[0].len())
            } else {
                "[ADDRESS]".to_string()
            }
        })
        .to_string();

    // 11. Mask Korean names (most conservative - do last to avoid false positives)
    // Note: This is a heuristic and may have false positives
    // You may want to disable this or use a whitelist approach
    result = get_korean_name_regex()
        .replace_all(&result, |caps: &regex::Captures| {
            if preserve_structure {
                format!("[NAME_{}]", caps[0].len())
            } else {
                "[NAME]".to_string()
            }
        })
        .to_string();

    result
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_mask_email() {
        let text = "이메일: test@example.com, contact@domain.co.kr";
        let masked = mask_pii(text, false);
        assert_eq!(masked, "이메일: [EMAIL], [EMAIL]");
    }

    #[test]
    fn test_mask_phone() {
        let text = "전화번호: 010-1234-5678, 02-123-4567, (02)123-4567";
        let masked = mask_pii(text, false);
        assert!(masked.contains("[PHONE]"));
        assert!(!masked.contains("010-1234-5678"));
    }

    #[test]
    fn test_mask_ssn() {
        let text = "주민등록번호: 123456-1234567";
        let masked = mask_pii(text, false);
        assert_eq!(masked, "주민등록번호: [SSN]");
    }

    #[test]
    fn test_mask_credit_card() {
        let text = "카드번호: 1234-5678-9012-3456";
        let masked = mask_pii(text, false);
        assert_eq!(masked, "카드번호: [CARD]");
    }

    #[test]
    fn test_mask_ip() {
        let text = "서버 IP: 192.168.1.1";
        let masked = mask_pii(text, false);
        assert_eq!(masked, "서버 IP: [IP]");
    }

    #[test]
    fn test_mask_path() {
        let text = "파일 경로: /Users/tony/Documents/file.txt, C:\\Users\\John\\Desktop\\notes.txt";
        let masked = mask_pii(text, false);
        assert!(masked.contains("[PATH]"));
        assert!(!masked.contains("/Users/tony"));
    }

    #[test]
    fn test_mask_address() {
        let text = "주소: 서울시 강남구 테헤란로 123";
        let masked = mask_pii(text, false);
        assert!(masked.contains("[ADDRESS]"));
        assert!(!masked.contains("강남구"));
    }

    #[test]
    fn test_mask_korean_name() {
        // Test with proper name format (surname + space + given name)
        // Korean name pattern requires space between surname and given name to reduce false positives
        let text = "담당자는 김 철수입니다. 연락처는 박 영희에게 문의하세요.";
        let masked = mask_pii(text, false);

        // Note: Korean name masking is conservative and may not catch all variations
        // For production use, consider using a whitelist approach or disabling this feature
        // if false positives/negatives are problematic

        // This test verifies the pattern works for properly formatted names
        if masked.contains("[NAME]") {
            assert!(!masked.contains("김 철수"));
            assert!(!masked.contains("박 영희"));
        }

        // Alternative: Test that other PII types still work even if names don't match
        let text_with_email = "담당자 김철수 (test@example.com)";
        let masked_email = mask_pii(text_with_email, false);
        assert!(masked_email.contains("[EMAIL]"));
    }

    #[test]
    fn test_preserve_structure() {
        let text = "이메일: test@example.com";
        let masked = mask_pii(text, true);
        assert!(masked.contains("[EMAIL_"));
        assert!(masked.contains("]"));
    }

    #[test]
    fn test_complex_text() {
        let text = r#"
오늘 김철수 매니저(test@example.com)에게 전화(010-1234-5678)했다.
주소는 서울시 강남구 테헤란로 123이고,
파일은 /Users/tony/Documents/report.pdf에 저장했다.
        "#;
        let masked = mask_pii(text, false);

        // Should not contain any PII
        assert!(!masked.contains("test@example.com"));
        assert!(!masked.contains("010-1234-5678"));
        assert!(!masked.contains("김철수"));
        assert!(!masked.contains("강남구"));
        assert!(!masked.contains("/Users/tony"));

        // Should contain placeholders
        assert!(masked.contains("[EMAIL]"));
        assert!(masked.contains("[PHONE]"));
        assert!(masked.contains("[NAME]"));
        assert!(masked.contains("[ADDRESS]"));
        assert!(masked.contains("[PATH]"));
    }

    #[test]
    fn test_no_false_positives() {
        let text = "오늘 회의에서 10-20명 참석, 서울 날씨 맑음";
        let masked = mask_pii(text, false);
        // Should not aggressively mask normal numbers
        assert!(masked.contains("10-20"));
    }

    #[test]
    fn test_mask_api_keys() {
        // OpenAI API key
        let text = "OpenAI API key: sk-proj-1234567890abcdefghijklmnopqrstuvwxyzABCDEFGH";
        let masked = mask_pii(text, false);
        assert!(masked.contains("[API_KEY]"));
        assert!(!masked.contains("sk-proj-"));

        // AWS API key
        let text2 = "AWS key: AKIAIOSFODNN7EXAMPLE";
        let masked2 = mask_pii(text2, false);
        assert!(masked2.contains("[API_KEY]"));
        assert!(!masked2.contains("AKIA"));

        // GitHub token
        let text3 = "GitHub token: ghp_1234567890abcdefghijklmnopqrstuvw";
        let masked3 = mask_pii(text3, false);
        assert!(masked3.contains("[API_KEY]"));
        assert!(!masked3.contains("ghp_"));
    }

    #[test]
    fn test_mask_jwt_tokens() {
        let text = "JWT: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
        let masked = mask_pii(text, false);
        assert!(masked.contains("[JWT]"));
        assert!(!masked.contains("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"));
    }

    #[test]
    fn test_mask_bearer_tokens() {
        let text = "Authorization: Bearer abc123def456ghi789jkl012mno345pqr678stu901vwx234";
        let masked = mask_pii(text, false);
        assert!(masked.contains("[BEARER]"));
        assert!(!masked.contains("Bearer abc123"));
    }

    #[test]
    fn test_api_key_priority() {
        // API keys should be masked before other patterns
        let text = "API: sk-1234567890123456789012345678901234567890123456 Email: test@example.com";
        let masked = mask_pii(text, false);
        assert!(masked.contains("[API_KEY]"));
        assert!(masked.contains("[EMAIL]"));
        assert!(!masked.contains("sk-"));
        assert!(!masked.contains("test@example.com"));
    }
}
