# Phase 3: IPC & 타입 안전성 🔗

**우선순위**: 🟡 MEDIUM
**예상 소요**: 3-4 시간
**상태**: ⏳ 대기 중 (Phase 1, 2 완료 후)

---

## 📋 목표

Frontend-Backend 통신의 타입 안전성을 확보하여:
- Rust 타입에서 TypeScript 타입 자동 생성
- 컴파일 타임 타입 체크
- 런타임 에러 최소화
- 사용자 친화적 에러 처리

---

## 📊 진행률

**전체**: 0% (0/10)

---

## 🔧 3.1 Tauri Commands 타입 생성 (0/3)

### 작업 목록

- [ ] **tauri-specta 설정**
  ```bash
  cd src-tauri
  cargo add tauri-specta specta --features typescript
  ```

- [ ] **Rust 타입에서 TypeScript 타입 자동 생성**
  - `src-tauri/src/lib.rs`에 specta 설정 추가
  - 빌드 스크립트 생성
  - 타입 생성 명령 추가

- [ ] **tauri-commands.ts 자동 갱신 설정**
  - CI/CD에 타입 생성 단계 추가
  - Pre-commit hook 설정 고려
  - 개발 워크플로우 문서화

### 구현 예시

**Cargo.toml 업데이트:**

```toml
[dependencies]
tauri-specta = "2.0"
specta = { version = "2.0", features = ["typescript"] }
```

**lib.rs 설정:**

```rust
// src-tauri/src/lib.rs
use specta::Type;
use tauri_specta::*;

// 타입 export
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct DumpData {
    pub id: String,
    pub content: String,
    pub timestamp: String,
}

// 명령어 export
#[tauri::command]
#[specta::specta]
pub async fn save_dump(data: DumpData) -> Result<(), String> {
    // ...
}

// 타입 생성 함수
pub fn generate_types() {
    let builder = ts::builder()
        .commands(collect_commands![
            save_dump,
            load_dumps,
            // ... 모든 commands
        ]);

    builder
        .export(
            Typescript::default(),
            "../src/types/tauri-commands.ts",
        )
        .unwrap();
}
```

**build.rs 생성:**

```rust
// src-tauri/build.rs
fn main() {
    // 개발 모드에서만 타입 생성
    #[cfg(debug_assertions)]
    {
        hoego::generate_types();
    }

    tauri_build::build()
}
```

---

## ❌ 3.2 에러 처리 표준화 (0/4)

### 작업 목록

- [ ] **Rust AppError 타입 정의**
  - `models/errors.rs`에 통합 에러 타입
  - `thiserror` crate 활용
  - 에러 코드 체계 정의

- [ ] **Frontend 에러 매핑 구현**
  - `src/constants/errors.ts` 생성
  - 에러 코드 → 사용자 메시지 매핑
  - 다국어 지원 준비

- [ ] **에러 바운더리 구현**
  - `components/ErrorBoundary.tsx` 생성
  - 전역 에러 핸들러
  - 에러 리포팅 (선택)

- [ ] **사용자 친화적 에러 메시지**
  - 각 에러 타입별 안내 메시지
  - 해결 방법 제시
  - 에러 복구 UI

### Rust 에러 타입

```rust
// models/errors.rs
use thiserror::Error;
use serde::{Serialize, Deserialize};

#[derive(Debug, Error, Serialize, Deserialize, specta::Type)]
#[serde(tag = "type", content = "message")]
pub enum AppError {
    #[error("파일을 찾을 수 없습니다: {0}")]
    FileNotFound(String),

    #[error("권한이 없습니다: {0}")]
    PermissionDenied(String),

    #[error("네트워크 오류: {0}")]
    NetworkError(String),

    #[error("검증 오류: {0}")]
    ValidationError(String),

    #[error("LLM 오류: {0}")]
    LLMError(String),

    #[error("내부 오류: {0}")]
    InternalError(String),
}

impl AppError {
    pub fn code(&self) -> &'static str {
        match self {
            Self::FileNotFound(_) => "FILE_NOT_FOUND",
            Self::PermissionDenied(_) => "PERMISSION_DENIED",
            Self::NetworkError(_) => "NETWORK_ERROR",
            Self::ValidationError(_) => "VALIDATION_ERROR",
            Self::LLMError(_) => "LLM_ERROR",
            Self::InternalError(_) => "INTERNAL_ERROR",
        }
    }
}
```

### Frontend 에러 매핑

```typescript
// src/constants/errors.ts
export const ERROR_MESSAGES: Record<string, ErrorMessage> = {
  FILE_NOT_FOUND: {
    title: '파일을 찾을 수 없습니다',
    message: '요청한 파일이 존재하지 않거나 삭제되었습니다.',
    action: '파일 목록을 새로고침하거나 다른 파일을 선택해주세요.',
  },
  PERMISSION_DENIED: {
    title: '권한이 없습니다',
    message: '파일에 접근할 권한이 없습니다.',
    action: '파일 권한을 확인하거나 관리자에게 문의하세요.',
  },
  NETWORK_ERROR: {
    title: '네트워크 오류',
    message: '네트워크 연결에 문제가 있습니다.',
    action: '인터넷 연결을 확인하고 다시 시도해주세요.',
  },
  LLM_ERROR: {
    title: 'AI 처리 오류',
    message: 'AI 모델 처리 중 오류가 발생했습니다.',
    action: 'LLM 설정을 확인하거나 잠시 후 다시 시도해주세요.',
  },
};

export function getErrorMessage(code: string, fallback?: string): ErrorMessage {
  return ERROR_MESSAGES[code] || {
    title: '오류 발생',
    message: fallback || '알 수 없는 오류가 발생했습니다.',
    action: '잠시 후 다시 시도해주세요.',
  };
}
```

### Error Boundary

```typescript
// components/ErrorBoundary.tsx
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: (error: Error) => ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error!);
      }
      return (
        <div className="error-boundary">
          <h2>문제가 발생했습니다</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>
            새로고침
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

## 🔌 3.3 IPC 클라이언트 래퍼 (0/3)

### 작업 목록

- [ ] **lib/tauri.ts 강화**
  - 타입 안전한 invoke 래퍼
  - 자동 에러 변환
  - 로딩 상태 관리

- [ ] **타입 안전한 invoke 래퍼**
  - TypeScript generic을 활용한 타입 추론
  - 자동완성 지원
  - 컴파일 타임 체크

- [ ] **재시도 로직 구현**
  - 네트워크 오류 시 자동 재시도
  - Exponential backoff
  - 최대 재시도 횟수 설정

### Tauri 클라이언트 래퍼

```typescript
// lib/tauri.ts
import { invoke as tauriInvoke } from '@tauri-apps/api';
import type { Commands } from '@/types/tauri-commands';
import { getErrorMessage } from '@/constants/errors';

interface InvokeOptions {
  retry?: number;
  retryDelay?: number;
}

/**
 * 타입 안전한 Tauri invoke 래퍼
 */
export async function invoke<T extends keyof Commands>(
  command: T,
  args?: Commands[T]['input'],
  options: InvokeOptions = {}
): Promise<Commands[T]['output']> {
  const { retry = 0, retryDelay = 1000 } = options;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= retry; attempt++) {
    try {
      const result = await tauriInvoke(command, args);
      return result as Commands[T]['output'];
    } catch (error) {
      lastError = error as Error;

      // 마지막 시도가 아니면 재시도
      if (attempt < retry) {
        await delay(retryDelay * Math.pow(2, attempt));
        continue;
      }
    }
  }

  // 에러 변환
  throw transformError(lastError!);
}

function transformError(error: Error): AppError {
  // Rust AppError를 TypeScript로 변환
  try {
    const parsed = JSON.parse(error.message);
    const errorMsg = getErrorMessage(parsed.type, parsed.message);
    return { ...errorMsg, code: parsed.type, original: error };
  } catch {
    return {
      title: '오류 발생',
      message: error.message,
      action: '다시 시도해주세요.',
      code: 'UNKNOWN',
      original: error,
    };
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

### React Hook으로 래핑

```typescript
// hooks/useTauriCommand.ts
import { useState } from 'react';
import { invoke } from '@/lib/tauri';
import type { Commands } from '@/types/tauri-commands';

export function useTauriCommand<T extends keyof Commands>(
  command: T
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const [data, setData] = useState<Commands[T]['output'] | null>(null);

  const execute = async (args?: Commands[T]['input']) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await invoke(command, args, { retry: 2 });
      setData(result);
      return result;
    } catch (err) {
      setError(err as AppError);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { execute, isLoading, error, data };
}

// 사용 예시
function MyComponent() {
  const { execute, isLoading, error } = useTauriCommand('save_dump');

  const handleSave = async () => {
    try {
      await execute({ content: 'test', timestamp: new Date().toISOString() });
      toast.success('저장 완료');
    } catch (error) {
      toast.error(error.message);
    }
  };

  return <button onClick={handleSave} disabled={isLoading}>저장</button>;
}
```

---

## ✅ 완료 체크리스트

### 타입 안전성
- [ ] Rust → TypeScript 타입 생성이 자동화되었는가?
- [ ] 모든 Tauri commands에 타입이 정의되었는가?
- [ ] Frontend에서 타입 체크가 작동하는가?

### 에러 처리
- [ ] 모든 에러 타입이 정의되었는가?
- [ ] 사용자 친화적 메시지가 준비되었는가?
- [ ] 에러 바운더리가 구현되었는가?

### IPC 클라이언트
- [ ] invoke 래퍼가 구현되었는가?
- [ ] 재시도 로직이 작동하는가?
- [ ] 로딩/에러 상태가 관리되는가?

### 테스트
- [ ] 타입 생성이 테스트되었는가?
- [ ] 에러 처리가 테스트되었는가?
- [ ] IPC 통신이 안정적인가?

---

## 🔗 관련 문서

- [IPC 통신 패턴](../architecture/ipc-통신-패턴.md)
- [에러 처리](../architecture/ipc-통신-패턴.md#에러-처리)
- [타입 정의](../architecture/ipc-통신-패턴.md#타입-정의-tauri-specta-활용)

---

**이전 Phase**: [Phase 2: Frontend 컴포넌트 추출](./phase-2-frontend-components.md)
**다음 Phase**: [Phase 4: 폼 관리 & 검증](./phase-4-form-validation.md)
