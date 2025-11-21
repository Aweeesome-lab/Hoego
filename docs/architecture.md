# Hoego 리팩토링 아키텍처

## 개요

**프로젝트명:** Hoego v0.1.0 (베타 개발 중)
**설명:** AI 기반 일지 회고 앱 - Dump-Feedback-Retrospect 3단계 워크플로우
**기술 스택:** Rust + Tauri 1.x + React 18.2 + TypeScript + Vite

**핵심 워크플로우:**
1. **Dump** - 사용자가 일지 작성
2. **Feedback** - AI가 피드백 제공
3. **Retrospect** - 회고 작성 및 정리

---

## 아키텍처 결정 요약

| 카테고리 | 결정 사항 | 버전/상세 | 사유 |
|---------|----------|----------|------|
| **프로젝트** | 버전 | 0.1.0 | 베타 개발 중 |
| | 설명 | AI 기반 일지 회고 앱 | Dump-Feedback-Retrospect 워크플로우 |
| **프론트엔드** | 프레임워크 | React 18.2 + TypeScript | 안정적, 타입 안전성 |
| | 빌드 도구 | Vite | 빠른 개발 서버 |
| | 스타일링 | Tailwind CSS | 유틸리티 우선 |
| | 상태 관리 | Zustand | 가볍고 단순 |
| | **폼 관리** | **React Hook Form 7.66.1** ✨ | 성능 우수, 8.6kB, 쉬운 검증 |
| | **검증** | **Zod** ✨ | TypeScript 통합, 타입 안전성 |
| | UI 컴포넌트 | Radix UI + 커스텀 | 접근성, 커스터마이징 |
| | 테스팅 | Vitest + Testing Library | Vite 호환 |
| **백엔드** | 프레임워크 | Tauri 1.x | Rust + 웹 표준 데스크톱 |
| | 언어 | Rust 2021 Edition | 성능, 안정성, 타입 안전성 |
| | 로깅 | tracing | 구조화된 로깅 |
| | 로그 레벨 | 개발: ERROR / 프로덕션: CRITICAL | 프라이버시 우선 |
| **프라이버시** | 로깅 정책 | ZERO/최소화 | PII 절대 로깅 금지 |
| | 데이터 전송 | 필요 최소한만 | LLM 전송 시 메타데이터 제거 |
| | 로그 저장 | 로컬만 | 외부 서비스 사용 금지 |

---

## 프로젝트 구조

### Frontend (src/)

```
src/
├── apps/                           # 멀티 윈도우 앱
│   ├── main/
│   │   └── main.tsx
│   ├── history/
│   │   ├── history.tsx
│   │   └── components/
│   │       ├── app.tsx
│   │       ├── file-list.tsx
│   │       ├── file-item.tsx
│   │       └── empty-state.tsx
│   └── settings/
│       ├── settings.tsx
│       └── components/
│           ├── general-settings.tsx
│           ├── llm-settings.tsx
│           ├── cloud-llm-settings.tsx
│           ├── prompt-settings.tsx
│           ├── template-settings.tsx
│           └── weekly-dashboard.tsx
├── components/                     # 공유 컴포넌트
│   ├── panels/
│   │   ├── dump-panel.tsx          # 1단계: Dump
│   │   ├── feedback-panel.tsx      # 2단계: Feedback
│   │   ├── retrospect-panel.tsx    # 3단계: Retrospect
│   │   └── history-section.tsx
│   ├── layout/
│   │   ├── header.tsx
│   │   ├── footer.tsx
│   │   ├── sidebar.tsx
│   │   ├── mini-header.tsx
│   │   └── floating-mini-bar.tsx
│   ├── markdown/
│   │   ├── renderer.tsx
│   │   ├── components.tsx
│   │   └── link-preview.tsx
│   ├── ui/                         # 재사용 UI 컴포넌트
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── textarea.tsx
│   │   ├── select.tsx
│   │   ├── checkbox.tsx
│   │   ├── switch.tsx
│   │   ├── card.tsx
│   │   └── badge.tsx
│   ├── model-selector.tsx
│   ├── note-summarizer.tsx
│   └── template-picker.tsx
├── hooks/                          # Custom Hooks
│   ├── useHistory.ts
│   ├── useCloudLLM.ts
│   ├── useAiPipeline.ts
│   ├── useTheme.ts
│   └── useAppShortcuts.ts
├── services/                       # 비즈니스 로직
│   ├── historyService.ts
│   ├── settingsService.ts
│   ├── aiService.ts
│   └── errorHandler.ts
├── lib/                            # 라이브러리 래퍼
│   ├── tauri.ts                    # Tauri IPC 클라이언트
│   ├── llm.ts
│   ├── cloud-llm.ts
│   ├── utils.ts
│   └── ai/
│       ├── client.ts
│       └── presets.ts
├── store/                          # Zustand 스토어
│   └── appStore.ts
├── types/                          # TypeScript 타입
│   ├── global.d.ts
│   ├── ai.ts
│   ├── cloud-llm.ts
│   ├── tauri-commands.ts           # Tauri 자동 생성
│   └── view-mode.ts
├── constants/                      # 상수 (중앙 관리)
│   ├── index.ts
│   ├── prompts.ts                  # AI 프롬프트
│   ├── templates.ts                # 회고 템플릿
│   ├── routes.ts
│   ├── errors.ts                   # 에러 코드 매핑
│   ├── paths.ts                    # 데이터 경로
│   └── config.ts
├── utils/                          # 유틸리티
│   ├── pii-mask.ts
│   ├── datetime.ts
│   └── __tests__/
└── styles/
    └── index.css
```

### Backend (src-tauri/src/)

```
src-tauri/src/
├── commands/                       # Tauri Commands (3단계 워크플로우)
│   ├── mod.rs
│   ├── dump.rs                     # STAGE 1: 일지 작성/조회 ✅
│   ├── feedback.rs                 # STAGE 2: AI 피드백 ✅
│   ├── retrospect.rs               # STAGE 3: 회고 ✅
│   ├── history.rs                  # 히스토리 탐색 (사이드바용) ✅
│   ├── settings.rs                 # 설정 관련 commands ✅
│   ├── llm.rs                      # LLM commands (placeholder)
│   └── window.rs                   # 윈도우 commands (placeholder)
├── services/                       # 비즈니스 로직
│   ├── mod.rs
│   ├── ai_service.rs               # AI 서비스 (placeholder)
│   ├── feedback_service.rs         # 피드백 비즈니스 로직 ✅
│   ├── history_service.rs          # 히스토리 비즈니스 로직 ✅
│   ├── storage_service.rs          # 파일 저장/로드 ✅
│   ├── weekly_service.rs           # 주간 데이터 집계 ✅
│   └── llm/                        # LLM 서비스 ✅
│       ├── mod.rs
│       ├── commands.rs             # Cloud LLM commands
│       ├── engine.rs               # LLM 엔진 (llama.cpp)
│       ├── models.rs               # 모델 정보
│       ├── download.rs             # 모델 다운로드
│       ├── summarize.rs            # 요약 기능
│       ├── security.rs             # 보안 검증
│       ├── traits.rs               # LLM traits
│       ├── types.rs                # LLM 타입
│       ├── prompts.rs              # 프롬프트 템플릿
│       ├── prompt_config.rs        # 프롬프트 설정
│       └── providers/
│           ├── mod.rs
│           └── openai.rs
├── models/                         # 데이터 모델
│   ├── mod.rs
│   ├── dump.rs                     # 일지/히스토리 데이터 모델 ✅
│   ├── feedback.rs                 # 피드백 데이터 모델 ✅
│   ├── weekly.rs                   # 주간 데이터 모델 ✅
│   ├── settings.rs                 # 설정 데이터 모델 ✅
│   ├── paths.rs                    # 경로 구조체 ✅
│   └── errors.rs                   # 에러 타입 정의 ✅
├── utils/                          # 유틸리티
│   ├── mod.rs
│   ├── pii_masker.rs               # PII 마스킹 ✅
│   ├── datetime.rs                 # 날짜/시간 처리 ✅
│   └── link_preview.rs             # 링크 프리뷰 ✅
├── platform/                       # 플랫폼 통합
│   ├── mod.rs
│   ├── tray.rs                     # 시스템 트레이 ✅
│   ├── window_manager.rs           # 윈도우 관리 ✅
│   └── shortcuts.rs                # 단축키 ✅
├── cli/                            # CLI 도구
│   ├── mod.rs
│   ├── tui.rs
│   └── daily_log.rs
├── bin/
│   └── hoego_cli.rs
├── lib.rs
└── main.rs
```

**✅ = 실제 구현 완료**

**주요 구조 결정 (3단계 워크플로우 기반):**
1. **STAGE 1 - Dump**: dump.rs에서 일지 작성/조회 담당
2. **STAGE 2 - Feedback**: feedback.rs에서 AI 피드백 생성/관리 담당
3. **STAGE 3 - Retrospect**: retrospect.rs에서 회고 작성/조회 담당
4. **History**: history.rs는 사이드바 히스토리 탐색 전용
5. Weekly 데이터 집계를 별도 서비스/모델로 분리
6. LLM 관련 기능을 services/llm 디렉토리로 통합

### 데이터 저장 구조

```
~/Library/Application Support/io.hoego.app/  (macOS)
└── data/
    ├── dumps/                      # 1단계: 일지
    │   ├── 2025-01-21_14-30-00.md
    │   └── 2025-01-21_20-15-00.md
    ├── feedbacks/                  # 2단계: AI 피드백
    │   ├── 2025-01-21_14-30-00.md
    │   └── 2025-01-21_20-15-00.md
    ├── retrospects/                # 3단계: 회고
    │   ├── 2025-01-21_14-30-00.md
    │   └── 2025-01-21_20-15-00.md
    ├── templates/                  # 회고 템플릿
    │   ├── default.md
    │   └── custom-*.md
    └── settings.json               # 앱 설정
```

---

## 명명 규칙 (Naming Conventions)

### 파일명

**Rust:**
```yaml
모듈: snake_case.rs
예: dump_service.rs, ai_service.rs
```

**TypeScript:**
```yaml
컴포넌트: PascalCase.tsx
  예: DumpPanel.tsx, FileItem.tsx

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

### 코드 내 명명

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
// - 파일명: AIPanel.tsx (PascalCase + Abbreviation Uppercase)
```

### Tauri Commands

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

## 컴포넌트 작성 규칙

### 컴포넌트 주석 (JSDoc)

**모든 export된 컴포넌트에 필수:**

```typescript
/**
 * 일지 작성 패널 - 사용자가 일일 일지를 작성하는 메인 컴포넌트
 * @param content - 작성 중인 일지 내용
 * @param onSave - 저장 버튼 클릭 시 호출
 * @param initialContent - 초기 일지 내용 (수정 모드)
 * @param autoSave - 자동 저장 활성화 여부 (기본: false)
 */
export function DumpPanel({
  content,
  onSave,
  initialContent = '',
  autoSave = false
}: DumpPanelProps) {
  // ...
}
```

**작은 컴포넌트:**
```typescript
/**
 * 파일 항목 - 히스토리 목록의 개별 파일 표시
 */
export function FileItem({ file, onClick }: FileItemProps) {
  // ...
}
```

**내부 컴포넌트 (export 안함):**
```typescript
// 간단한 주석으로 충분
// 덤프 패널 헤더 - 저장 버튼 포함
function DumpHeader({ onSave }: { onSave: () => void }) {
  // ...
}
```

### 컴포넌트 파일 구조

```typescript
// 1. Imports
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { DumpData } from '@/types/dump';

// 2. Types (파일 내부에서만 사용)
interface DumpPanelProps {
  initialContent?: string;
  onSave: (content: string) => void;
}

// 3. Constants (컴포넌트 전용)
const MAX_CONTENT_LENGTH = 10000;

// 4. Main Component
export function DumpPanel({ initialContent = '', onSave }: DumpPanelProps) {
  // 4-1. Hooks
  const [content, setContent] = useState(initialContent);

  // 4-2. Handlers
  const handleSave = () => {
    onSave(content);
  };

  // 4-3. Effects
  useEffect(() => {
    // ...
  }, []);

  // 4-4. Render
  return (
    <div className="dump-panel">
      {/* ... */}
    </div>
  );
}

// 5. Sub-components (export 필요 시에만)
function DumpHeader({ onSave }: { onSave: () => void }) {
  return <header>{/* ... */}</header>;
}
```

### Import 순서

```typescript
// 1. External dependencies
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

// 2. Internal - components
import { Button } from '@/components/ui/button';
import { DumpPanel } from '@/components/panels/dump-panel';

// 3. Internal - hooks, services, utils
import { useHistory } from '@/hooks/useHistory';
import { historyService } from '@/services/historyService';
import { formatDate } from '@/utils/datetime';

// 4. Internal - types, constants
import type { DumpData } from '@/types/dump';
import { AI_PROMPTS } from '@/constants';

// 5. Styles (if any)
import './dump-panel.css';
```

### 컴포넌트 분리 기준

```yaml
분리 필요:
  ✅ 200줄 이상
  ✅ 2곳 이상에서 재사용
  ✅ 독립적인 기능
  ✅ 복잡한 앱 (history, settings)

분리 불필요:
  ❌ 한 곳에서만 사용하는 작은 컴포넌트
  ❌ 50줄 이하 헬퍼 컴포넌트
  ❌ 부모 컴포넌트와 강하게 결합된 것
```

**실용적 원칙:**
- 1-2단어 파일명 선호 (폴더로 컨텍스트 제공)
- 과도한 분리 지양 (복잡도 증가 방지)
- 폴더 depth 최대 2단계

---

## IPC & 통신 패턴

### Tauri IPC (Frontend → Backend)

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

### 타입 정의 (tauri-specta 활용)

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

### 에러 처리

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

## 날짜/시간 처리

### 저장 포맷

```yaml
UTC ISO 8601:
  저장: "2025-01-21T14:30:00Z"
  파일명: "2025-01-21_14-30-00"

타임존:
  기본: UTC
  표시: Asia/Seoul (+09:00)
  향후: 사용자 설정 가능
```

### Rust 구현

```rust
use time::{OffsetDateTime, UtcOffset, format_description};

pub fn now_utc() -> OffsetDateTime {
    OffsetDateTime::now_utc()
}

pub fn format_timestamp(dt: OffsetDateTime) -> String {
    // "2025-01-21_14-30-00" 형식
    dt.format(&format_description::parse(
        "[year]-[month]-[day]_[hour]-[minute]-[second]"
    ).unwrap()).unwrap()
}

pub fn to_korea_time(dt: OffsetDateTime) -> OffsetDateTime {
    dt.to_offset(UtcOffset::from_hms(9, 0, 0).unwrap())
}
```

### TypeScript 구현

```typescript
// src/utils/datetime.ts
export const KOREA_TIMEZONE = 'Asia/Seoul';

export function formatKoreanDateTime(utcString: string): string {
  const date = new Date(utcString);
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: KOREA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
}

export function nowUTC(): string {
  return new Date().toISOString();
}
```

---

## 폼 관리 (React Hook Form + Zod)

### 기본 패턴

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Zod 스키마 정의
const dumpSchema = z.object({
  content: z.string().min(1, '내용을 입력해주세요'),
  tags: z.array(z.string()).optional(),
});

type DumpFormData = z.infer<typeof dumpSchema>;

export function DumpForm() {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<DumpFormData>({
    resolver: zodResolver(dumpSchema),
  });

  const onSubmit = (data: DumpFormData) => {
    tauriAPI.saveDump(data.content);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <textarea {...register('content')} />
      {errors.content && <span>{errors.content.message}</span>}

      <button type="submit">저장</button>
    </form>
  );
}
```

---

## 상태 관리 (Zustand)

### 스토어 구조

```typescript
// src/store/appStore.ts
import { create } from 'zustand';

interface AppStore {
  // View 상태
  viewMode: 'dump' | 'feedback' | 'retrospect';
  setViewMode: (mode: AppStore['viewMode']) => void;

  // 현재 작업 중인 데이터
  currentDump: DumpData | null;
  setCurrentDump: (dump: DumpData | null) => void;

  currentFeedback: FeedbackData | null;
  setCurrentFeedback: (feedback: FeedbackData | null) => void;

  currentRetrospect: RetrospectData | null;
  setCurrentRetrospect: (retrospect: RetrospectData | null) => void;

  // UI 상태
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  viewMode: 'dump',
  setViewMode: (mode) => set({ viewMode: mode }),

  currentDump: null,
  setCurrentDump: (dump) => set({ currentDump: dump }),

  currentFeedback: null,
  setCurrentFeedback: (feedback) => set({ currentFeedback: feedback }),

  currentRetrospect: null,
  setCurrentRetrospect: (retrospect) => set({ currentRetrospect: retrospect }),

  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}));
```

### 사용 예시

```typescript
function DumpPanel() {
  const { currentDump, setCurrentDump } = useAppStore();

  const handleSave = async (content: string) => {
    const id = await tauriAPI.saveDump(content);
    setCurrentDump({ id, content, timestamp: nowUTC() });
  };

  return <div>{/* ... */}</div>;
}
```

---

## 프라이버시 & 보안

### 로깅 정책

**Rust (tracing):**

```rust
// 개발 환경: ERROR 레벨
// RUST_LOG=error cargo run

use tracing::{error, warn, info, debug};

// ✅ 허용
error!("Failed to save dump: error_code={}", "FILE_NOT_FOUND");
error!("Permission denied for path: {}", sanitized_path);

// ❌ 절대 금지
error!("User content: {}", user_content);  // 사용자 콘텐츠
error!("AI response: {}", ai_response);    // AI 응답
```

**TypeScript:**

```typescript
// 개발 환경에서만
if (import.meta.env.DEV) {
  console.error('Error code:', errorCode);  // 에러 코드만
}

// ❌ 절대 금지
console.log(dumpContent);      // 사용자 콘텐츠
console.log(userSettings);     // 사용자 설정
console.log(aiResponse);       // AI 응답
```

**프로덕션 빌드:**
```javascript
// vite.config.ts
export default defineConfig({
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,  // console.* 제거
        drop_debugger: true,
      },
    },
  },
});
```

### PII 보호

**모든 로그는 pii_masker 통과:**

```rust
// src-tauri/src/utils/pii_masker.rs
pub fn mask_pii(content: &str) -> String {
    // 이메일, 전화번호, 주소 등 마스킹
    // 구현 세부사항은 기존 코드 참고
}
```

### LLM 데이터 전송 최소화

```rust
// ✅ 필요한 컨텍스트만
let context = strip_metadata(&user_content);
send_to_llm(context);

// ❌ 전체 데이터 전송 금지
send_to_llm(&full_dump_data);  // 메타데이터 포함
```

---

## 코드 품질

### Formatting

```yaml
Rust:
  - rustfmt (자동)
  - 실행: cargo fmt

TypeScript:
  - Prettier (자동)
  - 들여쓰기: 2칸
  - 세미콜론: 사용
  - 따옴표: 작은따옴표
```

### Linting

```yaml
Rust:
  - clippy
  - 실행: cargo clippy -- -D warnings

TypeScript:
  - ESLint + Prettier
  - 실행: npm run lint
```

### 테스팅

```yaml
Rust:
  - 단위 테스트: #[cfg(test)]
  - 실행: cargo test

TypeScript:
  - Vitest + Testing Library
  - 실행: npm run test
  - Coverage: npm run test:coverage
```

---

## Path Alias

### 설정

**vite.config.ts:**
```typescript
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### 사용

```typescript
// ✅ 절대 경로 (권장)
import { Button } from '@/components/ui/button';
import { useHistory } from '@/hooks/useHistory';
import { AI_PROMPTS } from '@/constants';
import { historyService } from '@/services/historyService';
import type { DumpData } from '@/types/dump';

// ❌ 상대 경로 (지양)
import { Button } from '../../../components/ui/button';
```

---

## 마이그레이션 가이드

### 기존 데이터 마이그레이션

```yaml
기존 구조:
  journals/ → dumps/
  history/ → dumps/, feedbacks/, retrospects/ (분리)

마이그레이션 스크립트:
  - src-tauri/src/services/migration_service.rs
  - 앱 시작 시 자동 실행
  - 백업 생성 후 마이그레이션
```

### 리팩토링 순서

```yaml
Phase 1: Backend 구조 정리
  1. Rust 모듈 재구성 (commands, services, models)
  2. 타입 정의 분리 및 정리
  3. 에러 처리 통합
  4. 로깅 정책 적용

Phase 2: Frontend 구조 정리
  1. 파일명 규칙 적용 (kebab-case)
  2. 컴포넌트 분리 및 정리
  3. Constants 중앙화
  4. Path alias 적용

Phase 3: 새로운 패턴 적용
  1. React Hook Form 도입
  2. Zod 검증 추가
  3. 컴포넌트 JSDoc 추가
  4. 테스트 커버리지 개선

Phase 4: 데이터 구조 전환
  1. 3단계 워크플로우 폴더 구조 적용
  2. 날짜/시간 처리 UTC 통일
  3. 데이터 마이그레이션 실행
```

---

## 체크리스트

### 코드 작성 시

- [ ] 파일명이 명명 규칙을 따르는가?
- [ ] 컴포넌트에 JSDoc 주석이 있는가?
- [ ] Import 순서가 올바른가?
- [ ] Path alias (@/)를 사용했는가?
- [ ] 200줄 초과 시 분리를 고려했는가?
- [ ] PII 로깅하지 않았는가?
- [ ] 에러 처리가 적절한가?

### 커밋 전

- [ ] `npm run check` 통과 (type-check + lint + format)
- [ ] `cargo fmt && cargo clippy` 통과
- [ ] 테스트 작성 및 통과
- [ ] CLAUDE.md 원칙 준수

### PR 전

- [ ] 모든 테스트 통과
- [ ] 빌드 성공
- [ ] 문서 업데이트 (필요 시)
- [ ] 커밋 메시지 명확

---

**생성일:** 2025-01-21
**버전:** 1.0
**작성자:** Winston (Architect Agent)
**다음 단계:** Phase 1 Backend 구조 정리부터 시작
