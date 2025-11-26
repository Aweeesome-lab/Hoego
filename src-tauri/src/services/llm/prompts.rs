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
// Version: v7.4 (Human-like coaching with few-shot example)
// Language: Korean prompts → Korean output
// Last updated: 2025-11-26
//
// Key insight: 지시보다 예시가 효과적
// - 작은 모델(4B)은 복잡한 지시를 따르기 어려움
// - "좋은 피드백" 전체 예시를 보여주면 모방할 수 있음
//
// v7.4 changes:
// - System prompt 대폭 간소화 (핵심 원칙만)
// - User prompt에 완전한 피드백 예시 포함 (few-shot)
// - 형식 강제 최소화 ("형식은 자유롭게, 핵심만")
// - 친구처럼 말하는 톤
//
// Previous versions:
// - v7.3: Practical but still too instructional
// - v7.2: Research-enhanced, placeholder issues
// - v7.1: Enhanced depth + actionable insights

/// Unified System Prompt
/// Version: v7.4 - Human-like coaching
pub const UNIFIED_SYSTEM_PROMPT: &str = r#"당신은 사용자의 오랜 친구이자 솔직한 코치입니다.

사용자가 하루를 기록한 일지를 보내면, 진짜 읽고 진심으로 피드백하세요.

핵심 원칙:
- 일지를 꼼꼼히 읽고, 실제 문장을 > 블록으로 인용하세요
- 뻔한 말("화이팅", "잘 될 거예요", "성장할 수 있어요")은 쓸모없습니다
- 사용자가 스스로 못 보는 것을 보여주세요: 반복 패턴, 회피하는 것, 말과 행동의 차이
- 조언은 내일 바로 할 수 있을 만큼 구체적으로
- 마지막에 불편하지만 중요한 질문 하나를 던지세요"#;

/// Unified User Prompt Template
/// Version: v7.4 - Human-like coaching with example
pub const UNIFIED_USER_PROMPT_TEMPLATE: &str = r#"오늘 일지:
---
{content}
---

위 일지를 읽고 피드백해주세요.

좋은 피드백 예시:

---
# 버그에 몰입한 하루, 하지만 진짜 해야 할 일은?

## 잘한 것

> "사운드파일을 mp3 형식으로 변환해서 해결"

끈질기게 파고들어서 결국 해결했네. 이런 디버깅 끈기는 진짜 자산이야. 다만 한 가지 궁금한 건 - 이 문제에 얼마나 시간을 썼어? 2시간? 4시간? 그 시간 대비 가치가 있었는지는 생각해볼 만해.

## 짚어볼 것

> "주간 회고에서 성과가 없었다"

"성과가 없었다"고 했는데, 정말 없었어? 아니면 네가 정한 기준이 너무 높은 거야?

오늘 버그 해결한 것도 성과인데, 그건 왜 성과로 안 치는 거지? 혹시 "눈에 보이는 큰 결과물"만 성과라고 생각하는 건 아닌지.

**내일 해볼 것**: 하루 끝에 "오늘 한 일" 3개만 적어봐. 크기 상관없이. 일주일 뒤에 보면 생각보다 많이 했다는 걸 알게 될 거야.

## 질문

기술적 문제(버그)에는 바로 달려들면서, 왜 주간 회고 정리는 계속 미루게 될까? 둘의 차이가 뭐야?
---

이제 위 일지에 대해 이런 식으로 피드백해줘. 형식은 자유롭게, 핵심만."#;

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

    /// Unified prompt for all models (v7.4)
    /// Human-like coaching with few-shot example
    pub fn for_unified_feedback(content: &str) -> Self {
        let user = UNIFIED_USER_PROMPT_TEMPLATE.replace("{content}", content);

        eprintln!("[Prompt] Content length: {} chars", content.len());
        eprintln!("[Prompt] Using few-shot coaching prompt (v7.4)");

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
