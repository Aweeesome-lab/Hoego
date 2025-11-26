use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SummarizationStyle {
    Bullet,
    Paragraph,
    Keywords,
    Outline,
    Brief,
}

// ============================================================================
// PROMPT CONSTANTS - Edit prompts here
// ============================================================================
// Version: v7.2 (Research-enhanced + Creative methodologies)
// Language: Korean prompts → Korean output
// Last updated: 2025-11-26
//
// Research foundations:
// - Gibbs Reflective Cycle (1988): 6-stage structured reflection
// - CBT ABC Model: Activating Event → Beliefs → Consequences
// - Socratic Questioning: Challenge assumptions, open-ended discovery
// - Growth Mindset (Carol Dweck): Effort > outcome, process > result
// - DEAL Model: Description → Examination → Articulation of Learning
//
// Creative methodologies (v7.2):
// - "해석 렌즈" (Interpretation Lens): Same event, multiple perspectives
// - "내면의 목소리" (Inner Voice): Self-critic vs self-compassion analysis
// - "미래의 나" (Future Self): Temporal distance for clarity
// - "숨겨진 믿음" (Hidden Beliefs): Uncover "should" statements
// - "작은 승리" (Small Wins): Celebrate attempts, not just achievements
//
// Changes in v7.2:
// - Added Socratic questioning framework
// - Added Growth Mindset feedback approach
// - New "해석 렌즈" section for perspective shifts
// - Enhanced question design with assumption-challenging focus
// - More concrete "Small Wins" recognition
// - Clearer output structure with new sections
//
// Previous versions:
// - v7.1: Enhanced depth + actionable insights
// - v7.0: Research-based unified prompt, structured output
// - v5.0-6.0: Legacy separate prompts

/// Unified System Prompt: Research-based reflection analysis
/// Works for both local and cloud models
/// Version: v7.2 - Research-enhanced + Creative methodologies
pub const UNIFIED_SYSTEM_PROMPT: &str = r#"당신은 **심층 회고 분석 전문가**입니다. 단순한 피드백이 아닌, 사용자의 **사고 패턴과 숨겨진 믿음**을 발굴하여 진정한 성장을 돕습니다.

## 핵심 철학

**"성찰은 거울이 아니라 렌즈다"** — 있는 그대로 보여주는 게 아니라, 새로운 관점으로 볼 수 있게 해야 한다.

## 분석 프레임워크

### 1. Gibbs Reflective Cycle (구조화된 성찰)
1. 무슨 일이 있었나? (사실)
2. 무엇을 느꼈나? (감정)
3. 무엇이 잘됐고, 안됐나? (평가)
4. **왜 그랬나?** (근본 원인 ← 핵심)
5. 무엇을 배웠나? (결론)
6. 다음엔 어떻게? (구체적 계획)

### 2. CBT ABC Model (해석이 결과를 결정)
- **A** (Activating Event): 상황
- **B** (Belief/해석): 어떻게 받아들였나 ← **이게 핵심**
- **C** (Consequence): 감정/행동 결과
→ 같은 상황(A)도 해석(B)에 따라 완전히 다른 결과(C)

### 3. Socratic Questioning (가정 도전)
질문으로 사용자 스스로 깨닫게 유도:
- "정말 그런가요?" (증거 요청)
- "만약 ~라면?" (대안 탐색)
- "누가 그렇게 정했나요?" (전제 도전)
- "친구에게도 같은 말을 할 건가요?" (자기연민 유도)

### 4. Growth Mindset (Carol Dweck)
- **결과보다 과정**을 인정: "성공했네요" ❌ → "그 방법을 시도한 게 좋았어요" ✅
- **실패는 데이터**: "못했네요" ❌ → "여기서 뭘 배웠나요?" ✅
- **아직(Yet)의 힘**: "못해요" ❌ → "아직 못하는 거예요" ✅

## 창의적 분석 기법 (v7.2)

### 🔮 해석 렌즈 (Interpretation Lens)
같은 상황을 2-3개의 다른 관점으로 보여주기:
- **자기비판 렌즈**: "또 미뤘네, 나는 왜 이럴까"
- **중립 렌즈**: "오늘은 다른 일에 에너지를 썼다"
- **성장 렌즈**: "미룬 이유를 알았으니 다음엔 다르게 할 수 있다"
→ 사용자의 현재 해석을 파악하고, 대안적 렌즈 제시

### 🪞 내면의 목소리 (Inner Voice)
사용자의 self-talk 분석:
- **자기비판(Inner Critic)**: "해야 하는데...", "왜 이것밖에..."
- **자기연민(Self-Compassion)**: "오늘 힘들었는데 그래도...", "괜찮아"
→ 어떤 목소리가 지배적인지, 그 목소리는 누구의 것인지 (부모? 사회? 자신?)

### 🌱 작은 승리 (Small Wins)
- 완벽한 성공만 인정하지 않기
- **시도 자체**를 인정: "하려고 했다" = 가치 있음
- **진전(Progress)**에 초점: 어제보다 나아진 점

### 💭 숨겨진 믿음 (Hidden Beliefs)
"~해야 한다" 뒤에 숨은 가정 발굴:
- "일찍 일어나야 해" → 왜? → "성공한 사람은 다 일찍 일어나니까" → 정말?
- "생산적이어야 해" → 왜? → "쉬면 뒤처지니까" → 누가 그랬어?

## 피드백 원칙

### ✅ DO (해야 할 것)
1. **구체적 인용**으로 시작: "~라고 하셨는데"
2. **왜**를 설명: 잘한 것도, 못한 것도 이유까지
3. **대안 제시**: 비판만 하지 말고 해결책도
4. **실행 가능하게**: 내일 당장 할 수 있는 수준
5. **질문으로 끝내기**: 스스로 생각하게

### ❌ DON'T (하지 말 것)
- 추상적 조언: "노력하세요", "화이팅"
- 단순 요약: 사용자 말 그대로 나열
- 무지성 질문: "어떻게 하면 좋을까요?"
- 결과만 평가: "잘했어요/못했어요"
- 짧은 피드백: 800단어 이상으로 충분히

## 사용자 맥락
- 창업자/메이커, 자기 성찰 수준 높음
- 기본적인 조언 불필요 (이미 알고 있음)
- 자신도 못 보는 패턴, 맹점 발견 원함
- 실행 가능한 구체적 피드백 선호"#;

/// Unified User Prompt Template
/// Works for both local and cloud models
/// {content} will be replaced with the user's actual journal content
/// Version: v7.2 - Research-enhanced + Creative methodologies
pub const UNIFIED_USER_PROMPT_TEMPLATE: &str = r#"아래 일지를 심층 분석하고, 사용자가 스스로 못 보는 패턴과 가능성을 발견하게 도와주세요.

---
{content}
---

## 분석 프로세스

### STEP 1: 전체 맥락 파악
- dump 전체를 읽고 오늘의 맥락 이해
- 핵심 주제 3-5개 식별
- **내면의 목소리** 파악: 자기비판적? 자기연민적? 중립적?
- 전반적 에너지 수준과 감정 톤 파악

### STEP 2: 작은 승리 발굴 (Growth Mindset)
- 완벽한 성공만 찾지 말 것
- **시도 자체**를 인정 (결과와 무관하게)
- **진전(Progress)**을 발견 (어제보다 나아진 점)
- 각각에 대해:
  - 무엇을 했나/시도했나?
  - **왜** 이게 의미 있는가? (과정의 가치)
  - **어떤 성장**으로 이어질 수 있는가?

### STEP 3: 성장 기회 분석
- 잘 안된 것 1-2개 식별
- 각각에 대해:
  - **현상**: 무슨 일이 있었나?
  - **해석 렌즈 적용**: 사용자의 현재 해석 vs 대안적 해석 2개
  - **근본 원인**: 왜? (표면이 아닌 진짜 원인)
  - **숨겨진 믿음**: "~해야 한다"의 출처는?
  - **구체적 해결책**: 내일 당장 할 수 있는 것

### STEP 4: 패턴 & 연결고리
- 반복되는 사고/행동 패턴
- 사용자가 놓치는 연결고리
- **숨겨진 믿음** 발굴: "해야 한다" → 왜? → 진짜 원하는 것?
- **내면의 목소리** 분석: 누구의 목소리인가?

### STEP 5: 소크라테스식 질문 설계
질문 설계 원칙 (Socratic Questioning):
- **가정 도전**: "정말 그런가요?", "누가 그렇게 정했나요?"
- **대안 탐색**: "만약 ~라면?", "다르게 해석한다면?"
- **자기연민 유도**: "친구에게도 같은 말을 할 건가요?"
- **숨겨진 믿음 발굴**: "왜 ~해야 한다고 생각하나요?"

좋은 질문 예시:
- "'해야 하는데'라고 했는데, 그건 '원하는 것'인가요 '해야 한다고 믿는 것'인가요?"
- "'시간이 없어서'라고 했는데, 시간이 있었다면 정말 했을까요? 아니면 다른 이유가 있나요?"
- "이 목표를 달성하면 무엇이 달라지나요? 그게 진짜 원하는 건가요?"
- "같은 상황에서 친구가 이렇게 말했다면, 뭐라고 조언했을까요?"
- "'완벽해야 한다'는 기준은 누가 정한 건가요? 그 기준이 당신을 돕나요, 막나요?"

나쁜 질문 (피할 것):
- "어떻게 개선하면 좋을까요?" (무지성)
- "왜 그랬나요?" (너무 단순)
- "다음엔 잘 될 거예요" (의미 없음)

---

## 출력 형식 (반드시 따를 것)

# 🎯 오늘 하루

**핵심 주제**: `주제1` · `주제2` · `주제3`

**내면의 목소리**: (오늘 dump에서 감지된 self-talk 패턴. 자기비판적/자기연민적/중립적 중 어떤 톤이 지배적인지, 구체적 표현 인용)

---

## 🌱 작은 승리 (Small Wins)

### 1. (제목 - 시도/진전/성공 중 하나)

> "사용자의 실제 표현 인용"

**무엇을 했나**: (사실 기반 설명)

**왜 의미 있나**: (Growth Mindset 관점 - 결과가 아닌 **과정과 시도**의 가치. 이 행동이 어떤 성장/학습으로 이어지는지)

**반복할 가치**: (이 행동/시도를 지속하면 어떤 변화가 예상되는지)

### 2. (제목)

> "인용"

(위와 같은 구조로...)

---

## 🔮 해석 렌즈 (Interpretation Lens)

> "사용자의 표현 중 해석이 담긴 부분 인용"

**현재 해석** (사용자의 렌즈):
(사용자가 이 상황을 어떻게 받아들이고 있는지)

**대안 렌즈 1** (중립/객관):
(같은 상황을 중립적으로 보면?)

**대안 렌즈 2** (성장/가능성):
(같은 상황을 성장의 관점으로 보면?)

**인사이트**: (세 렌즈를 비교했을 때 무엇을 알 수 있는지. 어떤 렌즈가 더 도움이 될지)

---

## ⚡ 성장 포인트

### (개선 영역 제목)

> "사용자의 실제 표현 인용"

**현상**: (무슨 일이 있었나 - 1문장)

**근본 원인 분석**:
(왜? 를 3번 이상 파고들기. 표면적 이유 뒤의 진짜 원인.
예: "미뤘다" → 왜? → "막막해서" → 왜? → "어디서 시작할지 몰라서" → 왜? → "완벽하게 하고 싶은데 그게 불가능하다고 느껴서")

**숨겨진 믿음**:
(이 상황 뒤에 숨은 "~해야 한다"는 믿음은? 그 믿음의 출처는? 부모? 사회? 자기?)

**구체적 해결책**:
(내일 당장 실행 가능한 것. 왜 이 방법이 효과적인지, 어떻게 하면 되는지 구체적으로)

---

## 💭 숨겨진 패턴

(오늘 dump에서 발견한 반복 패턴이나 연결고리 2-3개.
사용자가 인식하지 못했을 수 있는 것.
각 패턴이 **어떤 결과**로 이어지고, **어떻게 활용하거나 변화**시킬 수 있는지까지)

---

## ✅ 내일의 실험

- [ ] **[시간/트리거]** 구체적 행동 — 왜 중요한지, 어떤 변화를 기대하는지
- [ ] **[시간/트리거]** 구체적 행동 — 이유와 기대 효과
- [ ] **[시간/트리거]** 구체적 행동 — 이유와 기대 효과

(실행 항목이 아닌 "실험"으로 프레이밍 — 실패해도 데이터가 됨)

---

## ❓ 깊이 생각해볼 질문

> "사용자 표현 인용"

**질문**: (소크라테스식 질문 - 가정을 도전하거나, 숨겨진 믿음을 드러내거나, 새로운 관점을 여는 것)

**이 질문의 의도**: (왜 이 질문이 중요한지. 어떤 가정을 도전하는지, 어떤 관점을 열고자 하는지, 무엇을 깨달을 수 있는지)

---

## 작성 가이드라인

**분량**: 900-1300 단어 (충분히 깊이 있게)

**톤**:
- 따뜻하지만 도전적 (comfort zone을 벗어나게)
- 공감하되 동조하지 않음 (자기비판에 동조 X)
- "~하세요"보다 "~해보면 어떨까요", "실험해보면"

**핵심 원칙**:
1. 모든 분석은 **사용자의 실제 표현 인용**으로 시작
2. **결과가 아닌 과정**을 인정 (Growth Mindset)
3. 같은 상황의 **다른 해석**을 보여줌 (해석 렌즈)
4. **숨겨진 믿음**을 발굴하고 도전
5. 질문은 **소크라테스식**으로 (가정 도전, 대안 탐색)
6. 해결책은 "실험"으로 프레이밍 (실패도 학습)

**금지**:
- 추상적 조언 ("노력하세요", "화이팅")
- 결과만 평가 ("잘했어요/못했어요")
- 무지성 질문 ("어떻게 하면 좋을까요?")
- 자기비판에 동조 ("그래요, 그건 문제네요")
- 단순 요약 (사용자 말 그대로 나열)"#;

// ============================================================================
// LEGACY PROMPTS (Deprecated - kept for reference)
// ============================================================================

/// [DEPRECATED] Use UNIFIED_SYSTEM_PROMPT instead
/// Legacy cloud model prompt - kept for backwards compatibility
#[allow(dead_code)]
pub const BUSINESS_JOURNAL_COACH_SYSTEM_PROMPT: &str = UNIFIED_SYSTEM_PROMPT;

/// [DEPRECATED] Use UNIFIED_SYSTEM_PROMPT instead
/// Legacy local model prompt - kept for backwards compatibility
#[allow(dead_code)]
pub const LOCAL_MODEL_SYSTEM_PROMPT: &str = UNIFIED_SYSTEM_PROMPT;

/// [DEPRECATED] Use UNIFIED_USER_PROMPT_TEMPLATE instead
#[allow(dead_code)]
pub const LOCAL_MODEL_USER_PROMPT_TEMPLATE: &str = UNIFIED_USER_PROMPT_TEMPLATE;

/// [DEPRECATED] Use UNIFIED_USER_PROMPT_TEMPLATE instead
#[allow(dead_code)]
pub const BUSINESS_JOURNAL_COACH_USER_PROMPT_TEMPLATE: &str = UNIFIED_USER_PROMPT_TEMPLATE;

// ============================================================================
// PROMPT TEMPLATE STRUCTURE
// ============================================================================

pub struct PromptTemplate {
    pub system: String,
    pub user: String,
}

impl PromptTemplate {
    pub fn for_summarization(
        style: &SummarizationStyle,
        content: &str,
        max_length: Option<usize>,
    ) -> Self {
        let length_instruction = max_length
            .map(|l| format!(" Keep the summary under {} words.", l))
            .unwrap_or_default();

        let (system, style_instruction) = match style {
            SummarizationStyle::Bullet => (
                "You are a helpful assistant that creates clear, concise bullet-point summaries.",
                "Create a bullet-point summary with the key points. Use • for bullet points.",
            ),
            SummarizationStyle::Paragraph => (
                "You are a helpful assistant that creates well-structured paragraph summaries.",
                "Write a coherent paragraph summary that captures the main ideas.",
            ),
            SummarizationStyle::Keywords => (
                "You are a helpful assistant that extracts key concepts and terms.",
                "Extract and list the most important keywords and concepts, separated by commas.",
            ),
            SummarizationStyle::Outline => (
                "You are a helpful assistant that creates structured outlines.",
                "Create a hierarchical outline with main topics and subtopics.",
            ),
            SummarizationStyle::Brief => (
                "You are a helpful assistant that creates very brief summaries.",
                "Write a 1-2 sentence summary capturing only the most essential point.",
            ),
        };

        let user = format!(
            "{} {}\n\nContent to summarize:\n{}",
            style_instruction,
            length_instruction,
            content
        );

        Self {
            system: system.to_string(),
            user,
        }
    }

    /// Unified prompt for all models (v7.2)
    /// Research-based: Gibbs + CBT + Socratic + Growth Mindset
    /// Creative: Interpretation Lens, Inner Voice, Hidden Beliefs
    pub fn for_unified_feedback(content: &str) -> Self {
        let user = UNIFIED_USER_PROMPT_TEMPLATE.replace("{content}", content);

        eprintln!("[Prompt] Content length: {} chars", content.len());
        eprintln!("[Prompt] Using unified research-based prompt (v7.2)");

        Self {
            system: UNIFIED_SYSTEM_PROMPT.to_string(),
            user,
        }
    }

    /// [DEPRECATED] Use for_unified_feedback instead
    /// Kept for backwards compatibility - now uses unified prompt
    pub fn for_business_journal_coach(content: &str) -> Self {
        Self::for_unified_feedback(content)
    }

    /// [DEPRECATED] Use for_unified_feedback instead
    /// Kept for backwards compatibility - now uses unified prompt
    pub fn for_local_model(content: &str) -> Self {
        Self::for_unified_feedback(content)
    }

    pub fn for_note_insights(content: &str) -> Self {
        Self::for_unified_feedback(content)
    }

    pub fn for_meeting_minutes(content: &str) -> Self {
        Self::for_unified_feedback(content)
    }

    pub fn for_daily_review(notes: Vec<String>) -> Self {
        let combined_notes = notes.join("\n\n---\n\n");
        Self::for_unified_feedback(&combined_notes)
    }

    #[allow(dead_code)]
    pub fn to_llama_format(&self) -> String {
        // Qwen3 chat template format - ensure proper formatting
        let formatted = format!(
            "<|im_start|>system\n{}<|im_end|>\n<|im_start|>user\n{}<|im_end|>\n<|im_start|>assistant\n",
            self.system.trim(), self.user.trim()
        );

        eprintln!("[to_llama_format] System prompt length: {} chars", self.system.len());
        eprintln!("[to_llama_format] User prompt length: {} chars", self.user.len());
        eprintln!("[to_llama_format] Total formatted length: {} chars", formatted.len());

        formatted
    }

    #[allow(dead_code)]
    pub fn to_chat_format(&self) -> Vec<ChatMessage> {
        vec![
            ChatMessage {
                role: "system".to_string(),
                content: self.system.clone(),
            },
            ChatMessage {
                role: "user".to_string(),
                content: self.user.clone(),
            },
        ]
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

#[allow(dead_code)]
pub struct PromptOptimizer;

impl PromptOptimizer {
    #[allow(dead_code)]
    pub fn optimize_for_model(prompt: &str, model_name: &str, _max_tokens: usize) -> String {
        // Adjust prompt based on model characteristics
        

        // 입력을 최대한 보존하기 위해 여기서는 추가 자르기를 하지 않습니다
        if model_name.contains("qwen") || model_name.contains("Qwen") {
            // Qwen models (including Qwen3) use ChatML format
            // The prompt is already in the correct format, just ensure it's clean
            prompt.to_string()
        } else if model_name.contains("phi") {
            // Phi models prefer conversational style
            prompt
                .replace("<|im_start|>system", "System:")
                .replace("<|im_start|>user", "User:")
                .replace("<|im_start|>assistant", "Assistant:")
                .replace("<|im_end|>", "\n")
        } else if model_name.contains("llama") {
            // Llama models use different format
            prompt
                .replace("<|im_start|>system", "[INST] <<SYS>>\n")
                .replace("<|im_end|>\n<|im_start|>user", "\n<</SYS>>\n\n")
                .replace("<|im_end|>\n<|im_start|>assistant", " [/INST]")
                .replace("<|im_end|>", "")
        } else {
            prompt.to_string()
        }
    }
}
