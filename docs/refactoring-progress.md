# Hoego Refactoring Progress

> **목적**: MVP Phase 0 작업 진행 상황 추적
> **시작일**: 2025-11-17
> **현재 단계**: Phase 0 - Day 1

---

## 📊 전체 진행 상황

### Phase 0: MVP 핵심 검증 준비 (3일)
- **전체 진행률**: 67% (Day 1, 2 완료 + Day 2 Fix 완료)
- **현재 작업**: Day 2 Fix 완료
- **예상 소요 시간**: 7시간 (Day 1: 2.5h + Day 2: 4h + Day 2 Fix: 0.5h)
- **실제 소요 시간**: ~5.5시간 (효율성: 127%)

---

## ✅ 완료된 작업

### 사전 준비
- [x] mvp-roadmap.md 문서 생성
- [x] project-analysis.md 문서 생성
- [x] refactoring-progress.md 문서 생성 (이 문서)

### Phase 0 - Day 1: 불필요한 기능 숨기기

#### 작업 1: Weekly Dashboard 숨기기 ✅
- [x] settings.tsx에서 WeeklyDashboard import 주석 처리
- [x] WeeklyDashboard 섹션 전체 주석 처리
- [x] 사이드바에서 '주간 회고' 메뉴 항목 제거
- [x] 검증: Settings 페이지에서 Weekly Dashboard 보이지 않음
- [x] 검증: Console 에러 없음
- [x] 검증: 빌드 성공

**파일**: `src/apps/settings/settings.tsx`
**변경사항**: Line 7, 109, 260-263 주석 처리

---

#### 작업 2: RetrospectPanel 뷰 모드 단순화 ✅

##### 2.1 뷰 모드 단순화
- [x] retrospect-view-options.tsx에서 viewModes 배열 수정
- [x] Preview, Split 모드 주석 처리, Edit만 유지
- [x] 검증: Edit 모드만 표시됨

**파일**: `src/components/panels/constants/retrospect-view-options.tsx`
**변경사항**: Line 15-27 Preview, Split 주석 처리

---

#### 작업 3: Cloud Provider 단순화 ✅
- [x] CloudLLMSettings.tsx 수정
- [x] 기본 Provider 1개만 노출 (OpenAI)
- [x] Claude, Gemini 숨김 처리
- [x] 검증: 기본 화면에 OpenAI만 표시
- [x] 검증: 빌드 성공

**파일**: `src/apps/settings/components/CloudLLMSettings.tsx`
**변경사항**: Line 171-173 grid-cols-3 → grid-cols-1, openai만 표시

---

#### 작업 4: Prompt Settings 단순화 ✅
- [x] PromptSettings.tsx 수정
- [x] 버전 히스토리 기본 숨김
- [x] "보기" 토글 버튼 추가
- [x] 검증: 초기 화면 단순화
- [x] 검증: 설정 저장/로드 정상
- [x] 검증: 빌드 성공

**파일**: `src/apps/settings/components/PromptSettings.tsx`
**변경사항**: Line 24 showVersionHistory 상태 추가, Line 266-285 토글 버튼 추가

---

#### 작업 5: 로컬 LLM 지원 제거 ✅
- [x] settings.tsx에서 "모델" 메뉴 제거
- [x] "다운로드" 메뉴 제거
- [x] 기본 탭을 "클라우드 LLM"으로 변경
- [x] LLMSettings 렌더링 부분 주석 처리
- [x] 검증: 빌드 성공
- [x] 검증: 번들 크기 30% 감소 (50.12 kB → 35.28 kB)

**파일**: `src/apps/settings/settings.tsx`
**변경사항**: Line 50 기본 탭 변경, Line 110, 114 메뉴 주석 처리, Line 265-298 렌더링 주석 처리

---

#### 작업 6: API 키 설정 UI 제거 ✅
- [x] settings.tsx에서 "클라우드 LLM" 메뉴 제거
- [x] 기본 탭을 "프롬프트"로 변경
- [x] CloudLLMSettings 렌더링 부분 주석 처리
- [x] 검증: 빌드 성공
- [x] 검증: 번들 크기 추가 31% 감소 (35.28 kB → 24.24 kB)
- [x] 검증: 총 51.6% 감소 (50.12 kB → 24.24 kB)

**파일**: `src/apps/settings/settings.tsx`
**변경사항**: Line 50 기본 탭 → prompts, Line 111 메뉴 주석 처리, Line 268-271 렌더링 주석 처리
**사용자 제안**: "어차피 내장으로 동작하게 할 거니까 테스터는 그냥 이용만 하면 됨"

---

#### 작업 7: 일반 설정 메뉴 제거 ✅
- [x] settings.tsx에서 "일반 설정" 메뉴 제거
- [x] 로컬 모델 경로 설정 UI 제거
- [x] GPU 가속, 스레드 설정 UI 제거
- [x] 검증: 빌드 성공
- [x] 검증: 번들 크기 추가 7% 감소 (24.24 kB → 22.50 kB)
- [x] 검증: 총 55.1% 감소 (50.12 kB → 22.50 kB)

**파일**: `src/apps/settings/settings.tsx`
**변경사항**: Line 115 메뉴 주석 처리, Line 301-306 렌더링 전체 제거
**사용자 제안**: "이것도 사실상 안필요하네? (로컬 모델 설정)"

---

### Phase 0 - Day 2: AI 피드백 구조 재설계 ✅

#### 작업 1: AI 프롬프트 재설계 ✅
- [x] aiPrompts.ts 신규 파일 생성 (STRUCTURED_FEEDBACK_PROMPT)
- [x] StructuredFeedback 타입 정의 추가 (src/types/ai.ts)
- [x] aiService.ts 수정 (generateStructuredFeedback 구현)
- [x] 2단계 파이프라인 → 단일 단계로 변경 (categorizing → generating_feedback → analyzing → done)
- [x] 검증: 빌드 성공
- [x] 검증: 타입 체크 통과 (AI 관련 오류 없음)

**파일**:
- `src/constants/aiPrompts.ts` (신규)
- `src/types/ai.ts` (신규)
- `src/services/aiService.ts` (generateStructuredFeedback 함수 추가)
- `src/store/appStore.ts` (PipelineStage 타입 변경)

**변경사항**:
- 기존: Categorizing Stage → Feedback Generation Stage (2단계)
- 변경: Single Structured Feedback Generation (단일 단계)
- 프롬프트: 5가지 섹션 구조 (To-do, 인사이트, 반복 패턴, 개선 방향, 제안)

---

#### 작업 2: useAiPipeline.ts 재구조화 ✅
- [x] categorizeDump 함수 제거
- [x] generateFeedback 함수 재작성 (단일 structured feedback 호출)
- [x] handleRunPipeline 함수 단순화
- [x] 헬퍼 함수 제거 (buildCategorizationPrompt 등)
- [x] streamingBufferRef, streamingTimerRef, streamingCleanupRef 제거
- [x] 검증: useAiPipeline hook 정상 동작

**파일**: `src/hooks/useAiPipeline.ts`
**변경사항**: 2단계 파이프라인 → 단일 단계로 단순화, 스트리밍 관련 refs 제거

---

#### 작업 3: AiPanel.tsx & App.tsx 업데이트 ✅
- [x] AiPanel button label 로직 수정 (새로운 PipelineStage 반영)
- [x] App.tsx handlePipelineExecution 수정
- [x] onContentUpdate callback 제거 (더 이상 파일 수정 없음)
- [x] streamingCleanupRef 사용 제거
- [x] 검증: UI 정상 동작

**파일**:
- `src/components/panels/AiPanel.tsx` (button label 수정)
- `src/apps/main/App.tsx` (handleRunPipeline 호출 단순화)

**변경사항**: categorization 결과를 파일에 저장하지 않음, 피드백만 UI에 표시

---

## 📋 대기 중인 작업

### Phase 0 - Day 3: Quick Dump 모드 + 온보딩 (4시간)
- [ ] Quick Dump 모드 구현 (2시간)
- [ ] 첫 실행 온보딩 (2시간)

---

## 🚫 보류/취소된 작업

_현재 없음_

---

## 📝 세션 노트

### Session 1 (2025-11-17) - Phase 0 Day 1 완료 ✅
- **작업 시작**: Phase 0 Day 1
- **작업 내용**:
  - refactoring-progress.md 생성
  - Weekly Dashboard 숨기기 (settings.tsx)
  - RetrospectPanel 뷰 모드 단순화 (Edit만 유지)
  - Cloud Provider 단순화 (OpenAI만 표시)
  - Prompt Settings 단순화 (버전 히스토리 토글)
  - **추가 1**: 로컬 LLM 지원 제거 (모델, 다운로드 메뉴 제거)
  - **추가 2**: API 키 설정 UI 제거 (클라우드 LLM 메뉴 제거)
  - **추가 3**: 일반 설정 메뉴 제거 (로컬 모델 설정 불필요)
  - 빌드 테스트 성공

- **발견 사항**:
  - settings.tsx Line 260에 WeeklyDashboard 활성화되어 있음
  - RetrospectPanel은 이미 서브컴포넌트로 분리됨
  - PromptSettings에는 "Instruction Style" UI가 없음 (직접 편집 방식)
  - 로컬 LLM 제거로 번들 크기 30% 감소 (50.12 kB → 35.28 kB)
  - API 키 설정 UI 제거로 추가 31% 감소 (35.28 kB → 24.24 kB)
  - 일반 설정 제거로 추가 7% 감소 (24.24 kB → 22.50 kB)
  - **총 번들 크기 감소: 55.1%** (50.12 kB → 22.50 kB)

- **변경 파일**:
  1. `src/apps/settings/settings.tsx` (여러 곳 주석 처리)
  2. `src/components/panels/constants/retrospect-view-options.tsx` (Preview, Split 숨김)
  3. `src/apps/settings/components/CloudLLMSettings.tsx` (OpenAI만 표시)
  4. `src/apps/settings/components/PromptSettings.tsx` (버전 히스토리 토글)

- **Commit**:
  - ✅ [c9051aa] refactor: phase-0-day-1 - MVP 단순화 작업 완료
  - ✅ [03e33fb] docs: refactoring-progress.md 커밋 정보 업데이트
  - ✅ [d4dbfad] refactor: phase-0-day-1-extended - 로컬 LLM 지원 완전 제거
  - ✅ [35c79d0] refactor: phase-0-day-1-final - API 키 설정 UI 완전 제거
  - ✅ [c33b35f] refactor: phase-0-day-1-ultimate - 일반 설정 메뉴 제거

---

### Session 2 (2025-11-17) - Phase 0 Day 2 완료 ✅
- **작업 시작**: Phase 0 Day 2
- **작업 내용**:
  - AI 프롬프트 재설계 (5가지 섹션 구조)
  - aiPrompts.ts 신규 파일 생성 (STRUCTURED_FEEDBACK_PROMPT)
  - StructuredFeedback 타입 정의 추가 (src/types/ai.ts)
  - aiService.ts 수정 (generateStructuredFeedback 구현)
  - useAiPipeline.ts 재구조화 (2단계 → 단일 단계)
  - AiPanel.tsx & App.tsx 업데이트
  - 빌드 및 타입 체크 성공

- **발견 사항**:
  - 기존 2단계 파이프라인(categorizing → generating_feedback)을 단일 단계(analyzing → done)로 단순화
  - categorization 결과를 파일에 저장하지 않음, 피드백만 UI에 표시
  - 스트리밍 관련 refs 제거 (streamingBufferRef, streamingTimerRef, streamingCleanupRef)
  - PipelineStage 타입 변경: 'idle' | 'categorizing' | 'generating_feedback' | 'complete' → 'idle' | 'analyzing' | 'done' | 'error'

- **변경 파일**:
  1. `src/constants/aiPrompts.ts` (신규 파일)
  2. `src/types/ai.ts` (신규 파일)
  3. `src/services/aiService.ts` (generateStructuredFeedback 함수 추가)
  4. `src/store/appStore.ts` (PipelineStage 타입 변경)
  5. `src/hooks/useAiPipeline.ts` (2단계 → 단일 단계로 재구조화)
  6. `src/components/panels/AiPanel.tsx` (button label 수정)
  7. `src/apps/main/App.tsx` (handleRunPipeline 호출 단순화)

- **Commit**:
  - ✅ [3c9ad59] refactor: phase-0-day-2 - AI 피드백 구조 재설계 완료

---

### Phase 0 - Day 2 Fix: AI 피드백 퀄리티 개선 ✅

#### 작업 1: 본질적 분석 프롬프트 재설계 ✅
- [x] aiPrompts.ts 프롬프트를 본질적 분석 중심으로 완전 재작성
- [x] 감정 분석 프레임워크 추가 (표면 감정 → 근본 감정 → 트리거)
- [x] 행동 패턴 분석 프레임워크 추가 (상황 → 반응 → 결과)
- [x] 맥락 분석 프레임워크 추가 (시간/관계/환경)
- [x] 구체적 금지 사항 명시 (일반적 조언, 추측, 피상적 격려 금지)
- [x] 필수 사항 명시 (데이터 기반, 근본 원인 식별, 실행 가능한 제안)

**파일**: `src/constants/aiPrompts.ts`
**변경사항**:
- STRUCTURED_FEEDBACK_PROMPT: 본질적 분석 프레임워크 추가
- STRUCTURED_FEEDBACK_SYSTEM_PROMPT: 전문 분석가 역할 정의

**개선 사항**:
- ❌ 이전: "친구처럼 편안하게", "간결하고 명확하게" (애매한 지시)
- ✅ 개선: 감정/행동/맥락 분석 프레임워크, 구체적 금지/필수 사항

---

#### 작업 2: aiService.ts 프롬프트 구조 개선 ✅
- [x] generateStructuredFeedback 함수 프롬프트 구조 재설계
- [x] 최근 히스토리 활용 지침 추가 (패턴 분석, 빈도 파악, 트리거 발견)
- [x] 출력 요구사항 명확화 (5가지 섹션 + 톤)
- [x] 모델 업그레이드 (gpt-4o-mini → gpt-4o, 더 깊이 있는 분석)
- [x] Temperature 조정 (0.7 → 0.6, 더 집중된 분석)
- [x] Max tokens 증가 (2000 → 2500, 더 상세한 분석)

**파일**: `src/services/aiService.ts`
**변경사항**: Line 187-229 프롬프트 구조 재설계

**개선 사항**:
- ❌ 이전: 단순히 최근 히스토리 붙여넣기
- ✅ 개선: 분석 지침 포함, 구체적 패턴 발견 방법 제시

---

#### 작업 3: Rust prompts.rs 업데이트 ✅
- [x] for_business_journal_coach 함수 완전 재작성
- [x] System prompt: 전문 분석가 역할 정의 (심리학/행동 과학 기반)
- [x] User prompt: 본질적 분석 프레임워크 전체 포함
- [x] 감정/행동/맥락 분석 원칙 추가
- [x] 5가지 섹션별 상세 지침 추가
- [x] 금지 사항 및 필수 사항 명확화

**파일**: `src-tauri/src/llm/prompts.rs`
**변경사항**: Line 63-165 for_business_journal_coach 함수 완전 재작성

**개선 사항**:
- ❌ 이전: 표면적 조언 중심 (피상적 피드백)
- ✅ 개선: 근본 원인 분석, 데이터 기반 통찰, 실질적 제안

---

#### 작업 4: 빌드 및 검증 ✅
- [x] 빌드 성공 (npm run build)
- [x] TypeScript 컴파일 성공
- [x] Rust 컴파일 성공
- [x] 번들 생성 성공

**검증 결과**:
- ✅ Frontend 빌드: 성공 (1.41s)
- ✅ Backend 빌드: 성공 (11.15s)
- ✅ macOS 앱 번들: 성공
- ✅ DMG 생성: 성공

---

### Session 3 (2025-11-17) - Phase 0 Day 2 Fix 완료 ✅
- **작업 시작**: Phase 0 Day 2 Fix (AI 피드백 퀄리티 개선)
- **작업 내용**:
  - **문제 인식**: AI 피드백 퀄리티가 너무 낮음 (피상적 조언, 일반적 제안)
  - 본질적 분석 프롬프트 재설계 (aiPrompts.ts)
  - 감정/행동/맥락 분석 프레임워크 추가
  - aiService.ts 프롬프트 구조 개선 + 모델 업그레이드 (gpt-4o)
  - Rust prompts.rs 완전 재작성
  - 빌드 및 검증 성공

- **발견 사항**:
  - **기존 문제점**:
    1. 표면적 분석: "구체적인 질문을 준비하세요" 같은 일반적 조언
    2. 데이터 활용 부족: recent history를 받지만 실제 패턴 분석 없음
    3. 깊이 없는 인사이트: 감정의 근본 원인이나 행동 트리거 분석 부재
    4. 실질적 제안 부족: "가벼운 운동을 해보세요" 같은 피상적 제안

  - **개선 방향**:
    1. **본질적 분석 프레임워크**: 표면 감정 → 근본 감정 → 트리거 식별
    2. **행동 패턴 분석**: 상황 → 반응 → 결과 → 패턴 인식
    3. **구체적 데이터 기반 통찰**: 최근 히스토리와 비교하여 실제 변화 추적
    4. **실질적 제안**: "왜"와 "어떻게"를 함께 제시

- **변경 파일**:
  1. `src/constants/aiPrompts.ts` (본질적 분석 프롬프트 완전 재작성)
  2. `src/services/aiService.ts` (프롬프트 구조 개선, 모델 업그레이드)
  3. `src-tauri/src/llm/prompts.rs` (Rust 프롬프트 완전 재작성)

- **주요 개선 사항**:
  - **프롬프트 퀄리티**: 피상적 → 본질적 (감정/행동/맥락 분석 프레임워크)
  - **모델 성능**: gpt-4o-mini → gpt-4o (더 깊이 있는 분석)
  - **분석 깊이**: 표면적 조언 → 근본 원인 분석 + 데이터 기반 통찰
  - **제안 실용성**: 일반적 조언 → 구체적 "왜 + 무엇을 + 어떻게 + 측정"

- **Commit**:
  - ✅ [e0e21a1] refactor: phase-0-day-2-fix - AI 피드백 퀄리티 본질 개선

---

## 🔗 관련 문서

- [MVP Roadmap](./mvp-roadmap.md) - 전체 로드맵
- [Project Analysis](./project-analysis.md) - 프로젝트 분석
- [Component Extraction Guide](./component-extraction-guide.md) - 컴포넌트 가이드
- [Refactoring Plan](./refactoring-plan.md) - 리팩토링 계획

---

## 📊 메트릭

### 코드 변경 통계
- **주석 처리된 줄**: ~120줄
- **추가된 줄**: ~30줄
- **수정된 파일**: 4개
- **삭제된 기능**: WeeklyDashboard, Preview/Split 모드, Claude/Gemini provider, 로컬 LLM, 다운로드, API 키 설정 UI, 일반 설정

### 시간 추적
- **계획 시간**: 2.5시간
- **실제 시간**: ~3.5시간
- **효율성**: 71%

### 복잡도 감소
- **Settings 사이드바**: 8개 → **3개** 메뉴 항목 (**62.5% 감소** 🎯)
- **RetrospectPanel 뷰 모드**: 3개 → 1개 (66% 감소)
- **Cloud Provider**: 3개 → 1개 (66% 감소)
- **Settings 번들 크기**: 50.12 kB → **22.50 kB** (**55.1% 감소** 🚀)

### 최종 Settings 메뉴 (단 3개!)
1. **프롬프트** (기본 탭) ✨
2. 회고 템플릿
3. 정보

---

**마지막 업데이트**: 2025-11-17 (Session 3 - AI 피드백 퀄리티 본질 개선)
**다음 업데이트 예정**: Phase 0 Day 3 작업 시
