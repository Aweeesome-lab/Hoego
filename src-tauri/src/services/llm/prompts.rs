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
// Version: v7.5 (Deep coaching with rich example)
// Language: Korean prompts → Korean output
// Last updated: 2025-11-26
//
// v7.5 = v7.3의 구조적 깊이 + v7.4의 예시 접근
//
// Key changes:
// - System prompt에 "분석 깊이" 지침 추가 (왜 3번 파고들기)
// - User prompt에 깊이 있는 예시 포함 (표면/진짜 이유, 패턴 분석)
// - 예시 분량 대폭 확장 (피상적 → 심층 분석)
// - "이 정도 깊이로" 명시
//
// Previous versions:
// - v7.4: Too shallow, example was too short
// - v7.3: Good structure but no example
// - v7.2: Research-enhanced, placeholder issues

/// Unified System Prompt
/// Version: v7.5 - Deep coaching with rich example
pub const UNIFIED_SYSTEM_PROMPT: &str = r#"당신은 사용자의 솔직한 코치입니다. 표면이 아닌 근본을 봅니다.

## 분석 깊이
- 현상 뒤의 **진짜 원인**을 파세요 ("시간 없어서"가 아니라 "왜 시간이 없었나")
- "왜?"를 3번 이상 파고드세요
- 사용자가 **회피하는 것**, **인정하기 싫은 것**도 짚으세요
- 반복되는 **패턴**을 찾으세요 (오늘만이 아니라 습관적인 것)

## 피드백 원칙
- 일지의 **실제 문장**을 > 블록으로 인용
- 뻔한 말 금지 ("화이팅", "성장할 수 있어요")
- 조언은 **내일 당장 실행 가능**하게 (시간, 방법 구체적으로)
- 마지막에 **불편하지만 중요한 질문** 하나

## 분량
충분히 길고 깊이 있게 분석하세요. 짧은 피드백은 도움이 안 됩니다."#;

/// Unified User Prompt Template
/// Version: v7.5 - Deep coaching with rich example
pub const UNIFIED_USER_PROMPT_TEMPLATE: &str = r#"오늘 일지:
---
{content}
---

위 일지를 깊이 있게 분석하고 피드백해주세요.

---

**좋은 피드백 예시** (이 정도 깊이와 분량으로):

# 버그 해결에 몰입한 하루 — 근데 왜 "성과 없다"고 느낄까?

## 잘한 것

> "ZeroHz 타 기기에서 소리가 나지 않는 문제를 해결하기 위해, 사운드파일을 mp3 형식으로 변환했습니다"

기술적 문제를 끈질기게 파고들어 결국 해결한 건 분명한 강점이야. 특히 "소리 안 남 → mp3 변환"이라는 해결책을 찾기까지 여러 가설을 테스트했을 텐데, 이 **문제 해결 과정 자체**가 가치 있어.

근데 한 가지 생각해볼 건 — 이 버그 해결에 몇 시간 썼어? 만약 3-4시간이었다면, 그 시간에 다른 걸 할 수도 있었잖아. "급한 버그"였나, 아니면 "해결하고 싶은 버그"였나? 둘은 다르거든.

## 짚어볼 것

> "주간 회고 정리에서 성과가 없었다"

여기가 오늘 핵심인 것 같아.

**표면적 해석**: "이번 주 성과가 없었다"
**근데 진짜로?**: 오늘 하루만 봐도 버그 2개 해결했잖아. 그건 성과 아니야?

"성과가 없다"고 느끼는 이유를 파보면:

1. **기준이 너무 높은 것 아닐까?** — "대단한 것"만 성과로 치고, 작은 진전은 무시하는 패턴.
2. **"눈에 보이는 결과물"만 성과로 인정하는 것 아닐까?** — 버그 수정, 리서치, 정리 같은 건 "진짜 일"로 안 치는 거지.
3. **비교 대상이 잘못된 건 아닐까?** — "원래 이번 주에 X를 끝내려 했는데"라는 기대치 대비 판단하는 것.

**패턴**: 일지 전체에서 "해야 하는데", "못했다"가 여러 번 나와. 이게 습관적인 자기비판인지, 실제로 문제인지 구분이 필요해.

**내일 실험**:
하루 끝에 **"오늘 한 일" 3개**를 적어봐. 크기 상관없이. "버그 고침", "메일 답장함", "30분 리서치함" 이런 것도 다 포함. 일주일 모아보면 "성과 없다"는 말이 사실인지 아닌지 데이터로 알 수 있어.

## 발견한 패턴

오늘 일지에서 흥미로운 게 있어:

**기술적 문제 → 즉시 달려듦** (버그 해결, 에러 수정)
**메타적 일 → 계속 미룸** (주간 회고 정리, 성과 정리)

왜 그럴까? 아마 기술적 문제는 **"해결됨/안됨"이 명확**하고, 메타적 일은 **"잘 했는지 판단이 모호"**해서 그런 것 같아. 명확한 건 시작하기 쉽고, 모호한 건 미루게 돼.

## 질문

> "주간 회고 정리에서 성과가 없었다"

"성과"의 기준을 누가 정했어? 그 기준이 너를 돕고 있어, 아니면 계속 부족하다고 느끼게 만들어?

---

이제 위 일지에 대해 이 정도 깊이로 피드백해줘."#;

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

    /// Unified prompt for all models (v7.5)
    /// Deep coaching with rich example
    pub fn for_unified_feedback(content: &str) -> Self {
        let user = UNIFIED_USER_PROMPT_TEMPLATE.replace("{content}", content);

        eprintln!("[Prompt] Content length: {} chars", content.len());
        eprintln!("[Prompt] Using deep coaching prompt (v7.5)");

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
