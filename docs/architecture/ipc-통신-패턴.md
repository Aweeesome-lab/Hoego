# IPC & 통신 패턴

## Tauri IPC (Frontend → Backend)

**중앙화된 IPC 클라이언트:**

```typescript
// src/lib/tauri.ts
import { invoke } from '@tauri-apps/api/tauri';
import type { DumpData, FeedbackData } from '@/types';

export const tauriAPI = {
  // Dump 관련
  async saveDump(content: string): Promise<string> {
    return invoke('save_dump', { content, timestamp: nowUTC() });
  },

  async getDump(id: string): Promise<DumpData> {
    return invoke('get_dump', { id });
  },

  // Feedback 관련
  async generateFeedback(dumpId: string): Promise<FeedbackData> {
    return invoke('generate_feedback', { dumpId });
  },

  // 에러 처리 통합
  async safeInvoke<T>(
    command: string,
    args?: Record<string, any>
  ): Promise<T> {
    try {
      return await invoke(command, args);
    } catch (error) {
      const message = handleTauriError(error);
      toast.error(message);
      throw error;
    }
  },
};
```

## 타입 정의 (tauri-specta 활용)

**Rust에서 자동 생성:**

```rust
// src-tauri/build.rs
use tauri_specta::ts;

fn main() {
    ts::export(
        collect_commands![
            save_dump,
            get_dump,
            generate_feedback,
            // ...
        ],
        "../src/types/tauri-commands.ts",
    )
    .unwrap();
}
```

**TypeScript에서 사용:**

```typescript
// src/types/tauri-commands.ts (자동 생성)
export interface DumpData {
  id: string;
  content: string;
  timestamp: string;
}

export interface FeedbackData {
  dumpId: string;
  feedback: string;
  createdAt: string;
}
```

## 에러 처리

**Rust:**

```rust
// src-tauri/src/models/errors.rs
#[derive(Debug, Serialize)]
pub struct AppError {
    pub code: String,      // "FILE_NOT_FOUND", "PERMISSION_DENIED"
    pub message: String,   // 기술적 메시지 (로그용)
}

impl AppError {
    pub fn new(code: &str, message: &str) -> Self {
        Self {
            code: code.to_string(),
            message: message.to_string(),
        }
    }
}

// 사용 예
return Err(AppError::new("FILE_NOT_FOUND", "Dump file not found"));
```

**TypeScript:**

```typescript
// src/constants/errors.ts
export const ERROR_MESSAGES: Record<string, string> = {
  FILE_NOT_FOUND: '파일을 찾을 수 없습니다.',
  PERMISSION_DENIED: '권한이 없습니다. 설정을 확인해주세요.',
  NETWORK_ERROR: '네트워크 오류가 발생했습니다.',
  AI_SERVICE_ERROR: 'AI 서비스에 문제가 발생했습니다.',
  INVALID_INPUT: '입력값이 올바르지 않습니다.',
} as const;

// src/services/errorHandler.ts
export function handleTauriError(error: any): string {
  const errorCode = error?.code || 'UNKNOWN_ERROR';
  return ERROR_MESSAGES[errorCode] || '알 수 없는 오류가 발생했습니다.';
}
```

---
