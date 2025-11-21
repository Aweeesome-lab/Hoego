# Hoego MVP Roadmap

> **목표**: 10명 × 2주 습관 검증 - "매일 덤프를 쓰게 되는가?"
> **작성일**: 2025-11-17
> **상태**: Phase 0 준비 중

---

## 📌 MVP 핵심 철학

### 본질 정의
```yaml
Hoego = 어디서든 바로 쓸 수 있는 하루 덤프 캡쳐 도구
       + 내가 힘들게 구조화하지 않아도 AI가 대신 정리·해석해주는 회고 도우미

핵심 가치:
  입력: 저마찰 (단축키 → 오버레이 → 바로 타이핑)
  처리: AI가 알아서 (카테고리/요약/권장 액션)
  출력: 하루 단위 한 장짜리 기록 (원문 + 요약)

NOT:
  ✗ 노트테이킹 방법론 도구
  ✗ 생산성 계량화 도구
  ✗ 복잡한 템플릿 시스템
```

### 측정 지표 (Success Criteria)
```yaml
필수 지표:
  □ Daily Active: ≥70% (10명 중 7명)
  □ Avg Dumps/Day: ≥1.5
  □ AI Feedback Read Rate: ≥60%
  □ D7 Retention: ≥60%
  □ D14 Retention: ≥50%

핵심 질문:
  1. 매일 덤프를 쓰게 되는가?
  2. AI 피드백이 유용한가?
  3. 다음날도 다시 오는가?
```

---

## 🎯 Phase 0: MVP 핵심 검증 준비 (3일)

### 목표
불필요한 복잡성 제거 + AI 피드백 재설계 + Quick Dump 모드 구현

---

### Day 1: 불필요한 기능 숨기기 (예상: 2.5시간)

#### ✅ 작업 1: Weekly Dashboard 숨기기 (30분)

**파일**: `src/apps/settings/settings.tsx`

**작업 내용**:
```typescript
// WeeklyDashboard import 주석 처리
// import { WeeklyDashboard } from './components/WeeklyDashboard';

// 해당 섹션 전체 주석 처리
{/*
<section className="space-y-4">
  <h2>Weekly Dashboard</h2>
  <WeeklyDashboard />
</section>
*/}
```

**검증**:
- [ ] Settings 페이지에서 Weekly Dashboard 섹션 보이지 않음
- [ ] Console 에러 없음
- [ ] 빌드 성공

---

#### ✅ 작업 2: RetrospectPanel 단순화 (1시간)

**파일**:
- `src/components/panels/RetrospectPanel.tsx`
- `src/components/panels/RetrospectPanelHeader.tsx`

**작업 내용**:

1. **뷰 모드 단순화**:
```typescript
// RetrospectPanelHeader.tsx
// Split/Preview 버튼 숨기기, Edit만 유지
const viewModes = [
  { value: 'edit' as const, label: 'Edit', icon: Pencil },
  // { value: 'preview' as const, label: 'Preview', icon: Eye }, // 주석 처리
  // { value: 'split' as const, label: 'Split', icon: Columns }, // 주석 처리
];
```

2. **템플릿 드롭다운 단순화**:
```typescript
// RetrospectPanel.tsx
// 기본 템플릿 1개만 표시, 나머지는 "더보기" 토글로
const defaultTemplate = retrospectiveTemplates[0]; // Daily Review만
```

**검증**:
- [ ] Edit 모드만 표시됨
- [ ] 템플릿 선택이 단순해짐 (기본 1개)
- [ ] 기존 기능 동작 정상

---

#### ✅ 작업 3: Cloud Provider 단순화 (30분)

**파일**: `src/apps/settings/components/CloudLLMSettings.tsx`

**작업 내용**:
```typescript
// Provider 선택을 1개만 기본 노출
const defaultProviders = ['openai']; // or 'claude'
const advancedProviders = ['claude', 'gemini']; // "고급" 토글로 숨김

// UI 구조:
// [기본] OpenAI 설정
// [고급 설정 토글]
//   - Claude
//   - Gemini
```

**검증**:
- [ ] 기본 화면에 Provider 1개만 표시
- [ ] "고급 설정" 토글 시 나머지 표시
- [ ] API 키 저장/로드 정상 동작

---

#### ✅ 작업 4: Prompt Settings 단순화 (30분)

**파일**: `src/apps/settings/components/PromptSettings.tsx`

**작업 내용**:
```typescript
// Instruction Style 4개 → 기본 1개 + "커스텀"
const defaultStyle = 'professional';
const showAdvancedStyles = false; // 기본 숨김

// UI:
// [System Prompt]
// [기본 스타일: Professional]
// [커스텀 프롬프트 입력] (옵션)
```

**검증**:
- [ ] 스타일 선택 드롭다운 단순화
- [ ] 커스텀 프롬프트 입력 가능
- [ ] 설정 저장/로드 정상

---

### Day 2: AI 피드백 구조 재설계 (예상: 4시간)

#### ✅ 작업 1: AI 프롬프트 재설계 (3시간)

**파일**:
- `src/services/aiService.ts`
- `src/hooks/useAiPipeline.ts`
- `src/constants/aiPrompts.ts` (신규)

**현재 구조**:
```
Categorizing Stage → Feedback Generation Stage
```

**변경 구조**:
```
Context Analysis → Structured Feedback (5가지)
```

**새 프롬프트 템플릿**:

```typescript
// src/constants/aiPrompts.ts (신규 파일)
export const STRUCTURED_FEEDBACK_PROMPT = `
당신은 사용자의 하루 덤프를 분석하고 구조화된 피드백을 제공하는 AI 도우미입니다.

## 입력
사용자의 하루 덤프 내용

## 출력 형식 (반드시 아래 5가지 섹션을 포함)

### 📋 To-do
즉시 가능한 최소 행동 2-3개 (체크박스 형태)
- [ ] 구체적이고 실행 가능한 행동
- [ ] 5분 이내 시작 가능한 것

### 💡 인사이트
사용자가 놓친 맥락이나 패턴 (1-2문장)
- 오늘 덤프에서 발견한 의미 있는 패턴
- 사용자가 의식하지 못한 감정/상황

### 🔁 반복 패턴
최근 데이터 기반 반복 패턴 (있을 경우)
- 지난 3-7일 덤프와 비교
- 반복되는 주제/감정/행동

### 🎯 개선 방향
중기적 제안 (1주일 단위)
- 오늘 덤프를 바탕으로 한 개선 방향
- 구체적이고 실천 가능한 것

### 💬 제안
넛지형 피드백 (1문장)
- 격려 또는 질문
- 다음 행동을 촉진하는 것

## 톤
- 친구처럼 편안하게
- 판단하지 않고 이해하는 태도
- 간결하고 명확하게
`;
```

**작업 내용**:

1. **aiService.ts 수정**:
```typescript
// categorizing → context analysis로 변경
export async function generateStructuredFeedback(
  dumpContent: string,
  recentHistory?: string[] // 최근 3-7일 덤프
): Promise<StructuredFeedback> {
  const prompt = buildStructuredFeedbackPrompt(dumpContent, recentHistory);
  // ... LLM 호출
}
```

2. **타입 정의 추가**:
```typescript
// src/types/ai.ts
export interface StructuredFeedback {
  todos: string[];
  insights: string;
  patterns?: string;
  improvements: string;
  suggestions: string;
}
```

3. **useAiPipeline.ts 수정**:
```typescript
// 2단계 파이프라인 → 단일 structured feedback 호출
const generateFeedback = async () => {
  setPipelineStage('analyzing');
  const feedback = await generateStructuredFeedback(content);
  setStructuredFeedback(feedback);
  setPipelineStage('done');
};
```

**검증**:
- [ ] AI 호출 시 5가지 섹션 출력 확인
- [ ] 기존 파이프라인 대비 토큰 사용량 확인
- [ ] 에러 처리 정상 동작

---

#### ✅ 작업 2: AiPanel UI 단순화 (1시간)

**파일**: `src/apps/main/components/AiPanel.tsx`

**현재**: 복잡한 리스트, 여러 요약 표시

**변경**: 단일 요약 블록, 5가지 섹션 표시

**작업 내용**:
```typescript
// AiPanel.tsx 재구조화
export function AiPanel() {
  const { structuredFeedback, isGenerating } = useAiPipeline();

  return (
    <div className="ai-panel">
      <PanelHeader title="AI가 오늘을 이렇게 정리했어요" />

      {isGenerating && <ThinkingAnimation />}

      {structuredFeedback && (
        <div className="feedback-sections">
          <FeedbackSection
            icon="📋"
            title="To-do"
            content={structuredFeedback.todos}
            type="checklist"
          />
          <FeedbackSection
            icon="💡"
            title="인사이트"
            content={structuredFeedback.insights}
          />
          {structuredFeedback.patterns && (
            <FeedbackSection
              icon="🔁"
              title="반복 패턴"
              content={structuredFeedback.patterns}
            />
          )}
          <FeedbackSection
            icon="🎯"
            title="개선 방향"
            content={structuredFeedback.improvements}
          />
          <FeedbackSection
            icon="💬"
            title="제안"
            content={structuredFeedback.suggestions}
          />
        </div>
      )}
    </div>
  );
}
```

**새 컴포넌트 생성**:
```typescript
// src/components/ai/FeedbackSection.tsx (신규)
interface FeedbackSectionProps {
  icon: string;
  title: string;
  content: string | string[];
  type?: 'text' | 'checklist';
}

export function FeedbackSection({ icon, title, content, type }: FeedbackSectionProps) {
  return (
    <div className="feedback-section">
      <h3>{icon} {title}</h3>
      {type === 'checklist' ? (
        <ul className="checklist">
          {Array.isArray(content) && content.map((item, i) => (
            <li key={i}>
              <input type="checkbox" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p>{content}</p>
      )}
    </div>
  );
}
```

**검증**:
- [ ] 5가지 섹션이 명확히 구분되어 표시
- [ ] To-do는 체크박스로 표시
- [ ] 패턴이 없을 경우 해당 섹션 숨김
- [ ] 로딩 상태 표시 정상

---

### Day 3: Quick Dump 모드 + 온보딩 (예상: 4시간)

#### ✅ 작업 1: Quick Dump 모드 구현 (2시간)

**목표**: 기본 윈도우 크기를 400×200 ultra-compact로 변경

**파일**:
- `tauri.conf.json`
- `src/apps/main/MainApp.tsx`
- `src-tauri/src/window_manager.rs`

**작업 내용**:

1. **tauri.conf.json 수정**:
```json
{
  "tauri": {
    "windows": [
      {
        "label": "main",
        "title": "Hoego",
        "width": 400,
        "height": 200,
        "minWidth": 400,
        "minHeight": 200,
        "maxWidth": 1600,
        "maxHeight": 1200,
        "resizable": true,
        "alwaysOnTop": true,
        "decorations": true,
        "center": true
      }
    ]
  }
}
```

2. **윈도우 모드 전환 기능 추가**:
```typescript
// src/lib/tauri/windowManager.ts (신규)
export type WindowMode = 'quick' | 'full';

export async function setWindowMode(mode: WindowMode) {
  const sizes = {
    quick: { width: 400, height: 200 },
    full: { width: 1000, height: 700 }
  };

  const { width, height } = sizes[mode];
  await invoke('set_window_size', { width, height });
}

// Cmd+Shift+F로 모드 전환
export function useWindowModeToggle() {
  const [mode, setMode] = useState<WindowMode>('quick');

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey && e.shiftKey && e.key === 'F') {
        const newMode = mode === 'quick' ? 'full' : 'quick';
        setMode(newMode);
        setWindowMode(newMode);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [mode]);

  return { mode, setMode };
}
```

3. **MainApp.tsx 레이아웃 조정**:
```typescript
// Quick 모드: DumpPanel만 표시
// Full 모드: DumpPanel + AiPanel
export function MainApp() {
  const { mode } = useWindowModeToggle();

  return (
    <div className="main-app">
      <DumpPanel />
      {mode === 'full' && <AiPanel />}

      {mode === 'quick' && (
        <div className="mode-toggle-hint">
          Cmd+Shift+F: 확장 모드
        </div>
      )}
    </div>
  );
}
```

4. **Rust 명령어 추가** (필요시):
```rust
// src-tauri/src/window_manager.rs
#[tauri::command]
pub fn set_window_size(
    window: tauri::Window,
    width: f64,
    height: f64,
) -> Result<(), String> {
    window
        .set_size(PhysicalSize::new(width as u32, height as u32))
        .map_err(|e| e.to_string())?;
    Ok(())
}
```

**검증**:
- [ ] 앱 실행 시 400×200 크기로 시작
- [ ] DumpPanel만 표시됨
- [ ] Cmd+Shift+F로 1000×700 확장
- [ ] 확장 모드에서 AiPanel 표시
- [ ] 다시 Cmd+Shift+F로 축소

---

#### ✅ 작업 2: 첫 실행 온보딩 (2시간)

**목표**: 첫 사용자에게 Hoego 사용법 안내

**파일**:
- `src/components/onboarding/FirstRunGuide.tsx` (신규)
- `src/store/appStore.ts` (isFirstRun 상태 추가)

**작업 내용**:

1. **FirstRunGuide 컴포넌트**:
```typescript
// src/components/onboarding/FirstRunGuide.tsx
export function FirstRunGuide() {
  const [step, setStep] = useState(0);
  const { setIsFirstRun } = useAppStore();

  const steps = [
    {
      title: "Hoego는 가볍게 던지는 앱입니다",
      description: "구조나 문장 완성도는 신경쓰지 마세요. 키워드만 던져도 됩니다.",
      example: "오늘 프로젝트 회의, 피곤함, 저녁 운동"
    },
    {
      title: "AI가 알아서 정리해줍니다",
      description: "덤프를 던지면 AI가 To-do, 인사이트, 패턴, 개선방향을 정리합니다.",
      example: "📋 To-do\n- [ ] 회의록 정리하기\n\n💡 인사이트\n- 운동 후 기분이 좋아진 것 같네요"
    },
    {
      title: "단축키로 빠르게",
      description: "Cmd+Shift+H: 어디서든 즉시 열기\nCmd+Shift+F: 확장/축소",
      example: null
    }
  ];

  const currentStep = steps[step];

  return (
    <div className="first-run-guide">
      <div className="guide-content">
        <h2>{currentStep.title}</h2>
        <p>{currentStep.description}</p>
        {currentStep.example && (
          <div className="example-box">
            <pre>{currentStep.example}</pre>
          </div>
        )}
      </div>

      <div className="guide-actions">
        {step < steps.length - 1 ? (
          <Button onClick={() => setStep(step + 1)}>
            다음
          </Button>
        ) : (
          <Button onClick={() => {
            setIsFirstRun(false);
            localStorage.setItem('hoego_first_run', 'false');
          }}>
            시작하기
          </Button>
        )}

        <Button
          variant="ghost"
          onClick={() => {
            setIsFirstRun(false);
            localStorage.setItem('hoego_first_run', 'false');
          }}
        >
          건너뛰기
        </Button>
      </div>
    </div>
  );
}
```

2. **appStore에 상태 추가**:
```typescript
// src/store/appStore.ts
interface AppState {
  // ... 기존 상태
  isFirstRun: boolean;
  setIsFirstRun: (value: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // ... 기존 상태
  isFirstRun: localStorage.getItem('hoego_first_run') !== 'false',
  setIsFirstRun: (value) => set({ isFirstRun: value }),
}));
```

3. **MainApp에 통합**:
```typescript
// src/apps/main/MainApp.tsx
export function MainApp() {
  const { isFirstRun } = useAppStore();
  const { mode } = useWindowModeToggle();

  if (isFirstRun) {
    return <FirstRunGuide />;
  }

  return (
    <div className="main-app">
      {/* ... 기존 코드 */}
    </div>
  );
}
```

**검증**:
- [ ] 첫 실행 시 온보딩 가이드 표시
- [ ] 3단계 안내 정상 동작
- [ ] "시작하기" 클릭 시 메인 화면 전환
- [ ] "건너뛰기" 정상 동작
- [ ] 두 번째 실행 시 온보딩 표시 안 됨

---

## 📊 Phase 1: 레거시 제거 + 통합 (1일)

### 목표
기술 부채 정리 및 코드 통합

---

### ✅ 작업 1: 레거시 코드 제거 (1시간)

**파일**:
- `Cargo.toml`
- `src-tauri/src/llm/native_engine.rs`
- 관련 import 정리

**작업 내용**:

1. **Cargo.toml 정리**:
```toml
# 주석 처리된 llama-cpp-2 의존성 완전 제거
# [dependencies]
# llama-cpp-2 = { ... } ← 이 줄 삭제
```

2. **native_engine.rs 삭제**:
```bash
rm src-tauri/src/llm/native_engine.rs
```

3. **관련 import 정리**:
```rust
// src-tauri/src/llm/mod.rs
// mod native_engine; ← 이 줄 삭제
```

**검증**:
- [ ] Cargo build 성공
- [ ] 컴파일 에러 없음
- [ ] 앱 실행 정상

---

### ✅ 작업 2: 마크다운 시스템 통합 (2시간)

**목표**: 중복된 마크다운 렌더링 시스템을 하나로 통합

**파일**:
- `src/lib/ai/models.tsx` (삭제 예정)
- `src/components/markdown/UnifiedMarkdown.tsx` (통합 컴포넌트)

**작업 내용**:

1. **UnifiedMarkdown 컴포넌트 생성**:
```typescript
// src/components/markdown/UnifiedMarkdown.tsx
import { memo, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getMarkdownComponents } from './MarkdownComponents';

type MarkdownVariant = 'default' | 'ai' | 'retrospect';

interface UnifiedMarkdownProps {
  content: string;
  variant?: MarkdownVariant;
  className?: string;
}

export const UnifiedMarkdown = memo(({
  content,
  variant = 'default',
  className
}: UnifiedMarkdownProps) => {
  const components = useMemo(
    () => getMarkdownComponents(variant),
    [variant]
  );

  return (
    <ReactMarkdown
      className={className}
      remarkPlugins={[remarkGfm]}
      components={components}
    >
      {content}
    </ReactMarkdown>
  );
});
```

2. **MarkdownComponents 확장**:
```typescript
// src/components/markdown/MarkdownComponents.tsx
export function getMarkdownComponents(variant: MarkdownVariant) {
  const baseComponents = {
    // 기존 컴포넌트
  };

  // variant별 커스터마이징
  if (variant === 'ai') {
    return {
      ...baseComponents,
      // AI 응답용 스타일
      p: ({ children }) => (
        <p className="ai-paragraph">{children}</p>
      ),
    };
  }

  if (variant === 'retrospect') {
    return {
      ...baseComponents,
      // 회고용 스타일
    };
  }

  return baseComponents;
}
```

3. **기존 사용처 변경**:
```typescript
// src/components/ai/Response.tsx
// Before:
import { MarkdownRenderer } from '@/lib/ai/models';

// After:
import { UnifiedMarkdown } from '@/components/markdown/UnifiedMarkdown';

<UnifiedMarkdown content={aiResponse} variant="ai" />
```

4. **src/lib/ai/models.tsx 삭제**:
```bash
rm src/lib/ai/models.tsx
```

**검증**:
- [ ] AI 응답 마크다운 렌더링 정상
- [ ] 회고 내용 마크다운 렌더링 정상
- [ ] 스타일 일관성 유지
- [ ] 빌드 에러 없음

---

### ✅ 작업 3: AI 클라이언트 통합 (3시간)

**목표**: 로컬/클라우드 LLM을 단일 인터페이스로 통합

**파일**:
- `src/lib/ai/unified-client.ts` (신규)
- `src/lib/ai/client.ts` (래퍼로 변경)
- `src/lib/cloud-llm.ts` (래퍼로 변경)

**작업 내용**:

1. **통합 클라이언트 인터페이스**:
```typescript
// src/lib/ai/unified-client.ts
import { invoke } from '@tauri-apps/api/tauri';

export type LLMProvider = 'local' | 'openai' | 'claude' | 'gemini';

export interface GenerateParams {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
}

export class UnifiedAIClient {
  private currentProvider: LLMProvider = 'local';

  async setProvider(provider: LLMProvider) {
    this.currentProvider = provider;
    // 설정 저장
    localStorage.setItem('hoego_llm_provider', provider);
  }

  async generate(params: GenerateParams): Promise<string> {
    switch (this.currentProvider) {
      case 'local':
        return this.generateLocal(params);
      case 'openai':
      case 'claude':
      case 'gemini':
        return this.generateCloud(params);
      default:
        throw new Error(`Unknown provider: ${this.currentProvider}`);
    }
  }

  private async generateLocal(params: GenerateParams): Promise<string> {
    return invoke('ai_llama_generate_text', {
      prompt: params.prompt,
      systemPrompt: params.systemPrompt,
      maxTokens: params.maxTokens,
    });
  }

  private async generateCloud(params: GenerateParams): Promise<string> {
    return invoke('cloud_llm_generate', {
      prompt: params.prompt,
      systemPrompt: params.systemPrompt,
    });
  }

  async *streamGenerate(params: GenerateParams): AsyncGenerator<string> {
    // 스트리밍 구현
    const { listen } = await import('@tauri-apps/api/event');

    const unlisten = await listen('ai_feedback_stream', (event) => {
      // yield event.payload.text;
    });

    try {
      if (this.currentProvider === 'local') {
        await invoke('ai_llama_generate_text', params);
      } else {
        await invoke('cloud_llm_generate', params);
      }
    } finally {
      unlisten();
    }
  }
}

// 싱글톤 인스턴스
export const aiClient = new UnifiedAIClient();
```

2. **기존 client.ts를 래퍼로 변경**:
```typescript
// src/lib/ai/client.ts
import { aiClient } from './unified-client';

// 기존 인터페이스 유지하되 내부는 unified-client 사용
export async function generateText(prompt: string, systemPrompt?: string) {
  return aiClient.generate({ prompt, systemPrompt });
}
```

3. **서비스 레이어 수정**:
```typescript
// src/services/aiService.ts
import { aiClient } from '@/lib/ai/unified-client';

export async function generateStructuredFeedback(
  dumpContent: string,
  recentHistory?: string[]
): Promise<StructuredFeedback> {
  const prompt = buildStructuredFeedbackPrompt(dumpContent, recentHistory);
  const response = await aiClient.generate({
    prompt,
    systemPrompt: STRUCTURED_FEEDBACK_PROMPT,
    temperature: 0.7,
  });

  return parseStructuredFeedback(response);
}
```

**검증**:
- [ ] 로컬 LLM 호출 정상
- [ ] 클라우드 LLM 호출 정상
- [ ] Provider 전환 정상 동작
- [ ] 기존 기능 모두 정상 동작
- [ ] 타입 에러 없음

---

## 📈 Phase 2: 피드백 기반 개선 (테스트 후 2주)

### 목표
사용자 피드백 수집 및 반영

---

### ✅ 작업 1: 사용자 피드백 수집 시스템 (1일)

**파일**:
- `src/services/analytics.ts` (신규)
- `src/components/feedback/FeedbackDialog.tsx` (신규)

**측정 항목**:
```typescript
interface MVPMetrics {
  // Engagement
  daily_dump_count: number;
  daily_active_users: number;
  avg_dumps_per_day: number;

  // Quality
  ai_feedback_generated: number;
  ai_feedback_read: number;
  ai_feedback_read_rate: number;

  // Habit
  consecutive_days: number;
  time_to_first_dump: number;
  avg_dump_length: number;

  // User Feedback (주 1회)
  dump_felt_easy: number; // 1-5
  feedback_was_useful: number; // 1-5
  will_use_tomorrow: boolean;
}
```

**작업 내용**:

1. **Analytics 서비스**:
```typescript
// src/services/analytics.ts
export class Analytics {
  // localStorage 기반 간단한 추적
  trackDump(length: number) {
    const today = new Date().toISOString().split('T')[0];
    const dumps = this.getDumpsForDate(today);
    dumps.push({
      timestamp: Date.now(),
      length,
    });
    localStorage.setItem(`dumps_${today}`, JSON.stringify(dumps));
  }

  trackAIFeedbackRead() {
    const today = new Date().toISOString().split('T')[0];
    const key = `ai_read_${today}`;
    const count = parseInt(localStorage.getItem(key) || '0');
    localStorage.setItem(key, String(count + 1));
  }

  getMetrics(): MVPMetrics {
    // 지표 집계
  }
}

export const analytics = new Analytics();
```

2. **피드백 다이얼로그** (주 1회):
```typescript
// src/components/feedback/FeedbackDialog.tsx
export function FeedbackDialog() {
  const [answers, setAnswers] = useState({
    dumpFeltEasy: 0,
    feedbackWasUseful: 0,
    willUseTomorrow: false,
  });

  const handleSubmit = () => {
    analytics.trackUserFeedback(answers);
    localStorage.setItem('last_feedback_date', new Date().toISOString());
  };

  return (
    <Dialog>
      <DialogContent>
        <h2>이번 주 어떠셨나요?</h2>

        <div className="question">
          <p>덤프 쓰기가 어렵지 않았나요?</p>
          <StarRating value={answers.dumpFeltEasy} onChange={...} />
        </div>

        <div className="question">
          <p>AI 피드백이 도움이 되었나요?</p>
          <StarRating value={answers.feedbackWasUseful} onChange={...} />
        </div>

        <div className="question">
          <p>내일도 쓰고 싶으신가요?</p>
          <Toggle value={answers.willUseTomorrow} onChange={...} />
        </div>

        <Button onClick={handleSubmit}>제출</Button>
      </DialogContent>
    </Dialog>
  );
}
```

**검증**:
- [ ] 덤프 작성 시 자동 추적
- [ ] AI 피드백 읽기 추적
- [ ] 주 1회 피드백 다이얼로그 표시
- [ ] 데이터 로컬 저장
- [ ] 메트릭 대시보드에서 확인 가능

---

### ✅ 작업 2: 피드백 기반 개선 (반복)

**프로세스**:
1. 주간 메트릭 확인
2. 사용자 피드백 분석
3. 개선 우선순위 결정
4. 개선 사항 구현
5. 다음 주 측정

**체크리스트**:
- [ ] Week 1 메트릭 수집
- [ ] Week 1 피드백 분석
- [ ] 개선 사항 1순위 결정
- [ ] 개선 사항 구현
- [ ] Week 2 메트릭 수집
- [ ] Week 2 피드백 분석
- [ ] MVP 성공/실패 판단

**성공 기준**:
```yaml
성공:
  - Daily Active ≥ 70%
  - D14 Retention ≥ 50%
  - AI Feedback Read Rate ≥ 60%
  - 사용자 "덤프 쓰기 쉬웠다" ≥ 4/5
  - 사용자 "AI 피드백 유용" ≥ 4/5

실패:
  - Daily Active < 50%
  - D7 Retention < 40%
  - 사용자 "내일도 쓰고 싶다" < 50%
```

---

### ✅ 작업 3: 검증 후 고급 기능 활성화 (조건부)

**MVP 성공 시에만 진행**:

1. **Weekly Dashboard 활성화**:
   - Settings 주석 해제
   - 차트 정상 동작 확인
   - 사용자 피드백 수집

2. **패턴 분석 강화**:
   - 주간 패턴 분석 고도화
   - 월간 트렌드 추가
   - 카테고리별 인사이트

3. **음성 입력 재검토**:
   - 사용자 요청 확인
   - 기술적 구현 계획
   - 프로토타입 테스트

---

## 📋 전체 체크리스트

### Phase 0: MVP 핵심 검증 준비 (3일)

**Day 1: 불필요한 기능 숨기기**
- [ ] Weekly Dashboard 숨기기
- [ ] RetrospectPanel 단순화 (뷰 모드 1개)
- [ ] Cloud Provider 단순화 (기본 1개)
- [ ] Prompt Settings 단순화

**Day 2: AI 피드백 구조 재설계**
- [ ] AI 프롬프트 재설계 (5가지 구조)
- [ ] aiService.ts 수정
- [ ] useAiPipeline.ts 수정
- [ ] AiPanel UI 단순화
- [ ] FeedbackSection 컴포넌트 생성

**Day 3: Quick Dump 모드 + 온보딩**
- [ ] Quick Dump 모드 구현 (400×200)
- [ ] 윈도우 모드 전환 (Cmd+Shift+F)
- [ ] FirstRunGuide 컴포넌트 생성
- [ ] 온보딩 플로우 통합

### Phase 1: 레거시 제거 + 통합 (1일)

- [ ] llama-cpp-2 레거시 제거
- [ ] native_engine 삭제
- [ ] 마크다운 시스템 통합
- [ ] AI 클라이언트 통합

### Phase 2: 피드백 기반 개선 (2주)

**Week 1**
- [ ] Analytics 서비스 구현
- [ ] FeedbackDialog 구현
- [ ] 테스트 유저 10명 모집
- [ ] Week 1 메트릭 수집
- [ ] Week 1 피드백 분석

**Week 2**
- [ ] 개선 사항 구현
- [ ] Week 2 메트릭 수집
- [ ] Week 2 피드백 분석
- [ ] MVP 성공/실패 판단
- [ ] 다음 단계 결정

---

## 🎯 현재 상태

- **Phase**: Phase 0 준비 중
- **다음 작업**: Day 1 - Weekly Dashboard 숨기기
- **예상 소요 시간**: 2.5시간
- **시작일**: 2025-11-17

---

## 📝 세션 노트

### Session 1 (2025-11-17)
- MVP Roadmap 문서 생성
- Phase 0 작업 계획 수립
- 측정 지표 정의

### Session 2 (예정)
- Day 1 작업 시작
- Weekly Dashboard 숨기기

---

## 🔗 관련 문서

- [Refactoring Progress](./refactoring-progress.md)
- [Refactoring Plan](./refactoring-plan.md)
- [Component Extraction Guide](./component-extraction-guide.md)
- [Project Analysis](./project-analysis.md)

---

**다음 작업 시작 전 체크리스트**:
1. [ ] 이 문서 읽기
2. [ ] 현재 Phase 확인
3. [ ] 다음 작업 항목 확인
4. [ ] 예상 시간 확인
5. [ ] 관련 파일 읽기
