# Phase 1: Backend 모듈 재구성 🦀

**우선순위**: 🔴 HIGH
**예상 소요**: 4-6 시간
**상태**: 📋 준비 완료

---

## 📋 목표

Rust 백엔드 코드를 명확한 모듈 구조로 재구성하여:
- 명확한 책임 분리 (Commands, Services, Models, Utils, Platform)
- 유지보수 가능한 코드 구조
- 테스트 가능한 아키텍처
- 타입 안전성 향상

---

## 📊 진행률

**전체**: 0% (0/42)

---

## 🗂️ 1.1 디렉토리 구조 생성 (0/5)

### 작업 목록

- [ ] `src-tauri/src/commands/` 디렉토리 생성
- [ ] `src-tauri/src/services/` 디렉토리 생성
- [ ] `src-tauri/src/models/` 디렉토리 생성
- [ ] `src-tauri/src/utils/` 디렉토리 생성
- [ ] `src-tauri/src/platform/` 디렉토리 생성

### 실행 명령

```bash
cd src-tauri/src
mkdir -p commands services models utils platform
mkdir -p services/llm/providers
```

### 예상 구조

```
src-tauri/src/
├── commands/          # Tauri IPC commands
├── services/          # 비즈니스 로직
│   └── llm/          # LLM 서비스
│       └── providers/ # LLM 제공자
├── models/            # 데이터 모델
├── utils/             # 유틸리티
├── platform/          # 플랫폼 통합
├── cli/               # CLI (기존 유지)
├── bin/               # 바이너리 (기존 유지)
├── lib.rs
└── main.rs
```

---

## 🔌 1.2 Commands 모듈 구성 (0/9)

### 작업 목록

- [ ] `commands/mod.rs` 생성 및 모듈 선언
- [ ] `commands/dump.rs` - 일지 관련 commands
- [ ] `commands/feedback.rs` - 피드백 관련 commands
- [ ] `commands/retrospect.rs` - 회고 관련 commands
- [ ] `commands/history.rs` - 히스토리 관련 commands
- [ ] `commands/settings.rs` - 설정 관련 commands
- [ ] `commands/ai.rs` - AI 관련 commands
- [ ] `commands/llm.rs` - LLM 관련 commands
- [ ] `commands/window.rs` - 윈도우 관련 commands

### 구현 가이드

**commands/mod.rs 템플릿:**

```rust
// commands/mod.rs
pub mod dump;
pub mod feedback;
pub mod retrospect;
pub mod history;
pub mod settings;
pub mod ai;
pub mod llm;
pub mod window;

// Re-export all commands for easy registration
pub use dump::*;
pub use feedback::*;
pub use retrospect::*;
pub use history::*;
pub use settings::*;
pub use ai::*;
pub use llm::*;
pub use window::*;
```

**개별 Command 파일 템플릿:**

```rust
// commands/dump.rs
use tauri::command;
use crate::services::dump_service;
use crate::models::dump::DumpData;
use crate::models::errors::AppError;

/// 일지를 저장합니다
#[command]
pub async fn save_dump(data: DumpData) -> Result<(), AppError> {
    dump_service::save(data).await
}

/// 일지 목록을 불러옵니다
#[command]
pub async fn load_dumps() -> Result<Vec<DumpData>, AppError> {
    dump_service::load_all().await
}

/// 특정 일지를 불러옵니다
#[command]
pub async fn load_dump(id: String) -> Result<DumpData, AppError> {
    dump_service::load_by_id(&id).await
}
```

### 기존 코드 매핑

현재 `main.rs`나 다른 파일에 있는 Tauri commands를 이 구조로 이동:

```rust
// Before (main.rs or scattered files)
#[tauri::command]
async fn save_dump(...) { ... }

// After (commands/dump.rs)
#[command]
pub async fn save_dump(...) -> Result<...> { ... }
```

---

## 🔧 1.3 Services 모듈 구성 (0/12)

### 작업 목록

- [ ] `services/mod.rs` 생성 및 모듈 선언
- [ ] `services/dump_service.rs` - 일지 비즈니스 로직
- [ ] `services/feedback_service.rs` - 피드백 비즈니스 로직
- [ ] `services/retrospect_service.rs` - 회고 비즈니스 로직
- [ ] `services/history_service.rs` - 히스토리 비즈니스 로직 (기존 `history.rs` 이동)
- [ ] `services/ai_service.rs` - AI 통합 로직 (기존 `ai_summary.rs` 이동)
- [ ] `services/storage_service.rs` - 파일 저장/로드
- [ ] `services/llm/mod.rs` 생성
- [ ] `services/llm/engine.rs` 이동 (기존 `llm/engine.rs`)
- [ ] `services/llm/summarize.rs` 이동 (기존 `llm/summarize.rs`)
- [ ] `services/llm/download.rs` 이동 (기존 `llm/download.rs`)
- [ ] `services/llm/providers/` 이동 (기존 `llm/providers/`)

### 구현 가이드

**services/mod.rs 템플릿:**

```rust
// services/mod.rs
pub mod dump_service;
pub mod feedback_service;
pub mod retrospect_service;
pub mod history_service;
pub mod ai_service;
pub mod storage_service;
pub mod llm;
```

**Service 파일 템플릿:**

```rust
// services/dump_service.rs
use crate::models::dump::DumpData;
use crate::models::errors::AppError;
use crate::services::storage_service;
use std::path::PathBuf;

/// 일지를 저장합니다
pub async fn save(data: DumpData) -> Result<(), AppError> {
    let path = get_dump_path(&data.id)?;
    storage_service::write_json(&path, &data).await?;
    Ok(())
}

/// 모든 일지를 불러옵니다
pub async fn load_all() -> Result<Vec<DumpData>, AppError> {
    let dir = get_dumps_dir()?;
    storage_service::read_json_files(&dir).await
}

/// 일지 저장 경로를 반환합니다
fn get_dump_path(id: &str) -> Result<PathBuf, AppError> {
    // ...
}

fn get_dumps_dir() -> Result<PathBuf, AppError> {
    // ...
}
```

### 기존 코드 이동 계획

**ai_summary.rs → services/ai_service.rs:**
```rust
// 기존: src-tauri/src/ai_summary.rs (18,971 bytes)
// 이동: src-tauri/src/services/ai_service.rs
// 리팩토링:
// - Command 로직은 commands/ai.rs로 분리
// - 비즈니스 로직만 ai_service.rs에 유지
```

**history.rs → services/history_service.rs:**
```rust
// 기존: src-tauri/src/history.rs (12,982 bytes)
// 이동: src-tauri/src/services/history_service.rs
// 리팩토링:
// - Command 로직은 commands/history.rs로 분리
// - 히스토리 관리 로직만 유지
```

**llm/ → services/llm/:**
```bash
# 기존 llm/ 디렉토리 전체를 services/ 아래로 이동
mv src-tauri/src/llm src-tauri/src/services/llm
```

---

## 📦 1.4 Models 모듈 구성 (0/7)

### 작업 목록

- [ ] `models/mod.rs` 생성 및 모듈 선언
- [ ] `models/dump.rs` - 일지 데이터 모델
- [ ] `models/feedback.rs` - 피드백 데이터 모델
- [ ] `models/retrospect.rs` - 회고 데이터 모델
- [ ] `models/settings.rs` - 설정 데이터 모델 (기존 `app_settings.rs` 데이터 부분)
- [ ] `models/paths.rs` - 경로 구조체
- [ ] `models/errors.rs` - 에러 타입 정의

### 구현 가이드

**models/mod.rs 템플릿:**

```rust
// models/mod.rs
pub mod dump;
pub mod feedback;
pub mod retrospect;
pub mod settings;
pub mod paths;
pub mod errors;
```

**Data Model 템플릿:**

```rust
// models/dump.rs
use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DumpData {
    pub id: String,
    pub content: String,
    pub timestamp: DateTime<Utc>,
    pub tags: Vec<String>,
}

impl DumpData {
    pub fn new(content: String) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            content,
            timestamp: Utc::now(),
            tags: Vec::new(),
        }
    }
}
```

**Error Model 템플릿:**

```rust
// models/errors.rs
use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Debug, Error, Serialize, Deserialize)]
pub enum AppError {
    #[error("파일을 찾을 수 없습니다: {0}")]
    FileNotFound(String),

    #[error("권한이 없습니다: {0}")]
    PermissionDenied(String),

    #[error("네트워크 오류: {0}")]
    NetworkError(String),

    #[error("검증 오류: {0}")]
    ValidationError(String),

    #[error("내부 오류: {0}")]
    InternalError(String),
}

impl AppError {
    pub fn code(&self) -> &str {
        match self {
            Self::FileNotFound(_) => "FILE_NOT_FOUND",
            Self::PermissionDenied(_) => "PERMISSION_DENIED",
            Self::NetworkError(_) => "NETWORK_ERROR",
            Self::ValidationError(_) => "VALIDATION_ERROR",
            Self::InternalError(_) => "INTERNAL_ERROR",
        }
    }
}
```

---

## 🛠️ 1.5 Utils 모듈 구성 (0/5)

### 작업 목록

- [ ] `utils/mod.rs` 생성 및 모듈 선언
- [ ] `utils/pii_masker.rs` - PII 마스킹 (기존 `pii_masker.rs` 이동)
- [ ] `utils/logger.rs` - 로깅 유틸리티
- [ ] `utils/datetime.rs` - 날짜/시간 처리
- [ ] `utils/link_preview.rs` - 링크 프리뷰 (기존 `link_preview.rs` 이동)

### 이동 작업

```bash
# 기존 파일을 utils/로 이동
mv src-tauri/src/pii_masker.rs src-tauri/src/utils/
mv src-tauri/src/link_preview.rs src-tauri/src/utils/
```

### 새로 생성할 파일

**utils/datetime.rs 템플릿:**

```rust
// utils/datetime.rs
use chrono::{DateTime, Utc, NaiveDateTime};
use crate::models::errors::AppError;

/// ISO 8601 문자열을 DateTime으로 파싱
pub fn parse_iso8601(s: &str) -> Result<DateTime<Utc>, AppError> {
    DateTime::parse_from_rfc3339(s)
        .map(|dt| dt.with_timezone(&Utc))
        .map_err(|e| AppError::ValidationError(format!("Invalid datetime: {}", e)))
}

/// DateTime을 ISO 8601 문자열로 포맷
pub fn format_iso8601(dt: &DateTime<Utc>) -> String {
    dt.to_rfc3339()
}

/// 파일명용 타임스탬프 생성 (2025-01-21_14-30-00)
pub fn format_filename_timestamp(dt: &DateTime<Utc>) -> String {
    dt.format("%Y-%m-%d_%H-%M-%S").to_string()
}
```

---

## 🖥️ 1.6 Platform 모듈 구성 (0/4)

### 작업 목록

- [ ] `platform/mod.rs` 생성 및 모듈 선언
- [ ] `platform/tray.rs` - 시스템 트레이 (기존 `tray.rs` 이동)
- [ ] `platform/window_manager.rs` - 윈도우 관리 (기존 `window_manager.rs` 이동)
- [ ] `platform/shortcuts.rs` - 단축키 (기존 `shortcuts.rs` 이동)

### 이동 작업

```bash
# 기존 파일을 platform/으로 이동
mv src-tauri/src/tray.rs src-tauri/src/platform/
mv src-tauri/src/window_manager.rs src-tauri/src/platform/
mv src-tauri/src/shortcuts.rs src-tauri/src/platform/
```

---

## 🧹 1.7 루트 레벨 정리 (0/7)

### 작업 목록

- [ ] `ai_summary.rs` → `services/ai_service.rs` 이동 및 분리
- [ ] `app_settings.rs` → `models/settings.rs` + `services/settings_service.rs` 분리
- [ ] `history.rs` → `services/history_service.rs` 이동 및 분리
- [ ] `model_selection.rs` → 적절한 모듈로 이동 (models/ or services/)
- [ ] `weekly_data.rs` → `services/weekly_service.rs` 이동
- [ ] `utils.rs` → `utils/` 세분화 (필요시)
- [ ] `lib.rs` 및 `main.rs` 모듈 선언 업데이트

### lib.rs 업데이트

```rust
// lib.rs
pub mod commands;
pub mod services;
pub mod models;
pub mod utils;
pub mod platform;
pub mod cli;

// Tauri command registration helper
pub fn register_commands(app: tauri::Builder) -> tauri::Builder {
    app.invoke_handler(tauri::generate_handler![
        // Commands
        commands::save_dump,
        commands::load_dumps,
        commands::load_dump,
        commands::save_feedback,
        commands::load_feedback,
        commands::save_retrospect,
        commands::load_retrospect,
        commands::load_history,
        commands::save_settings,
        commands::load_settings,
        commands::summarize_text,
        commands::open_history_window,
        commands::open_settings_window,
        // ... 나머지 commands
    ])
}
```

### main.rs 간소화

```rust
// main.rs
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use hoego::{register_commands, platform};

fn main() {
    // 로깅 초기화
    tracing_subscriber::fmt::init();

    // Tauri 앱 빌드
    let app = tauri::Builder::default();

    // Commands 등록
    let app = register_commands(app);

    // 플랫폼 기능 설정
    let app = platform::setup(app);

    // 실행
    app.run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

---

## ✅ 완료 체크리스트

### 디렉토리 구조
- [ ] 모든 디렉토리가 생성되었는가?
- [ ] mod.rs 파일들이 올바르게 생성되었는가?

### 코드 이동
- [ ] 기존 파일들이 올바른 위치로 이동되었는가?
- [ ] import 경로가 업데이트되었는가?
- [ ] 누락된 파일이 없는가?

### 컴파일
- [ ] `cargo build` 성공하는가?
- [ ] `cargo clippy` 경고 없는가?
- [ ] `cargo test` 통과하는가?

### 기능 테스트
- [ ] 앱이 정상적으로 실행되는가?
- [ ] 각 기능이 정상 작동하는가?
- [ ] 에러 처리가 올바른가?

---

## 📝 참고 사항

### Import 경로 변경

```rust
// Before
use crate::ai_summary;
use crate::history;

// After
use crate::services::ai_service;
use crate::services::history_service;
use crate::commands;
use crate::models::errors::AppError;
```

### 테스트 코드

각 모듈별로 테스트 코드도 함께 작성:

```rust
// services/dump_service.rs
#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_save_dump() {
        // 테스트 코드
    }
}
```

---

**다음 Phase**: [Phase 2: Frontend 컴포넌트 추출](./phase-2-frontend-components.md)

**관련 문서**:
- [아키텍처 - 프로젝트 구조](../architecture/프로젝트-구조.md)
- [리팩토링 계획](../refactoring-plan.md)
- [리팩토링 진행 상황](../refactoring-progress.md)
