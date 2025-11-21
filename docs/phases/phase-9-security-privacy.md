# Phase 9: 보안 & 프라이버시 강화 🔒

**우선순위**: 🔴 HIGH (프로덕션 전 필수)
**예상 소요**: 2-3 시간
**상태**: ⏳ 대기 중

---

## 📋 목표

데이터 보호 및 보안 강화:
- PII 보호 강화
- Tauri Capabilities 최소 권한
- 로깅 필터링
- LLM 전송 데이터 최소화

---

## 📊 진행률

**전체**: 0% (0/6)

---

## 🛡️ 9.1 PII 보호 (0/3)

### 작업 목록

- [ ] PII 마스킹 규칙 검토
- [ ] 로깅 필터링
- [ ] LLM 전송 데이터 최소화

### PII 마스킹 강화

```rust
// utils/pii_masker.rs
use regex::Regex;

pub fn mask_email(text: &str) -> String {
    let re = Regex::new(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b").unwrap();
    re.replace_all(text, "[EMAIL]").to_string()
}

pub fn mask_phone(text: &str) -> String {
    let re = Regex::new(r"\b\d{2,3}-\d{3,4}-\d{4}\b").unwrap();
    re.replace_all(text, "[PHONE]").to_string()
}

pub fn mask_all_pii(text: &str) -> String {
    let mut masked = text.to_string();
    masked = mask_email(&masked);
    masked = mask_phone(&masked);
    // ... 추가 PII 타입
    masked
}
```

---

## 🔐 9.2 Tauri Capabilities (0/3)

### 작업 목록

- [ ] 최소 권한 원칙 적용
- [ ] 파일 시스템 접근 제한
- [ ] 네트워크 접근 제한

### Tauri 설정

```json
// tauri.conf.json
{
  "tauri": {
    "allowlist": {
      "fs": {
        "scope": ["$APPDATA/*"],
        "readFile": true,
        "writeFile": true,
        "readDir": true,
        "createDir": true
      },
      "http": {
        "scope": ["https://api.openai.com/*"]
      },
      "shell": {
        "open": false
      }
    }
  }
}
```

---

## ✅ 완료 체크리스트

- [ ] PII가 로그에 노출되지 않는가?
- [ ] Tauri capabilities가 최소 권한으로 설정되었는가?
- [ ] LLM 전송 데이터가 최소화되었는가?
- [ ] 보안 감사가 완료되었는가?

---

**이전 Phase**: [Phase 8: 성능 최적화](./phase-8-performance.md)
**다음 Phase**: [Phase 10: 최종 정리](./phase-10-final.md)
