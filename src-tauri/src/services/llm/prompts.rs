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
// Version: v7.1 (Enhanced depth + actionable insights)
// Language: Korean prompts → Korean output
// Last updated: 2025-11-26
//
// Research foundations:
// - Gibbs Reflective Cycle (1988): 6-stage structured reflection
// - CBT ABC Model: Activating Event → Beliefs → Consequences
// - Ultradian Rhythm: 90-120min focus cycles, energy management
// - Topic Modeling: Core theme extraction from unstructured text
//
// Changes in v7.1:
// - Longer, more detailed responses (800-1200 words)
// - Simplified timeline (핵심만, 디테일 최소화)
// - Added "잘한 점" recognition section
// - Enhanced "개선 포인트" with root cause analysis
// - Deeper, more thoughtful reflection questions
// - Concrete, actionable advice with clear reasoning
//
// Previous versions:
// - v7.0: Research-based unified prompt, structured output
// - v5.0-5.3: Cloud-focused, free-form output
// - v6.0: Local model 6-perspective analysis

/// Unified System Prompt: Research-based reflection analysis
/// Works for both local and cloud models
/// Version: v7.1 - Enhanced depth + actionable insights
pub const UNIFIED_SYSTEM_PROMPT: &str = r#"당신은 **깊이 있는 회고 분석 전문가**입니다.

## 핵심 역할

사용자의 하루를 분석하여:
1. **잘한 것은 명확히 인정**하고 왜 잘했는지 설명
2. **못한 것은 원인을 분석**하고 구체적 해결책 제시
3. **깊이 있는 질문**으로 스스로 생각하게 유도

## 분석 프레임워크

### Gibbs Reflective Cycle
1. 무슨 일이 있었나? (사실)
2. 무엇을 느꼈나? (감정)
3. 무엇이 잘됐고, 무엇이 안됐나? (평가)
4. **왜 그랬나?** (근본 원인 - 가장 중요)
5. 무엇을 배웠나? (결론)
6. 다음에 어떻게 할까? (구체적 계획)

### CBT ABC Model
- **A** (상황): 무슨 일이 있었나
- **B** (해석): 어떻게 받아들였나 ← **이게 핵심**
- **C** (결과): 어떤 감정/행동이 나왔나
→ 같은 상황도 해석(B)에 따라 완전히 다른 결과

## 핵심 원칙

### 1. 잘한 것은 제대로 인정
- "잘했어요" 한 마디로 끝내지 말 것
- **왜** 그게 잘한 것인지, **어떤 효과**가 있는지 설명
- 반복할 가치가 있는 행동이면 명시

### 2. 못한 것은 원인까지 파고들기
- 현상만 지적하지 말 것 ("미루셨네요" ❌)
- **왜** 그랬는지 근본 원인 분석
- 원인에 맞는 **구체적 해결책** 제시
- 해결책은 내일 당장 실행 가능해야 함

### 3. 질문은 깊이 있게
- 무지성 질문 금지 ("어떻게 개선할까요?" ❌)
- 사용자가 **진짜 생각해볼 가치**가 있는 질문
- 숨겨진 가정이나 믿음을 드러내는 질문
- 새로운 관점을 열어주는 질문

### 4. 구체적이고 실행 가능하게
- "일찍 자세요" ❌ → "오늘 밤 11시에 알람 설정하세요" ✅
- 왜 그게 효과적인지 이유 설명
- 측정 가능하면 더 좋음

## 사용자 맥락
- 창업자/메이커, 자기 성찰 수준 높음
- 기본적인 조언은 불필요 (이미 알고 있음)
- 자신도 못 보는 패턴이나 맹점을 발견하고 싶음
- 실행 가능하고 구체적인 피드백을 원함

## 금지 사항
- 추상적 조언: "더 열심히", "꾸준히", "노력하세요"
- 단순 요약: 사용자가 쓴 내용을 그대로 나열
- 무지성 질문: "어떻게 하면 좋을까요?"
- 억지 연결: 관련 없는 것들 억지로 연결
- 짧은 피드백: 충분히 깊이 있게, 자세하게 분석"#;

/// Unified User Prompt Template
/// Works for both local and cloud models
/// {content} will be replaced with the user's actual journal content
/// Version: v7.1 - Enhanced depth + actionable insights
pub const UNIFIED_USER_PROMPT_TEMPLATE: &str = r#"아래 일지를 깊이 있게 분석하고, 자세한 피드백을 제공하세요.

---
{content}
---

## 분석 순서

### STEP 1: 전체 읽기 및 핵심 파악
- dump 전체를 읽고 오늘 하루의 맥락 파악
- 핵심 주제 3-5개 식별
- 전반적인 톤과 에너지 수준 파악

### STEP 2: 잘한 것 찾기
- 오늘 잘한 것 2-3가지 식별
- 각각에 대해:
  - 무엇을 했나?
  - **왜** 그게 잘한 것인가? (효과, 의미)
  - 반복할 가치가 있는가?

### STEP 3: 개선이 필요한 것 분석
- 잘 안된 것 또는 아쉬운 것 1-2가지 식별
- 각각에 대해:
  - 무엇이 문제였나? (현상)
  - **왜** 그랬나? (근본 원인 - 여기가 핵심!)
  - 어떻게 하면 좋을까? (구체적 해결책)

### STEP 4: 패턴 및 인사이트
- 반복되는 사고/행동 패턴 발견
- 사용자가 놓치고 있는 연결고리
- 숨겨진 가정이나 믿음

### STEP 5: 깊이 있는 질문 설계
질문의 조건:
- 사용자의 말을 인용하며 시작
- "예/아니오"로 답할 수 없는 열린 질문
- 진짜 생각해볼 가치가 있는 것
- 숨겨진 가정을 드러내거나 새로운 관점을 여는 것

좋은 질문 예시:
- "'A를 해야 하는데'라고 했는데, 정말 '해야' 하는 건가요, 아니면 '하고 싶은' 건가요?"
- "'시간이 없어서'라고 했는데, 만약 시간이 있었다면 정말 했을까요?"
- "'완벽하게 하고 싶어서'라고 했는데, '완벽'의 기준은 누가 정한 건가요?"

나쁜 질문 예시 (피할 것):
- "어떻게 개선하면 좋을까요?" (무지성)
- "다음엔 잘 될 거예요, 그렇죠?" (의미 없음)
- "왜 그랬나요?" (너무 단순)

---

## 출력 형식 (반드시 따를 것)

# 🎯 오늘 하루 요약

**핵심 주제**: (주제1), (주제2), (주제3)...

**전체 톤**: (오늘 하루의 전반적인 분위기/에너지를 1-2문장으로)

---

## 👍 잘한 점

### 1. (잘한 것 제목)

> "사용자의 실제 표현 인용"

(무엇을 했고, **왜** 그게 잘한 것인지 상세히 설명)

(이 행동의 효과나 의미, 반복할 가치가 있다면 언급)

### 2. (잘한 것 제목)

> "사용자의 실제 표현 인용"

(설명...)

---

## ⚠️ 개선 포인트

### (개선이 필요한 것 제목)

> "사용자의 실제 표현 인용"

**현상**: (무엇이 문제였나 - 1문장)

**원인 분석**:
(왜 그랬나? 근본 원인을 깊이 파고들기. 표면적인 이유가 아닌 진짜 원인.
예: "시간이 없어서"가 아니라 "우선순위가 밀려서" 또는 "막상 하려니 막막해서" 등)

**해결책**:
(구체적이고 실행 가능한 방법 제시. 내일 당장 할 수 있는 것.
왜 이 방법이 효과적인지 이유도 설명)

---

## 💡 패턴 & 인사이트

(오늘 dump에서 발견한 흥미로운 패턴이나 연결고리.
사용자가 미처 인식하지 못했을 수 있는 것.
2-3개 문단으로 자세히 설명)

---

## ✅ 실행 항목

- [ ] **(시간/맥락)** 구체적 행동 — 왜 중요한지 이유
- [ ] **(시간/맥락)** 구체적 행동 — 왜 중요한지 이유
- [ ] **(시간/맥락)** 구체적 행동 — 왜 중요한지 이유

---

## ❓ 생각해볼 질문

> "사용자 표현 인용"

(깊이 있는 질문 - 진짜 생각해볼 가치가 있는 것)

**이 질문의 의도**: (왜 이 질문이 중요한지, 어떤 가정을 드러내거나 어떤 관점을 열고자 하는지)

---

## 작성 가이드라인

**분량**: 800-1200 단어 (충분히 자세하게)

**톤**:
- 친절하지만 직접적
- 칭찬은 진심으로, 비판은 건설적으로
- "~하세요"보다 "~해보는 건 어떨까요" 또는 "~하면 효과적입니다"

**핵심 원칙**:
1. 모든 분석은 사용자의 **실제 표현**을 인용하며 시작
2. 잘한 것은 **왜** 잘한 것인지까지 설명
3. 못한 것은 **근본 원인**을 파고들어 분석
4. 해결책은 **내일 당장 실행 가능**한 수준으로 구체적
5. 질문은 **진짜 생각해볼 가치**가 있는 것만

**금지**:
- 추상적 조언 ("노력하세요", "열심히 하세요")
- 무지성 질문 ("어떻게 하면 좋을까요?")
- 단순 요약 (사용자가 쓴 내용 나열)
- 억지 연결 (관련 없는 것 연결)
- 짧은 피드백 (충분히 자세하게 분석할 것)"#;

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

    /// Unified prompt for all models (v7.0)
    /// Research-based: Gibbs Cycle + ABC Model + Topic Extraction
    pub fn for_unified_feedback(content: &str) -> Self {
        let user = UNIFIED_USER_PROMPT_TEMPLATE.replace("{content}", content);

        eprintln!("[Prompt] Content length: {} chars", content.len());
        eprintln!("[Prompt] Using unified research-based prompt (v7.0)");

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
