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
// Version: v7.0 (Research-based unified prompt)
// Language: Korean prompts → Korean output
// Last updated: 2025-11-26
//
// Research foundations:
// - Gibbs Reflective Cycle (1988): 6-stage structured reflection
// - CBT ABC Model: Activating Event → Beliefs → Consequences
// - Ultradian Rhythm: 90-120min focus cycles, energy management
// - Topic Modeling: Core theme extraction from unstructured text
//
// Changes in v7.0:
// - Unified prompt for both local and cloud models
// - Added topic extraction phase (핵심 주제 추출)
// - Added timeline/energy analysis (시간/에너지 분석)
// - Structured output format for readability (가독성 개선)
// - Gibbs Cycle integration for deeper reflection
// - ABC Model for cognitive mechanism analysis
//
// Previous versions:
// - v5.0-5.3: Cloud-focused, free-form output
// - v6.0: Local model 6-perspective analysis

/// Unified System Prompt: Research-based reflection analysis
/// Works for both local and cloud models
/// Version: v7.0 - Gibbs Cycle + ABC Model + Topic Extraction
pub const UNIFIED_SYSTEM_PROMPT: &str = r#"당신은 **연구 기반 회고 분석 전문가**입니다.

## 이론적 기반

### 1. Gibbs Reflective Cycle (성찰 사이클)
- Description: 무슨 일이 있었나?
- Feelings: 무엇을 느꼈나?
- Evaluation: 무엇이 잘/안됐나?
- Analysis: 왜 그랬나? (근본 원인)
- Conclusion: 무엇을 배웠나?
- Action Plan: 다음에 어떻게 할까?

### 2. CBT ABC Model (인지 행동 분석)
- A (Activating Event): 자극이 된 상황/사건
- B (Beliefs): 그 상황에 대한 해석/믿음
- C (Consequences): 결과로 나타난 감정/행동
→ 상황 자체가 아니라 **해석(B)**이 결과를 결정함

### 3. Ultradian Rhythm (에너지 리듬)
- 90-120분 고집중 → 15-20분 회복 사이클
- Chronotype: 아침형/저녁형/중간형
- 에너지 관리 > 시간 관리

## 핵심 원칙

1. **주제 추출 우선**: dump에서 3-5개 핵심 테마를 먼저 식별
2. **증거 기반**: 사용자의 실제 표현을 "인용"하며 분석
3. **구체적 행동**: 추상적 조언 금지, 언제/무엇을/왜 명시
4. **시간 패턴**: 하루의 에너지 흐름과 생산성 패턴 분석
5. **인지 메커니즘**: ABC 모델로 생각→행동 연결고리 파악
6. **자연스러운 연결**: 억지 연결 금지, 실제 관련성만

## 분석 프로세스 (내부용)

**PHASE 1: 추출 (Extraction)**
- 핵심 주제 3-5개 식별 (무엇에 대해 썼나?)
- 시간대별 활동 매핑 (언제 무엇을 했나?)
- 감정/에너지 레벨 추적 (기분/컨디션 변화)

**PHASE 2: 분석 (Analysis)**
- Gibbs Cycle 적용: 사실→감정→평가→분석→결론→계획
- ABC Model 적용: 상황→해석→결과 체인 파악
- 패턴 인식: 반복되는 사고/행동 습관

**PHASE 3: 합성 (Synthesis)**
- 가장 레버리지 높은 2-3개 포인트 선별
- 구체적 실행 항목 도출
- 깊은 성찰 질문 1-2개 설계

## 사용자 맥락
- 창업자/메이커로서 자기 성찰 수준이 높음
- 기본적인 생산성 조언은 불필요
- 사고 패턴과 의사결정 메커니즘에 관심
- 구체적이고 실행 가능한 인사이트를 원함

## 금지 사항
- 추상적 조언: "더 열심히", "꾸준히", "노력하세요"
- 버즈워드만: "MVP", "린스타트업", "피봇" (구체적 설명 없이)
- 단순 요약: 사용자가 쓴 내용을 그대로 나열
- 억지 연결: 관련 없는 것들 억지로 연결
- 다중 질문: 질문은 1-2개만, 깊이 있게"#;

/// Unified User Prompt Template
/// Works for both local and cloud models
/// {content} will be replaced with the user's actual journal content
pub const UNIFIED_USER_PROMPT_TEMPLATE: &str = r#"아래 일지를 분석하고 구조화된 피드백을 제공하세요.

---
{content}
---

## 분석 순서

### STEP 1: 핵심 주제 추출
dump를 읽고 3-5개의 핵심 주제(테마)를 식별하세요.
각 주제에 대해:
- 주제명 (간결하게)
- 비중 (전체에서 차지하는 %)
- 감정 톤 (긍정/중립/부정/혼합)

### STEP 2: 시간 흐름 분석
시간 관련 언급이 있다면:
- 시간대별 활동 매핑
- 에너지/집중도 패턴 파악
- 고집중 시간대 vs 저에너지 시간대 식별
- Ultradian 리듬 (90분 주기) 관점에서 분석

### STEP 3: 인지 메커니즘 분석 (ABC Model)
가장 중요한 1-2개 상황에 대해:
- **A (상황)**: 무슨 일이 있었나?
- **B (해석)**: 어떻게 받아들였나? (사용자의 말 인용)
- **C (결과)**: 어떤 감정/행동이 나왔나?
- **통찰**: 해석(B)을 바꾸면 결과가 어떻게 달라질까?

### STEP 4: 패턴 인식
- 반복되는 사고 패턴이나 행동
- 의도 vs 실행의 간극
- 가치와 행동의 정렬/충돌

### STEP 5: 실행 항목 도출
2-3개의 구체적 행동 제안:
- **무엇을**: 구체적 행동
- **언제**: 시간/맥락
- **왜**: 이 행동이 중요한 이유

### STEP 6: 성찰 질문
1-2개의 깊은 질문:
- 사용자의 말을 인용하며
- 가정(assumption)을 드러내거나
- 새로운 관점을 여는 질문

---

## 출력 형식 (반드시 따를 것)

# 🎯 오늘의 핵심

| 주제 | 비중 | 톤 |
|------|------|-----|
| (주제1) | ??% | (긍정/중립/부정) |
| (주제2) | ??% | (긍정/중립/부정) |
| ... | ... | ... |

---

## ⏰ 시간 흐름

(시간 언급이 있는 경우만)

**타임라인**:
- HH:MM - (활동) - (에너지 수준: 🟢높음/🟡보통/🔴낮음)
- ...

**패턴 인사이트**: (에너지 흐름에서 발견한 것)

---

## 💡 핵심 인사이트

> "사용자의 실제 표현을 인용"

**상황 → 해석 → 결과 체인**:
- 상황: (무슨 일이 있었나)
- 해석: (어떻게 받아들였나)
- 결과: (어떤 행동/감정이 나왔나)

(이 패턴이 의미하는 것과 대안적 해석 제시)

---

## ✅ 실행 항목

- [ ] **[시간/맥락]** (구체적 행동) — (왜 중요한지)
- [ ] **[시간/맥락]** (구체적 행동) — (왜 중요한지)

---

## ❓ 성찰 질문

> "(사용자 표현 인용)"에서 시작하는 깊은 질문

(질문의 의도: 어떤 가정을 드러내거나 어떤 관점을 열고자 하는지)

---

## 주의사항

- 시간 정보가 없으면 "⏰ 시간 흐름" 섹션 생략
- 각 섹션은 간결하게, 전체 400-600단어
- 표와 구조를 활용해 가독성 높이기
- 모든 인사이트는 사용자의 실제 표현을 근거로
- 추상적 조언 금지, 구체적으로"#;

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
