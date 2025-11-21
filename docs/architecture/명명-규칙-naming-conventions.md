# 명명 규칙 (Naming Conventions)

## 파일명

**Rust:**
```yaml
모듈: snake_case.rs
예: dump_service.rs, ai_service.rs
```

**TypeScript:**
```yaml
컴포넌트: kebab-case.tsx
  예: dump-panel.tsx, file-item.tsx

Hooks: useXxx.ts
  예: useHistory.ts, useCloudLLM.ts

Services: xxxService.ts
  예: historyService.ts, aiService.ts

Utils: camelCase.ts
  예: datetime.ts, piiMask.ts

Types: kebab-case.ts
  예: tauri-commands.ts, cloud-llm.ts

Constants: camelCase.ts
  예: prompts.ts, templates.ts

Tests: {원본}.test.ts(x)
  예: dump-panel.test.tsx
```

## 코드 내 명명

**Rust:**
```rust
// 함수: snake_case
fn save_dump(content: String) -> Result<String, AppError>

// 변수: snake_case
let file_path = "dumps/2025-01-21.md";

// 상수: SCREAMING_SNAKE_CASE
const MAX_FILE_SIZE: usize = 10_000_000;

// 구조체/Enum: PascalCase
struct DumpData { ... }
enum ErrorCode { ... }
```

**TypeScript:**
```typescript
// 함수: camelCase
function saveDump(content: string): Promise<string>

// 변수: camelCase
const filePath = 'dumps/2025-01-21.md';

// 상수: SCREAMING_SNAKE_CASE
const MAX_FILE_SIZE = 10_000_000;

// 타입/인터페이스: PascalCase
interface DumpData { ... }
type ErrorCode = '...'

// 컴포넌트: PascalCase
export function DumpPanel() { ... }

// 약어 처리
// - 타입명: AI, LLM, PII (대문자)
// - 변수명: aiService, llmConfig (camelCase)
// - 파일명: ai-panel.tsx (kebab-case)
```

## Tauri Commands

```rust
// 명명 규칙: {리소스}_{액션}
#[tauri::command]
fn save_dump(content: String, timestamp: String) -> Result<(), AppError>

#[tauri::command]
fn get_feedback(dump_id: String) -> Result<FeedbackData, AppError>

#[tauri::command]
fn list_retrospects(limit: u32) -> Result<Vec<RetrospectMeta>, AppError>
```

---
