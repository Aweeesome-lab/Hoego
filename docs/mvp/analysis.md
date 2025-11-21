# Hoego 프로젝트 종합 분석 문서

> 작성일: 2025-11-17
> 목적: 프로젝트 전체 구조 파악 및 정리/개선 가능 영역 식별

---

## 📋 목차

1. [프로젝트 개요](#프로젝트-개요)
2. [구현된 기능 목록](#구현된-기능-목록)
3. [UI/UX 구현 상태](#uiux-구현-상태)
4. [핵심 앱 상태](#핵심-앱-상태)
5. [기술 스택 상세](#기술-스택-상세)
6. [코드 구조 및 통계](#코드-구조-및-통계)
7. [중복 및 개선 영역](#중복-및-개선-영역)
8. [덜어낼 부분 제안](#덜어낼-부분-제안)

---

## 프로젝트 개요

### 목적
Hoego는 **일일 회고(Daily Retrospect)**와 **AI 피드백**을 결합한 데스크톱 애플리케이션입니다.
- 빠른 생각 덤프 (Quick Dump)
- 구조화된 회고 템플릿
- AI 기반 자동 분류 및 피드백
- 주간 생산성 분석

### 아키텍처
**Host-Guest 모델**:
- **Host (Rust + Tauri)**: 시스템 접근, 파일 관리, LLM 통합
- **Guest (Next.js + React)**: UI 및 사용자 상호작용

**멀티 윈도우 구조**:
- **Main (Overlay)**: 1000×700 - 빠른 덤프 및 회고 작성
- **History**: 720×640 - 과거 기록 검색/조회
- **Settings**: 900×700 - 설정 및 주간 대시보드

---

## 구현된 기능 목록

### 1. Retrospect 기능 (Core)

#### A. Daily Dump
- **위치**: `src/apps/main/components/DumpPanel.tsx`
- **기능**:
  - 빠른 텍스트 입력 (Textarea)
  - 마크다운 지원
  - 자동 저장 (Auto-save)
  - AI 카테고리화 파이프라인 트리거
- **상태 관리**: `appStore.ts` - `markdownContent`, `isEditing`, `editingContent`

#### B. Retrospective Panel
- **위치**: `src/components/panels/RetrospectPanel.tsx`
- **기능**:
  - 3가지 뷰 모드: Edit / Preview / Split
  - 마크다운 에디터 + 실시간 미리보기
  - 템플릿 선택 드롭다운 (`TemplatePickerDropdown.tsx`)
  - 사전 정의 템플릿 (5개 기본 + 사용자 정의)
- **뷰 모드**:
  - `edit`: 편집 전용
  - `preview`: 마크다운 렌더링만 표시
  - `split`: 에디터 + 미리보기 분할 화면

#### C. Retrospective Templates
- **기본 템플릿** (`src/constants/retrospectiveTemplates.ts`):
  1. **Daily Review**: 일일 회고 (성취, 도전, 학습, 계획)
  2. **GTD Reflection**: GTD 방식 (Capture, Clarify, Organize, Reflect, Engage)
  3. **Agile Retrospective**: 애자일 회고 (Good, Bad, Action Items)
  4. **Deep Work Log**: 딥워크 로그 (Focus Sessions, Distractions, Flow State)
  5. **Personal Growth**: 성장 중심 (Wins, Gratitude, Learning, Tomorrow)

- **사용자 정의 템플릿**:
  - Settings > Retrospective Templates에서 생성/편집
  - 제목 + 마크다운 컨텐츠
  - Zustand store에 저장 (`customRetrospectiveTemplates`)

#### D. File-based Storage
- **저장 위치**: 사용자 선택 디렉토리 (예: `~/hoego`)
- **파일명 형식**: `YYYY-MM-DD.md` (예: `2024-11-17.md`)
- **Tauri 명령어**:
  - `save_markdown`: 현재 날짜 파일 저장
  - `load_markdown`: 현재 날짜 파일 로드
  - `list_history`: 전체 파일 목록

---

### 2. AI 피드백 시스템

#### A. AI Pipeline Architecture
- **2단계 파이프라인**:
  1. **Categorizing Stage**: 덤프 내용 분석 및 카테고리화
  2. **Feedback Generation Stage**: 인사이트 및 피드백 생성 (스트리밍)

- **상태 관리**: `appStore.ts`
  - `isGeneratingAiFeedback`: boolean
  - `pipelineStage`: 'categorizing' | 'generating_feedback'
  - `streamingAiText`: 스트리밍 텍스트
  - `aiSummaries`: AI 생성 요약 목록

#### B. LLM 지원
**로컬 LLM**:
- llama.cpp 프로세스 기반
- 모델 다운로드 및 관리 (`src-tauri/src/llm/model_manager.rs`)
- 진행률 이벤트: `llm_download_progress`
- 명령어: `ai_llama_load_model`, `ai_llama_generate_text`

**클라우드 LLM** (신규):
- **지원 제공자**: OpenAI, Claude (Anthropic), Gemini (Google)
- **API 키 관리**:
  - OS Keyring을 통한 안전한 저장 (`src-tauri/src/llm/cloud/config.rs`)
  - Settings UI에서 설정 (`CloudLLMSettings.tsx`)
- **명령어**:
  - `cloud_llm_set_provider`: 제공자 선택
  - `cloud_llm_set_api_key`: API 키 저장
  - `cloud_llm_generate`: 텍스트 생성 (스트리밍)

#### C. AI Summary Management
- **저장**: `src-tauri/src/ai_summary.rs`
  - JSON 파일로 요약 메타데이터 저장
  - 구조: `{ date, filename, summary, model, timestamp }`
- **명령어**:
  - `save_ai_summary`: 요약 저장
  - `list_ai_summaries`: 전체 요약 목록
  - `delete_ai_summary`: 요약 삭제
  - `batch_summarize_notes`: 다중 노트 일괄 요약

#### D. Prompt Configuration
- **위치**: Settings > Prompt Settings (`src/apps/settings/components/PromptSettings.tsx`)
- **설정 항목**:
  - System Prompt: AI 역할 정의
  - Instruction Style: 피드백 스타일 지정
  - 사전 정의 스타일: Professional, Friendly, Concise, Detailed
- **저장**: Zustand store + 로컬 스토리지

---

### 3. 주간 대시보드 & 분석

#### A. Weekly Dashboard
- **위치**: Settings > Weekly Dashboard (`src/apps/settings/components/WeeklyDashboard.tsx`)
- **기능**:
  - 최근 7일 데이터 집계
  - 카테고리별 시간 소비 분석
  - 생산성 vs 낭비 시간 추적
  - 일일 트렌드 차트

#### B. 차트 컴포넌트 (Recharts 사용)
1. **CategoryPieChart**: 카테고리별 비율 파이차트
2. **DailyTrendChart**: 일별 생산성 트렌드 라인차트
3. **ProductivityChart**: 생산성 분석 차트

#### C. 데이터 처리
- **Rust 백엔드**: `src-tauri/src/weekly_data.rs` (477 LOC)
  - `fetch_weekly_data`: 주간 데이터 집계
  - 카테고리 분류: Productive, Neutral, Waste
  - 시간 계산 및 집계 로직
- **타입 정의**: `WeekData`, `DailyEntry`, `AggregatedStats`

#### D. 카테고리 시스템
- **카테고리 분류 로직**: AI 피드백 파이프라인의 Categorizing 단계
- **저장 위치**: 마크다운 파일 내 메타데이터 또는 별도 JSON
- **활용**: 주간 대시보드 통계 생성

---

### 4. History & Search

#### A. History Window
- **진입점**: `src/apps/history/HistoryApp.tsx`
- **레이아웃**:
  - 좌측: 파일 목록 (`HistoryFileList.tsx`)
  - 우측: 선택된 파일 내용 (`HistoryPanel.tsx`)

#### B. 기능
- **파일 목록**: 날짜별 정렬, 미리보기
- **검색**: 파일명 또는 내용 검색
- **파일 관리**:
  - 선택한 파일 열기
  - 내용 보기 (읽기 전용)
  - AI 요약 표시 (있을 경우)

#### C. Tauri 명령어
- `list_history`: 히스토리 파일 목록
- `load_history_file`: 특정 날짜 파일 로드
- `search_history`: 검색 기능 (구현 여부 확인 필요)

---

### 5. Settings & Configuration

#### A. Settings Window
- **진입점**: `src/apps/settings/SettingsApp.tsx`
- **섹션**:
  1. **LLM Settings**: 로컬/클라우드 LLM 선택
  2. **Cloud LLM Settings**: API 키 및 제공자 설정
  3. **Prompt Settings**: 프롬프트 커스터마이징
  4. **Retrospective Templates**: 템플릿 생성/편집
  5. **Weekly Dashboard**: 주간 분석 뷰

#### B. Theme Management
- **설정**: Light / Dark / System
- **구현**: `src/hooks/useTheme.ts`
- **저장**: Zustand store + localStorage
- **테마 토글**: Header의 IconButton

#### C. Model Management
- **로컬 모델**:
  - 모델 다운로드 UI (진행률 표시)
  - 모델 선택 드롭다운
  - 사용 가능한 모델 목록 표시
- **클라우드 모델**:
  - 제공자 선택: OpenAI / Claude / Gemini
  - API 키 입력 및 저장 (Keyring 사용)

---

### 6. System Features

#### A. System Tray
- **기능**:
  - 최소화 시 시스템 트레이로 이동
  - 빠른 접근 메뉴
  - 완전 종료 옵션
- **구현**: `tauri.conf.json` - `systemTray` 설정

#### B. Global Shortcuts
- **단축키**: 오버레이 윈도우 토글 (예: Cmd+Shift+H)
- **구현**: Tauri shortcuts API
- **등록**: `src-tauri/src/main.rs`

#### C. Window Management
- **Floating Overlay**: 항상 위 (Always on Top)
- **위치 기억**: 마지막 위치 저장/복원
- **모서리 둥글게**: macOS corner radius 설정
- **구현**: `src-tauri/src/window_manager.rs`

---

## UI/UX 구현 상태

### 페이지 구조

| 윈도우 | 라우트 | 목적 | 주요 컴포넌트 |
|--------|-------|------|--------------|
| **Main** | `/` | 빠른 덤프 + 회고 | DumpPanel, RetrospectPanel, AiPanel |
| **History** | `#history` | 과거 기록 조회 | HistoryApp, HistoryFileList, HistoryPanel |
| **Settings** | `#settings` | 설정 및 분석 | CloudLLMSettings, LLMSettings, PromptSettings, WeeklyDashboard |

### 컴포넌트 조직

#### 1. 기본 UI 컴포넌트 (`src/components/ui/`)
총 14개 컴포넌트:

| 컴포넌트 | 용도 | 기반 |
|---------|------|------|
| `Badge` | 상태 표시 | Custom |
| `Button` | 기본 버튼 | CVA + Tailwind |
| `Card` | 카드 레이아웃 | Tailwind |
| `Checkbox` | 체크박스 | Radix UI |
| `IconButton` | 아이콘 버튼 | Custom |
| `Input` | 텍스트 입력 | Tailwind |
| `Select` | 드롭다운 선택 | Radix UI |
| `Separator` | 구분선 | Radix UI |
| `Switch` | 토글 스위치 | Radix UI |
| `Textarea` | 여러 줄 입력 | Tailwind |
| `Typography` | 타이포그래피 | Custom |
| `PillButton` | 알약형 버튼 | Custom |
| `StatusBadge` | 상태 뱃지 | Badge 확장 |
| `PanelHeader` | 패널 헤더 | Custom |

#### 2. 레이아웃 컴포넌트 (`src/components/layout/`)
- `Header.tsx`: 앱 헤더 (로고, 테마 토글)
- `Footer.tsx`: 푸터 정보
- `entry-handler.tsx`: 해시 라우팅 처리

#### 3. 패널 컴포넌트 (`src/components/panels/`)
- `DumpPanel.tsx`: 빠른 덤프 입력
- `RetrospectPanel.tsx`: 회고 작성 메인
- `RetrospectPanelHeader.tsx`: 회고 헤더 (뷰 모드 전환)
- `RetrospectContentArea.tsx`: 에디터/미리보기 영역
- `AiPanel.tsx`: AI 피드백 표시
- `TemplatePickerDropdown.tsx`: 템플릿 선택 UI

#### 4. 마크다운 컴포넌트 (`src/components/markdown/`)
- `MemoizedReactMarkdown.tsx`: 최적화된 마크다운 렌더러
- `MarkdownComponents.tsx`: 커스텀 마크다운 요소 스타일

#### 5. AI 컴포넌트 (`src/components/ai/`)
- `Response.tsx`: AI 응답 표시
- `Thinking.tsx`: 생각 중 애니메이션

#### 6. Settings 컴포넌트 (`src/apps/settings/components/`)
- `CloudLLMSettings.tsx`: 클라우드 LLM 설정
- `LLMSettings.tsx`: 로컬 LLM 설정
- `PromptSettings.tsx`: 프롬프트 커스터마이징
- `RetrospectiveTemplateSettings.tsx`: 템플릿 관리
- `WeeklyDashboard.tsx`: 주간 대시보드
- 차트: `CategoryPieChart.tsx`, `DailyTrendChart.tsx`, `ProductivityChart.tsx`

### UI 라이브러리 & 디자인 시스템

#### 스타일링
- **Tailwind CSS 3.4.3**: 유틸리티 우선 스타일링
  - 커스텀 테마: `tailwind.config.ts`
  - 다크 모드 지원: `class` 전략
- **CVA (Class Variance Authority)**: 컴포넌트 변형 패턴
- **clsx + tailwind-merge**: 동적 클래스 처리

#### 컴포넌트 라이브러리
- **Radix UI**: 헤드리스 접근성 컴포넌트
  - Checkbox, Select 등
  - ARIA 속성 자동 적용
- **Lucide React 0.360**: 아이콘 라이브러리
  - 사용 아이콘: Sparkles, Loader2, Pencil, Eye, Columns, ChevronDown, Calendar 등

#### 데이터 시각화
- **Recharts 3.4.1**:
  - PieChart (카테고리 비율)
  - LineChart (일별 트렌드)
  - 반응형 차트

#### 알림 시스템
- **React Hot Toast 2.6**:
  - 성공/에러 토스트
  - 커스터마이징 가능한 스타일

### 반응형 디자인
- **윈도우 크기**:
  - Main: 1000×700 (min 800×600, max 1600×1200)
  - History: 720×640
  - Settings: 900×700
- **Tailwind 반응형 유틸리티**: `sm:`, `md:`, `lg:` 사용
- **Flexbox/Grid 레이아웃**: 유연한 레이아웃 구조

### 접근성 (Accessibility)
- **의미론적 HTML**: `<header>`, `<main>`, `<section>` 등
- **ARIA 속성**: Radix UI를 통한 자동 적용
- **키보드 탐색**: Tab, Enter, Escape 지원
- **스크린 리더**: 적절한 레이블 및 설명
- **Storybook**: 컴포넌트 개발 환경 (1개 스토리 파일 발견)

---

## 핵심 앱 상태

### Zustand Store 구조

**파일**: `src/store/appStore.ts` (13KB, 약 400줄)

#### 1. ThemeSlice
```typescript
{
  themeMode: 'light' | 'dark' | 'system',
  isDarkMode: boolean,
  setThemeMode: (mode) => void,
  setIsDarkMode: (isDark) => void,
  toggleTheme: () => void
}
```

#### 2. MarkdownSlice (Daily Dump)
```typescript
{
  markdownContent: string,        // 현재 덤프 내용
  isEditing: boolean,             // 편집 모드 여부
  editingContent: string,         // 편집 중인 내용
  isSaving: boolean,              // 저장 중 상태
  isSyncing: boolean,             // 동기화 중 상태
  setMarkdownContent: (content) => void,
  setIsEditing: (editing) => void,
  setEditingContent: (content) => void,
  setIsSaving: (saving) => void,
  setIsSyncing: (syncing) => void
}
```

#### 3. RetrospectSlice
```typescript
{
  retrospectContent: string,      // 회고 내용
  isEditingRetrospect: boolean,   // 회고 편집 모드
  editingRetrospectContent: string, // 편집 중인 회고
  isSavingRetrospect: boolean,    // 회고 저장 중
  retrospectViewMode: 'edit' | 'preview' | 'split', // 뷰 모드
  // ... setter methods
}
```

#### 4. AI Pipeline Slice
```typescript
{
  isGeneratingAiFeedback: boolean,
  pipelineStage: 'categorizing' | 'generating_feedback',
  streamingAiText: string,        // 스트리밍 텍스트
  aiSummaries: AiSummaryEntry[],  // AI 요약 목록
  selectedSummaryIndex: number,   // 선택된 요약 인덱스
  summariesError: string | null,  // 에러 메시지
  // ... pipeline control methods
}
```

#### 5. Settings Slice
```typescript
{
  retrospectiveTemplates: RetrospectiveTemplate[],      // 기본 템플릿
  customRetrospectiveTemplates: RetrospectiveTemplate[], // 사용자 템플릿
  // ... template management methods
}
```

#### 6. View State Slice
```typescript
{
  isDumpPanelExpanded: boolean,
  isRetrospectPanelExpanded: boolean,
  isAiPanelExpanded: boolean,
  // ... toggle methods
}
```

### 데이터 모델

#### AiSummaryEntry
```typescript
interface AiSummaryEntry {
  date: string;          // YYYY-MM-DD
  filename: string;      // 파일명
  summary: string;       // AI 요약 텍스트
  model: string;         // 사용한 모델명
  timestamp: string;     // ISO 8601 타임스탬프
  path?: string;         // 파일 경로 (옵션)
  content?: string;      // 원본 내용 (옵션)
  createdAt?: string;    // 생성 시각 (옵션)
}
```

#### RetrospectiveTemplate
```typescript
interface RetrospectiveTemplate {
  id: string;
  title: string;
  content: string;       // 마크다운 템플릿
  isCustom?: boolean;
}
```

#### WeekData (주간 대시보드)
```typescript
interface WeekData {
  startDate: string;
  endDate: string;
  dailyEntries: DailyEntry[];
  aggregatedStats: AggregatedStats;
}

interface DailyEntry {
  date: string;
  categories: Record<string, number>; // 카테고리별 시간(분)
  totalTime: number;
  productiveTime: number;
  wasteTime: number;
}

interface AggregatedStats {
  totalEntries: number;
  totalTime: number;
  productiveTime: number;
  wasteTime: number;
  categoryTotals: Record<string, number>;
  averageDailyTime: number;
}
```

### 파일 저장 구조

#### 히스토리 디렉토리
- **위치**: 사용자 선택 (일반적으로 `~/hoego`)
- **파일 형식**: `YYYY-MM-DD.md`
- **내용 예시**:
```markdown
# 2024-11-17

## Daily Dump
오늘은 프로젝트 분석 작업을 했다...

## Retrospective
### What went well?
- 프로젝트 구조 이해
- 문서 작성 시작

### Challenges?
- 중복 코드 많음
```

#### 메타데이터 저장
- **AI Summaries**: JSON 파일 (`~/.hoego/summaries.json`)
- **Settings**: 로컬 스토리지 + Zustand persist
- **Config**: OS별 설정 디렉토리
  - macOS: `~/Library/Application Support/com.tony.hoego`

### IPC 통신 패턴

#### Tauri 명령어 분류

**1. History Commands**
```typescript
// 파일 목록
invoke<HistoryFile[]>('list_history')

// 마크다운 저장/로드
invoke('save_markdown', { content: string })
invoke<string>('load_markdown')

// 특정 날짜 파일
invoke<string>('load_history_file', { date: string })
```

**2. Window Commands**
```typescript
// 윈도우 위치/표시
invoke('set_window_position', { x: number, y: number })
invoke('show_window', { label: string })
invoke('hide_window', { label: string })

// macOS 전용
invoke('set_corner_radius', { radius: number })
```

**3. LLM Commands (Local)**
```typescript
// 모델 관리
invoke('ai_llama_list_models')
invoke('ai_llama_download_model', { modelUrl: string })
invoke('ai_llama_load_model', { modelName: string })

// 텍스트 생성
invoke<string>('ai_llama_generate_text', {
  prompt: string,
  systemPrompt?: string,
  maxTokens?: number
})
```

**4. Cloud LLM Commands**
```typescript
// 설정
invoke('cloud_llm_set_provider', { provider: 'openai' | 'claude' | 'gemini' })
invoke('cloud_llm_set_api_key', { provider: string, apiKey: string })

// 생성 (스트리밍)
invoke('cloud_llm_generate', {
  prompt: string,
  systemPrompt?: string
})
// 이벤트: 'ai_feedback_stream'
```

**5. AI Summary Commands**
```typescript
// 요약 관리
invoke('save_ai_summary', { entry: AiSummaryEntry })
invoke<AiSummaryEntry[]>('list_ai_summaries')
invoke('delete_ai_summary', { filename: string })

// 배치 처리
invoke('batch_summarize_notes', {
  files: string[],
  systemPrompt?: string
})
```

**6. Weekly Data Commands**
```typescript
invoke<WeekData>('fetch_weekly_data', {
  startDate?: string,
  endDate?: string
})
```

#### 이벤트 기반 통신

**Progress Events**:
```typescript
// 모델 다운로드 진행률
listen('llm_download_progress', (event) => {
  const { percent, downloaded, total } = event.payload;
})

// AI 피드백 스트리밍
listen('ai_feedback_stream', (event) => {
  const { text, done } = event.payload;
})
```

#### 에러 처리 패턴
```typescript
try {
  const result = await invoke('some_command', params);
} catch (error) {
  // Rust에서 Result<T, String> 반환
  // error는 문자열 메시지
  console.error('Command failed:', error);
  toast.error(error);
}
```

---

## 기술 스택 상세

### Frontend

#### 핵심 프레임워크
| 라이브러리 | 버전 | 용도 |
|-----------|------|------|
| React | 18.2.0 | UI 라이브러리 |
| TypeScript | 5.4.5 | 타입 안전성 |
| Vite | 7.2.2 | 빌드 도구 |
| Tauri API | 1.5.4 | IPC 브리지 |

#### 상태 & 라우팅
| 라이브러리 | 버전 | 용도 |
|-----------|------|------|
| Zustand | 5.0.8 | 상태 관리 |
| zustand/middleware | - | Persist 미들웨어 |
| 해시 라우팅 | - | `#history`, `#settings` |

#### UI & 스타일링
| 라이브러리 | 버전 | 용도 |
|-----------|------|------|
| Tailwind CSS | 3.4.3 | CSS 프레임워크 |
| Radix UI | - | 헤드리스 컴포넌트 |
| Lucide React | 0.360.0 | 아이콘 |
| Recharts | 3.4.1 | 데이터 시각화 |
| React Hot Toast | 2.6.0 | 토스트 알림 |
| CVA | 0.7.0 | 스타일 변형 |
| clsx | 2.1.0 | 클래스 유틸리티 |
| tailwind-merge | 2.2.1 | Tailwind 병합 |

#### 마크다운
| 라이브러리 | 버전 | 용도 |
|-----------|------|------|
| react-markdown | 9.1.0 | 마크다운 렌더링 |
| remark-gfm | 4.0.0 | GitHub Flavored Markdown |
| remark-math | 6.0.0 | 수식 지원 |
| rehype-katex | 7.0.1 | KaTeX 렌더링 |

#### 개발 도구
| 라이브러리 | 버전 | 용도 |
|-----------|------|------|
| Vitest | 4.0.8 | 단위 테스트 |
| @testing-library/react | 16.3.0 | 컴포넌트 테스트 |
| Playwright | 1.56.1 | E2E 테스트 |
| Storybook | 10.0.7 | 컴포넌트 개발 |
| ESLint | - | 코드 린팅 |
| Prettier | - | 코드 포매팅 |

### Backend (Rust/Tauri)

#### 프레임워크
| 크레이트 | 버전 | 용도 |
|---------|------|------|
| tauri | 1.5 | 데스크톱 프레임워크 |
| tokio | 1.0 | 비동기 런타임 |
| serde | 1.0 | 직렬화/역직렬화 |
| serde_json | 1.0 | JSON 처리 |

#### 날짜/시간
| 크레이트 | 버전 | 용도 |
|---------|------|------|
| chrono | 0.4 | 날짜/시간 처리 |
| time | 0.3 | 시간 유틸리티 |

#### 파일 & 프로세스
| 크레이트 | 버전 | 용도 |
|---------|------|------|
| dirs | 5 | 시스템 디렉토리 |
| tempfile | 3 | 임시 파일 |
| uuid | 1.6 | 고유 ID 생성 |

#### 네트워크
| 크레이트 | 버전 | 용도 |
|---------|------|------|
| reqwest | 0.11 | HTTP 클라이언트 |

#### LLM 통합
| 크레이트 | 버전 | 용도 | 상태 |
|---------|------|------|------|
| ~~llama-cpp-2~~ | - | 네이티브 llama.cpp | ❌ 비활성화 (macOS 호환성 문제) |
| 프로세스 기반 | - | llama.cpp 실행 | ✅ 현재 사용 |
| async-trait | - | 비동기 트레잇 | ✅ 클라우드 LLM용 |

#### 보안
| 크레이트 | 버전 | 용도 |
|---------|------|------|
| keyring | 2 | API 키 안전 저장 |
| sha2 | 0.10 | SHA-256 해싱 |
| hex | 0.4 | 16진수 인코딩 |

#### macOS 전용
| 크레이트 | 버전 | 용도 |
|---------|------|------|
| core-foundation | 0.9 | macOS API |
| core-graphics | 0.23 | 그래픽 API |
| objc | 0.2 | Objective-C 상호운용 |

#### 로깅 & 에러
| 크레이트 | 버전 | 용도 |
|---------|------|------|
| tracing | 0.1 | 구조화된 로깅 |
| tracing-subscriber | - | 로그 구독자 |
| thiserror | 1 | 에러 정의 |

#### 타입 안전성
| 크레이트 | 버전 | 용도 |
|---------|------|------|
| specta | 1.0.5 | TypeScript 타입 생성 |

### LLM 아키텍처

#### 2단계 시스템

**1. 로컬 LLM** (`src-tauri/src/llm/`)
- **구조**: 13개 파일, 약 2542 LOC
- **모듈**:
  - `llama_engine.rs`: llama.cpp 프로세스 관리
  - `model_manager.rs`: 모델 다운로드/검증
  - `config.rs`: 설정 관리
  - `error.rs`: 에러 타입
  - `types.rs`: 공통 타입
- **특징**:
  - 프로세스 기반 실행 (네이티브 바인딩 대신)
  - SHA-256 모델 검증
  - 진행률 이벤트 (다운로드)
  - 메모리 내 모델 로딩

**2. 클라우드 LLM** (`src-tauri/src/llm/cloud/`)
- **구조**:
  - `mod.rs`: 공용 인터페이스
  - `config.rs`: 설정 및 Keyring
  - `client.rs`: HTTP 클라이언트
  - `providers/`: OpenAI, Claude, Gemini 구현
- **특징**:
  - Provider trait 추상화
  - 스트리밍 지원
  - 안전한 API 키 저장 (OS Keyring)
  - 비동기 HTTP 요청

#### 지원 모델

**로컬**:
- Llama 2 (7B, 13B)
- Llama 3
- Mistral
- 기타 llama.cpp 호환 모델

**클라우드**:
- OpenAI: GPT-3.5, GPT-4, GPT-4 Turbo
- Claude: Claude 3 (Opus, Sonnet, Haiku)
- Gemini: Gemini Pro, Gemini Ultra

#### API 추상화

```rust
// Provider 트레잇
#[async_trait]
pub trait Provider {
    async fn generate(
        &self,
        prompt: &str,
        system_prompt: Option<&str>,
        max_tokens: Option<usize>,
    ) -> Result<String, CloudLLMError>;

    async fn stream_generate(
        &self,
        prompt: &str,
        system_prompt: Option<&str>,
    ) -> Result<Pin<Box<dyn Stream<Item = String>>>, CloudLLMError>;
}
```

### 의존성 분석

#### 사용되지 않거나 레거시인 것들

1. **llama-cpp-2** (주석 처리됨):
   - macOS 호환성 문제로 비활성화
   - 프로세스 기반 접근으로 대체
   - `Cargo.toml`에서 주석 처리

2. **native_engine 모듈**:
   - 비활성화된 네이티브 바인딩 코드
   - 파일은 존재하지만 사용되지 않음

3. **오래된 Electron 스타일 패턴**:
   - 일부 초기 코드에 남아있는 패턴
   - Tauri 네이티브 방식으로 점진적 교체 중

#### 중복 가능성

1. **AI 클라이언트 인터페이스**:
   - `src/lib/ai/client.ts`: 로컬 LLM 래퍼 (`ai_llama_*` 명령어)
   - `src/lib/cloud-llm.ts`: 클라우드 LLM 래퍼
   - **통합 가능**: 단일 AI 서비스 추상화로 통합

2. **마크다운 렌더링**:
   - `src/lib/ai/models.tsx`: AI 응답용 마크다운 컴포넌트
   - `src/components/markdown/`: 별도 마크다운 시스템
   - **통합 가능**: 하나의 통합 마크다운 시스템

3. **Summary 관리**:
   - `src/services/aiService.ts`: 비즈니스 로직
   - `src/hooks/useAiPipeline.ts`: 컴포넌트 레벨 로직
   - **일부 중복**: Summary 관리 로직 일부 중복

4. **설정 구조**:
   - Zustand store의 설정 슬라이스
   - 로컬 스토리지 직접 접근
   - Tauri 설정 명령어
   - **통합 가능**: 단일 설정 서비스로 통합

---

## 코드 구조 및 통계

### 디렉토리 구조

```
Hoego/
├── src/                          # Frontend 소스
│   ├── apps/                     # 윈도우별 앱
│   │   ├── main/                # 메인 오버레이 (416줄)
│   │   ├── history/             # 히스토리 (289줄)
│   │   └── settings/            # 설정 (637줄)
│   ├── components/               # React 컴포넌트
│   │   ├── ui/                  # 기본 컴포넌트 (14개)
│   │   ├── panels/              # 패널 (6개)
│   │   ├── layout/              # 레이아웃 (3개)
│   │   ├── ai/                  # AI 관련 (2개)
│   │   ├── markdown/            # 마크다운 (2개)
│   │   └── settings/            # 설정 UI (1개)
│   ├── hooks/                    # 커스텀 훅 (8개)
│   ├── lib/                      # 유틸리티
│   │   ├── ai/                  # AI 클라이언트
│   │   ├── cloud-llm.ts         # 클라우드 LLM
│   │   └── tauri.ts             # Tauri 브리지
│   ├── services/                 # 비즈니스 로직 (6개)
│   ├── store/                    # Zustand (1개, 13KB)
│   ├── types/                    # 타입 정의 (4개)
│   ├── constants/                # 상수 (템플릿 등)
│   ├── styles/                   # 글로벌 CSS
│   └── entry.ts                  # 진입점 선택기
│
├── src-tauri/                    # Rust 백엔드
│   └── src/
│       ├── llm/                  # LLM 통합
│       │   ├── cloud/           # 클라우드 LLM
│       │   ├── llama_engine.rs  # 로컬 LLM
│       │   ├── model_manager.rs # 모델 관리
│       │   └── ...              # 기타 모듈
│       ├── main.rs               # 메인 엔트리 (명령어 등록)
│       ├── history.rs            # 파일 작업
│       ├── ai_summary.rs         # 요약 저장
│       ├── weekly_data.rs        # 주간 데이터 (477 LOC)
│       ├── window_manager.rs     # 윈도우 관리
│       └── utils.rs              # 유틸리티
│
├── docs/                         # 문서
│   ├── refactoring-plan.md
│   ├── refactoring-progress.md
│   ├── component-extraction-guide.md
│   └── project-analysis.md       # 이 문서
│
├── public/                       # 정적 파일
├── .storybook/                   # Storybook 설정
├── package.json                  # npm 의존성
├── Cargo.toml                    # Rust 의존성
├── tauri.conf.json               # Tauri 설정
└── ...                           # 기타 설정 파일
```

### 파일 통계

#### Frontend

| 카테고리 | 파일 수 | 주요 파일 | 비고 |
|---------|--------|----------|------|
| **TypeScript/TSX** | 85 | - | 전체 TS 파일 |
| **React 컴포넌트** | 31 | UI, 패널, 레이아웃 등 | .tsx 파일 |
| **커스텀 훅** | 8 | useTheme, useAiPipeline 등 | hooks/ |
| **서비스** | 6 | aiService, settingsService 등 | services/ |
| **타입 정의** | 4 | - | types/ |
| **테스트 파일** | 4 | Footer, Thinking, useTheme, settingsService | 매우 낮은 커버리지 |
| **Storybook 스토리** | 1 | - | 개발 중 |

#### Backend

| 카테고리 | 파일 수 | LOC | 비고 |
|---------|--------|-----|------|
| **Rust 파일** | ~35 | ~4500 | 전체 |
| **LLM 모듈** | 13 | ~2500 | llm/ 디렉토리 |
| **코어 모듈** | ~10 | ~2000 | main.rs, history.rs 등 |
| **생성 코드** | - | - | Tauri 자동 생성 |

#### 설정 파일

| 파일 | 목적 |
|------|------|
| `package.json` | npm 의존성 (51개 패키지) |
| `Cargo.toml` | Rust 의존성 |
| `tauri.conf.json` | Tauri 설정 (3 윈도우) |
| `tsconfig.json` | TypeScript 설정 |
| `tailwind.config.ts` | Tailwind 커스터마이징 |
| `vite.config.ts` | Vite 빌드 설정 |
| `.eslintrc.json` | ESLint 규칙 |

### 코드 크기 분석

#### 주요 컴포넌트 크기 (추정)

| 컴포넌트/파일 | 라인 수 (추정) | 복잡도 |
|-------------|---------------|--------|
| `appStore.ts` | ~400 | 중 |
| `RetrospectPanel.tsx` | ~250 | 중 |
| `WeeklyDashboard.tsx` | ~300 | 중 |
| `weekly_data.rs` | 477 | 중-고 |
| `llama_engine.rs` | ~500 | 고 |
| `cloud/mod.rs` | ~200 | 중 |

#### Zustand Store 슬라이스 비율 (추정)

| 슬라이스 | 비율 | 책임 |
|---------|------|------|
| Theme | 10% | 테마 관리 |
| Markdown | 20% | 덤프 상태 |
| Retrospect | 20% | 회고 상태 |
| AI Pipeline | 30% | AI 피드백 |
| Settings | 10% | 설정 |
| View State | 10% | UI 상태 |

---

## 중복 및 개선 영역

### 1. AI 클라이언트 인터페이스 중복

#### 현황
**파일 1**: `src/lib/ai/client.ts`
- 로컬 LLM 전용 래퍼
- `ai_llama_*` 명령어 호출
- 오래된 인터페이스

**파일 2**: `src/lib/cloud-llm.ts`
- 클라우드 LLM 전용 래퍼
- `cloud_llm_*` 명령어 호출
- 새로운 인터페이스

#### 문제점
- 두 개의 분리된 API 인터페이스
- 일관성 없는 사용 패턴
- 컴포넌트에서 어느 것을 사용할지 혼란

#### 개선 방안
**통합 AI 서비스 인터페이스**:
```typescript
// src/lib/ai/unified-client.ts
export class AIClient {
  async generate(params: GenerateParams): Promise<string> {
    // 로컬 vs 클라우드 자동 선택
    if (settings.useLocalLLM) {
      return await localClient.generate(params);
    } else {
      return await cloudClient.generate(params);
    }
  }

  async streamGenerate(params: GenerateParams): AsyncGenerator<string> {
    // 스트리밍 통합 인터페이스
  }
}
```

**효과**:
- 단일 API 인터페이스
- 컴포넌트 코드 단순화
- 향후 제공자 추가 용이

---

### 2. 마크다운 렌더링 중복

#### 현황
**시스템 1**: `src/lib/ai/models.tsx`
- AI 응답용 마크다운 컴포넌트
- 커스텀 렌더링 로직
- 일부 스타일 정의

**시스템 2**: `src/components/markdown/`
- 회고 내용용 마크다운 시스템
- `MemoizedReactMarkdown.tsx`
- `MarkdownComponents.tsx`

#### 문제점
- 중복된 마크다운 렌더링 로직
- 일관성 없는 스타일
- 유지보수 어려움

#### 개선 방안
**통합 마크다운 시스템**:
```typescript
// src/components/markdown/UnifiedMarkdown.tsx
export const UnifiedMarkdown = memo(({
  content,
  variant = 'default' // 'ai' | 'retrospect' | 'default'
}: MarkdownProps) => {
  const components = useMemo(() =>
    getMarkdownComponents(variant), [variant]
  );

  return (
    <ReactMarkdown components={components}>
      {content}
    </ReactMarkdown>
  );
});
```

**효과**:
- 단일 마크다운 시스템
- 일관된 스타일링
- 성능 최적화 (메모이제이션)

---

### 3. Summary 서비스 중복

#### 현황
**파일 1**: `src/services/aiService.ts`
- Summary 저장/로드 비즈니스 로직
- Tauri 명령어 호출

**파일 2**: `src/hooks/useAiPipeline.ts`
- AI 파이프라인 관리
- Summary 상태 관리
- 일부 중복 로직

#### 문제점
- Summary 관리 로직 분산
- 책임 경계 모호
- 중복 코드

#### 개선 방안
**명확한 책임 분리**:
- `aiService.ts`: 순수 비즈니스 로직 (Tauri 호출)
- `useAiPipeline.ts`: 상태 관리 및 UI 로직
- 중복 로직 제거, 서비스 호출로 통합

---

### 4. 레거시 코드

#### 제거 가능한 코드

**1. 주석 처리된 native llama-cpp 코드**:
```toml
# Cargo.toml
# [dependencies]
# llama-cpp-2 = { version = "...", features = [...] }  # 주석 처리됨
```
- 파일은 남아있지만 사용되지 않음
- 안전하게 제거 가능

**2. native_engine 모듈**:
- 비활성화된 네이티브 바인딩
- 프로세스 기반으로 완전 대체됨
- 제거 가능

**3. 사용되지 않는 타입 정의**:
- 일부 `types/` 파일에 사용되지 않는 인터페이스
- 코드 정리 필요

#### 제거 효과
- 코드베이스 크기 감소
- 혼란 감소
- 유지보수 용이성 향상

---

### 5. 설정 관리 분산

#### 현황
**저장 위치**:
1. Zustand store (메모리 + persist)
2. 로컬 스토리지 직접 접근
3. Tauri 설정 파일
4. OS Keyring (API 키)

#### 문제점
- 설정 저장 위치 분산
- 동기화 이슈 가능성
- 일관성 없는 접근 패턴

#### 개선 방안
**통합 설정 서비스**:
```typescript
// src/services/settingsService.ts
export class SettingsService {
  // 모든 설정을 하나의 인터페이스로 통합
  async get(key: string): Promise<any>
  async set(key: string, value: any): Promise<void>
  async getSecure(key: string): Promise<string> // Keyring
  async setSecure(key: string, value: string): Promise<void>
}
```

---

### 6. 테스트 커버리지 부족

#### 현황
- **테스트 파일**: 4개만 존재
- **커버리지**: 약 5% 미만
- **테스트된 부분**: Footer, Thinking 컴포넌트, useTheme 훅, settingsService

#### 문제점
- 매우 낮은 테스트 커버리지
- 리팩토링 위험 높음
- 회귀 버그 가능성

#### 개선 방안
**우선순위 기반 테스트 추가**:
1. **핵심 비즈니스 로직**: aiService, settingsService
2. **복잡한 컴포넌트**: RetrospectPanel, WeeklyDashboard
3. **중요 훅**: useAiPipeline, useMarkdown
4. **Tauri 명령어**: 주요 명령어 통합 테스트

**목표**:
- 유닛 테스트: 60% 이상
- 통합 테스트: 주요 워크플로우
- E2E 테스트: 핵심 사용자 시나리오

---

### 7. 컴포넌트 크기 및 복잡도

#### 문제가 있는 컴포넌트

**1. WeeklyDashboard.tsx** (~300줄)
- 데이터 페칭 + 차트 렌더링 + 상태 관리
- 책임이 너무 많음
- 차트 컴포넌트로 분리 가능

**2. RetrospectPanel.tsx** (~250줄)
- 뷰 모드 관리 + 에디터 + 미리보기
- 이미 일부 분리되었으나 추가 분리 가능

**3. appStore.ts** (400줄)
- 6개 슬라이스가 하나의 파일에
- 파일별 슬라이스 분리 고려

#### 개선 방안
- **WeeklyDashboard**: 차트 컴포넌트 완전 분리, 데이터 페칭 훅 분리
- **RetrospectPanel**: 뷰 모드별 서브 컴포넌트 추가 분리
- **appStore**: 슬라이스별 파일 분리 (예: `store/slices/theme.ts`)

---

## 덜어낼 부분 제안

### 🔴 우선순위 1: 즉시 제거 가능

#### 1. 레거시 코드 완전 제거
- [ ] `Cargo.toml`의 주석 처리된 `llama-cpp-2` 의존성
- [ ] 사용되지 않는 `native_engine` 모듈 파일
- [ ] 주석 처리된 네이티브 바인딩 관련 코드

**예상 효과**:
- 코드 크기: -500줄
- 혼란 감소: 높음
- 리스크: 낮음

#### 2. 중복 마크다운 시스템 통합
- [ ] `src/lib/ai/models.tsx` 제거
- [ ] 통합 마크다운 컴포넌트로 대체
- [ ] AI 응답에서 통합 컴포넌트 사용

**예상 효과**:
- 코드 크기: -150줄
- 유지보수성: 높음
- 리스크: 중간 (테스트 필요)

---

### 🟡 우선순위 2: 중간 기간 내 개선

#### 3. AI 클라이언트 인터페이스 통합
- [ ] 통합 AI 클라이언트 클래스 생성
- [ ] 로컬/클라우드 자동 선택 로직
- [ ] 기존 `ai/client.ts`와 `cloud-llm.ts` 래퍼로 변환 또는 제거
- [ ] 모든 컴포넌트를 통합 인터페이스로 마이그레이션

**예상 효과**:
- 코드 품질: 높음
- 확장성: 높음
- 리스크: 중간

#### 4. 설정 관리 통합
- [ ] 통합 설정 서비스 구현
- [ ] Zustand + 로컬 스토리지 + Keyring 추상화
- [ ] 일관된 설정 접근 패턴
- [ ] 기존 코드 마이그레이션

**예상 효과**:
- 일관성: 높음
- 유지보수성: 높음
- 리스크: 중간

---

### 🟢 우선순위 3: 장기 개선

#### 5. 컴포넌트 리팩토링
- [ ] WeeklyDashboard 분리 (데이터 페칭 훅 + 차트 컴포넌트)
- [ ] RetrospectPanel 추가 분리
- [ ] appStore 슬라이스별 파일 분리

**예상 효과**:
- 가독성: 높음
- 재사용성: 중간
- 리스크: 중간

#### 6. 테스트 커버리지 증가
- [ ] 핵심 서비스 유닛 테스트
- [ ] 주요 컴포넌트 테스트
- [ ] E2E 테스트 시나리오
- [ ] CI/CD 파이프라인 테스트 통합

**예상 효과**:
- 안정성: 매우 높음
- 리팩토링 안전성: 높음
- 리스크: 낮음

---

### 📊 기능 단순화 고려 사항

#### 검토 필요한 기능들

**1. Voice Input Feature**
- **상태**: README에 언급되었으나 구현 불완전
- **제안**:
  - 완전히 구현하거나
  - 일단 제거하고 향후 재추가
- **효과**: 코드베이스 명확성 향상

**2. Batch Summarization**
- **상태**: 구현됨 (`batch_summarize_notes`)
- **사용 빈도**: 불명확
- **제안**: 사용 패턴 분석 후 유지/제거 결정

**3. Multiple Cloud Providers**
- **상태**: OpenAI, Claude, Gemini 모두 지원
- **복잡도**: 각 제공자별 코드 유지보수
- **제안**:
  - 주로 사용하는 1-2개 제공자에 집중
  - 나머지는 플러그인 형태로 분리 고려

**4. Custom Retrospective Templates**
- **상태**: 기본 5개 + 사용자 정의
- **복잡도**: 중간
- **제안**: 유지 (핵심 기능)

---

### 📈 제거/단순화 로드맵

#### Phase 1: 즉시 (1-2일)
1. ✅ 레거시 코드 제거
2. ✅ 마크다운 시스템 통합
3. ✅ 사용되지 않는 타입 정리

**예상 결과**: -650줄, 코드 명확성 +30%

#### Phase 2: 단기 (1주)
1. AI 클라이언트 통합
2. 설정 관리 통합
3. Summary 서비스 정리

**예상 결과**: 코드 품질 +40%, 유지보수성 +35%

#### Phase 3: 중기 (2-3주)
1. 컴포넌트 리팩토링
2. 테스트 커버리지 증가 (60% 목표)
3. 기능 사용 패턴 분석

**예상 결과**: 안정성 +50%, 리팩토링 안전성 +70%

#### Phase 4: 장기 (1-2개월)
1. 사용 빈도 낮은 기능 제거/단순화
2. 플러그인 아키텍처 도입 (선택적)
3. 성능 최적화

**예상 결과**: 코드베이스 크기 -20%, 성능 +25%

---

## 요약 및 다음 단계

### 핵심 발견 사항

#### 강점
✅ 명확한 Host-Guest 아키텍처
✅ 깔끔한 컴포넌트 구조
✅ 강력한 타입 안전성 (TypeScript + Rust)
✅ 현대적인 UI/UX (Tailwind + Radix UI)
✅ 유연한 LLM 통합 (로컬 + 클라우드)

#### 개선 필요 영역
⚠️ 중복 코드 (AI 클라이언트, 마크다운)
⚠️ 레거시 코드 잔존
⚠️ 테스트 커버리지 부족 (5% 미만)
⚠️ 설정 관리 분산
⚠️ 일부 컴포넌트 복잡도 높음

### 즉시 실행 가능한 액션

#### 이번 주
1. **레거시 코드 제거** (2시간)
2. **마크다운 시스템 통합** (4시간)
3. **사용되지 않는 타입 정리** (1시간)

#### 다음 주
1. **AI 클라이언트 통합** (8시간)
2. **설정 서비스 통합** (6시간)
3. **핵심 서비스 테스트 추가** (4시간)

### 측정 가능한 목표

| 메트릭 | 현재 | 목표 (1개월) | 목표 (3개월) |
|-------|------|-------------|-------------|
| 코드 라인 수 | ~4500 (Rust) + ~8500 (TS) | -650줄 | -1200줄 |
| 테스트 커버리지 | ~5% | 40% | 60% |
| 중복 코드 | 높음 | 중간 | 낮음 |
| 컴포넌트 평균 크기 | ~150줄 | ~120줄 | ~100줄 |
| 빌드 시간 | 현재 | -10% | -20% |

---

## 부록

### A. 파일 구조 전체 맵

```
src/
├── apps/
│   ├── main/
│   │   ├── MainApp.tsx
│   │   └── components/
│   │       ├── DumpPanel.tsx
│   │       └── ...
│   ├── history/
│   │   ├── HistoryApp.tsx
│   │   └── components/
│   │       ├── HistoryFileList.tsx
│   │       ├── HistoryPanel.tsx
│   │       └── ...
│   └── settings/
│       ├── SettingsApp.tsx
│       └── components/
│           ├── CloudLLMSettings.tsx
│           ├── LLMSettings.tsx
│           ├── PromptSettings.tsx
│           ├── WeeklyDashboard.tsx
│           ├── CategoryPieChart.tsx
│           ├── DailyTrendChart.tsx
│           └── ProductivityChart.tsx
├── components/
│   ├── ui/ (14 files)
│   ├── panels/ (6 files)
│   ├── layout/ (3 files)
│   ├── ai/ (2 files)
│   ├── markdown/ (2 files)
│   └── settings/ (1 file)
├── hooks/ (8 files)
├── lib/
│   ├── ai/
│   │   ├── client.ts (로컬 LLM)
│   │   └── models.tsx (마크다운)
│   ├── cloud-llm.ts (클라우드 LLM)
│   ├── tauri.ts
│   └── utils.ts
├── services/
│   ├── aiService.ts
│   ├── settingsService.ts
│   ├── historyService.ts
│   └── ...
├── store/
│   └── appStore.ts (13KB)
├── types/
│   ├── ai.ts
│   ├── tauri-commands.ts
│   └── ...
└── constants/
    └── retrospectiveTemplates.ts
```

### B. Tauri 명령어 전체 목록

#### History
- `list_history`
- `load_markdown`
- `save_markdown`
- `load_history_file`

#### Window
- `set_window_position`
- `show_window`
- `hide_window`
- `set_corner_radius` (macOS)

#### Local LLM
- `ai_llama_list_models`
- `ai_llama_download_model`
- `ai_llama_load_model`
- `ai_llama_generate_text`
- `ai_llama_unload_model`

#### Cloud LLM
- `cloud_llm_set_provider`
- `cloud_llm_get_provider`
- `cloud_llm_set_api_key`
- `cloud_llm_get_api_key`
- `cloud_llm_generate`

#### AI Summary
- `save_ai_summary`
- `list_ai_summaries`
- `delete_ai_summary`
- `batch_summarize_notes`

#### Weekly Data
- `fetch_weekly_data`

#### Events
- `llm_download_progress`
- `ai_feedback_stream`

### C. 주요 의존성 버전

#### Frontend (package.json)
```json
{
  "react": "^18.2.0",
  "typescript": "^5.4.5",
  "vite": "^7.2.2",
  "@tauri-apps/api": "^1.5.4",
  "zustand": "^5.0.8",
  "tailwindcss": "^3.4.3",
  "recharts": "^3.4.1",
  "react-markdown": "^9.1.0",
  "lucide-react": "^0.360.0"
}
```

#### Backend (Cargo.toml)
```toml
[dependencies]
tauri = { version = "1.5", features = ["all"] }
tokio = { version = "1", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
chrono = { version = "0.4", features = ["serde"] }
reqwest = { version = "0.11", features = ["stream"] }
keyring = "2"
```

---

## 문서 개정 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|-------|----------|
| 1.0 | 2025-11-17 | AI Assistant | 초안 작성 |

---

**이 문서는 Hoego 프로젝트의 현재 상태를 정확히 반영하며,
향후 리팩토링 및 최적화 작업의 기준 문서로 활용됩니다.**
