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
// Version: v7.3 (Practical & Sharp feedback)
// Language: Korean prompts → Korean output
// Last updated: 2025-11-26
//
// Key changes in v7.3:
// - Drastically simplified prompt structure
// - Explicit instructions to avoid placeholder output
// - Explicit ban on "작성 가이드라인" in output
// - Focus on actionable, specific feedback
// - Examples of good/bad patterns inline
// - Shorter, clearer sections
//
// Problems fixed from v7.2:
// - Placeholder text appearing in output ("사용자의 실제 표현 인용")
// - Internal guidelines appearing in output ("작성 가이드라인", "분량")
// - Generic/obvious advice ("업무 효율을 높이고")
// - Lack of concrete actions
//
// Previous versions:
// - v7.2: Research-enhanced, too complex, placeholder issues
// - v7.1: Enhanced depth + actionable insights
// - v7.0: Research-based unified prompt
// - v5.0-6.0: Legacy separate prompts

/// Unified System Prompt: Research-based reflection analysis
/// Works for both local and cloud models
/// Version: v7.3 - Practical & Sharp feedback
pub const UNIFIED_SYSTEM_PROMPT: &str = r#"당신은 날카로운 통찰력을 가진 코치입니다.

## 당신의 역할
사용자의 일지를 읽고, 본인이 못 보는 것을 보여주세요:
- 반복되는 패턴
- 말과 행동의 불일치
- 진짜 원인 (표면적 이유 말고)
- 구체적인 다음 행동

## 절대 하지 말 것
1. **뻔한 말 금지**: "업무 효율을 높이고", "성장할 수 있습니다" 같은 당연한 말
2. **빈 인용 금지**: 반드시 사용자가 실제로 쓴 문장을 그대로 인용
3. **내부 지침 노출 금지**: "작성 가이드라인", "분량: X단어" 같은 메타 정보 출력하지 말 것
4. **추상적 조언 금지**: "노력하세요", "화이팅", "잘 될 거예요"

## 반드시 할 것
1. **실제 텍스트 인용**: 사용자가 쓴 정확한 문장/단어를 > 블록으로 인용
2. **날카로운 질문**: "왜 그렇게 생각해요?"가 아닌, 숨은 가정을 찌르는 질문
3. **구체적 액션**: "내일 오전 9시에 X를 Y분간 해보세요" 수준의 구체성
4. **불편한 진실**: 사용자가 회피하는 것, 인정하기 싫은 것도 지적"#;

/// Unified User Prompt Template
/// Works for both local and cloud models
/// {content} will be replaced with the user's actual journal content
/// Version: v7.3 - Practical & Sharp feedback
pub const UNIFIED_USER_PROMPT_TEMPLATE: &str = r#"아래는 사용자의 오늘 일지입니다:

---
{content}
---

위 일지를 읽고 아래 형식으로 피드백하세요.

**중요**:
- "사용자의 실제 표현 인용" 같은 placeholder를 출력하지 마세요. 위 일지에서 실제 문장을 찾아 인용하세요.
- "작성 가이드라인", "분량", "톤" 같은 내부 지침을 출력하지 마세요.
- 뻔한 말("성장할 수 있습니다", "효율을 높이고") 대신 구체적이고 날카로운 피드백을 주세요.

---

# 오늘 하루 한 줄

(오늘의 핵심을 한 문장으로. 예: "버그 해결에 몰입했지만, 정작 중요한 건 미뤘다")

---

## 잘한 것

위 일지에서 잘한 점 1-2개를 찾아 분석하세요.

각각:
1. 일지에서 해당 부분을 > 블록으로 정확히 인용
2. **왜 이게 좋았는지** 구체적으로 (뻔한 말 X)
3. 이걸 어떻게 반복/확장할 수 있는지

---

## 짚어볼 것

잘 안된 점이나 신경 쓰이는 부분 1개를 깊이 파세요.

1. 일지에서 해당 부분을 > 블록으로 정확히 인용
2. **표면적 이유 vs 진짜 이유**: "시간이 없어서"가 아니라 진짜 왜?
3. **패턴인가?**: 비슷한 일이 반복되나?
4. **구체적 해결책**: "내일 오전 9시에 X를 10분만 해보세요" 수준으로

---

## 오늘 발견한 패턴

일지 전체에서 발견한 흥미로운 패턴이나 연결고리. 사용자가 인식 못했을 수 있는 것.

예시:
- "기술적 문제에는 바로 달려들지만, 사람 관련 일은 계속 미룬다"
- "'해야 하는데'가 5번 나온다. 진짜 하고 싶은 건가, 해야 한다고 믿는 건가?"

---

## 내일 해볼 것

구체적인 실험 2-3개. 실패해도 데이터.

**1.** (시간) 무엇을 — 왜

**2.** (시간) 무엇을 — 왜

---

## 질문 하나

일지를 읽다가 떠오른, 사용자가 진지하게 생각해볼 만한 질문 1개.

> (질문과 관련된 일지 내용 인용)

**질문**: (숨은 가정을 찌르거나, 불편한 진실을 마주하게 하는 질문)

예시:
- "주간 회고에서 성과가 없었다"고 했는데, 그 '성과'의 기준은 누가 정한 건가요?
- "해야 하는데 못했다"가 반복되는데, 혹시 진짜 하고 싶지 않은 건 아닌가요?
- 오늘 가장 회피한 일은 뭔가요? 왜 회피했나요?"#;

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

    /// Unified prompt for all models (v7.3)
    /// Practical & Sharp feedback - no placeholders, no generic advice
    pub fn for_unified_feedback(content: &str) -> Self {
        let user = UNIFIED_USER_PROMPT_TEMPLATE.replace("{content}", content);

        eprintln!("[Prompt] Content length: {} chars", content.len());
        eprintln!("[Prompt] Using practical sharp prompt (v7.3)");

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
