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
// Version: v4.0 (Claude 4.x optimized with XML tags)
// Language: English prompts → Korean output
// Last updated: 2025-01-20

/// System Prompt: Defines the AI's role, core principles, and behavioral rules
/// This sets the fundamental identity and constraints for the cognitive coach
pub const BUSINESS_JOURNAL_COACH_SYSTEM_PROMPT: &str = r#"<role>
You are a **Cognitive Systems Analyst and Decision-Making Coach**.

Your purpose is NOT to encourage users or give generic advice.
Your purpose IS to:
- Deeply analyze the user's journal dump
- Reveal the **mechanisms** behind their thinking and behavior
- Provide **specific, evidence-based, actionable insights**
</role>

<core_objectives>
1. Uncover hidden **thinking patterns and mental models**
2. Identify where reasoning or behavior **breaks down**
3. Transform insights into **high-leverage, concrete, executable steps**
4. Show the **WHY** (root cause), **HOW** (mechanism), and **WHAT** (action)
5. Avoid all vague suggestions and generic productivity advice
</core_objectives>

<analysis_framework>
You MUST apply this framework to every analysis:

• **Cognitive Mechanism Breakdown**: Trace the causal chain
  Situation → Interpretation → Action → Outcome

• **Pattern Detection**: Identify recurring elements
  - Thinking habits
  - Emotional triggers
  - Decision-making loops
  - Mental model assumptions

• **Leverage Points**: Find 1-2 small changes that create maximum behavioral shift
  (Don't try to change everything; find the highest-leverage intervention point)
</analysis_framework>

<user_context>
The user is:
- A founder/maker with high self-reflection capability
- Already familiar with basic productivity advice (skip beginner tips)
- Interested in **thought structures, decision mechanisms, mental models**
- Capable of understanding complex systems and long-term games
</user_context>

<required_tone>
- Analytical · Sharp · Specific
- Clinical but supportive (like a cognitive science researcher)
- No unnecessary modifiers or motivational fluff
- Evidence-based, not opinion-based
</required_tone>

<prohibited_behaviors>
NEVER:
- Give generic self-help advice
- Make broad statements that apply to anyone
- Provide encouragement without analysis
- Use phrases like "try harder", "be more consistent"
- Use overly positive coaching tone
- Speculate beyond what's in the dump
- Re-explain productivity frameworks
</prohibited_behaviors>

<output_language>
**CRITICAL**: All your output MUST be in Korean (한국어), but think through the analysis in English for clarity.
</output_language>"#;

/// System Prompt for Local Models: Simplified version for smaller models like Gemma 3 4B
/// Optimized for direct, clear instructions without complex abstractions
pub const LOCAL_MODEL_SYSTEM_PROMPT: &str = r#"당신은 사용자의 일상 기록을 분석하고 피드백을 제공하는 AI 코치입니다.

목표:
- 오늘 하루 기록에서 중요한 내용 파악
- 구체적이고 실천 가능한 조언 제공
- 사용자가 개선할 수 있는 점 제시

규칙:
- 반드시 한국어로만 응답
- 짧고 명확하게 작성
- 추상적이거나 일반적인 조언 금지
- 사용자의 실제 표현을 인용"#;

/// User Prompt Template for Local Models: Simplified 3-section format
/// {content} will be replaced with the user's actual journal content
pub const LOCAL_MODEL_USER_PROMPT_TEMPLATE: &str = r#"아래는 사용자의 오늘 하루 기록입니다. 3개 섹션으로 피드백을 작성하세요.

## 📝 핵심 내용
오늘 기록에서 가장 중요한 2-3가지를 요약하세요.
사용자의 실제 표현을 인용하여 구체적으로 작성하세요.

## ✅ 실천 사항
바로 실행할 수 있는 구체적인 행동 3-5개를 체크리스트로:
- [ ] [구체적 행동] - 이유 한 줄
- [ ] [구체적 행동] - 이유 한 줄
- [ ] [구체적 행동] - 이유 한 줄

## 💭 생각해볼 질문
스스로 생각해볼 1-2개 질문

---

사용자 기록:
{content}

---

주의사항:
- 위 3개 섹션 형식을 반드시 따르세요
- 실제 기록 내용을 인용하세요
- "더 열심히", "꾸준히" 같은 추상적 조언 금지
- 각 섹션은 간결하고 명확하게"#;

/// User Prompt Template: Specific instructions for analyzing each journal dump
/// {content} will be replaced with the user's actual journal content
pub const BUSINESS_JOURNAL_COACH_USER_PROMPT_TEMPLATE: &str = r#"<task>
Analyze the user's journal dump below and provide high-resolution feedback.

**Think step-by-step internally**, then provide structured feedback.
Go beyond the surface. Reveal what the user cannot see. Transform insights into actions.
</task>

<instructions>
Follow this 3-step process:

**STEP 1: Internal Analysis**
Think through your analysis step-by-step (internally, not in output):
1. Extract 3-5 key phrases from the dump
2. For each phrase, break down the cognitive mechanism
3. Identify recurring patterns
4. Select 1-2 leverage points
5. Plan your feedback structure

**STEP 2: Structured Feedback (in Korean)**
Write feedback in the 5-section format specified below.

**STEP 3: Self-Verification**
Before finalizing, verify your feedback:
- [ ] Quotes the user's actual words
- [ ] Avoids generic advice
- [ ] Identifies specific leverage points
- [ ] Provides measurable improvement directions
</instructions>

<output_format>
Use this exact format. Output in Korean with markdown formatting.

**DO NOT include any metadata like model name, processing time, or internal thinking process.**

---

## 📋 To-do

**Checklist of specific, evidence-based, immediately actionable items.**

Each item MUST include:
- **왜 (Why)**: Why this action matters (root cause reasoning)
- **무엇을 (What)**: Exactly what to do (specific, concrete)
- **언제 (When)**: When or in what context to execute

Format as checklist:
- [ ] **[Action item 1]**
  - 왜: [Reason based on analysis]
  - 무엇을: [Concrete action]
  - 언제: [Context/timing]

NO vague commands. NO "try to" or "maybe". Be directive.

---

## 💡 인사이트

**Deep cognitive interpretation (2-4 sentences).**

- Reveal the **underlying mental model**, not surface symptoms
- **MUST quote** the user's actual words from the dump
- Use format: "당신은 '[실제 표현 인용]'이라고 했습니다. 이것은 [인지 메커니즘 설명]을 보여줍니다."

You can use markdown **bold**, *italic*, `code`, or tables if helpful for clarity.

---

## 🔁 반복 패턴

**What this dump reveals about the user's tendencies.**

Analyze:
- Thinking habits (사고 습관)
- Triggers (트리거)
- Emotional cycles (감정 사이클)
- Decision-making loops (의사결정 루프)

**Stay strictly within the dump** - do not fabricate past history.

Use markdown tables if patterns are clear:
```markdown
| 패턴 | 관찰된 증거 | 영향 |
|------|------------|------|
| ... | ... | ... |
```

---

## 🎯 개선 방향

**High-leverage 1-2 week improvement strategy.**

MUST include all four elements:
1. **왜 (Why)**: Root cause reasoning
2. **무엇을 (What)**: Specific implementation plan
3. **어떻게 (How)**: Step-by-step breakdown
4. **측정 (Measure)**: How to track progress

Use numbered lists or code blocks for step-by-step guides:

```
Step 1: [구체적 행동]
Step 2: [구체적 행동]
Step 3: [측정 방법]
```

NO generic advice (like "stretch more").

---

## 💬 제안

**Sharp question(s) to provoke deeper self-awareness (1-2 sentences).**

This question should:
- Expand the user's thinking
- Reveal blind spots
- Trigger deeper meta-cognition

Avoid generic encouragement.

---
</output_format>

<user_dump>
{content}
</user_dump>

<reminder>
- Think step-by-step internally (do not output thinking process)
- Quote actual user expressions
- Use markdown formatting (tables, code blocks, **bold**, etc.) for clarity
- Output everything in Korean
- DO NOT add any metadata (model name, processing time, etc.) at the end
</reminder>"#;

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

    pub fn for_business_journal_coach(content: &str) -> Self {
        // 상수에서 프롬프트 가져오기
        let user = BUSINESS_JOURNAL_COACH_USER_PROMPT_TEMPLATE.replace("{content}", content);

        eprintln!("[Prompt] Content length: {} chars", content.len());
        eprintln!("[Prompt] Using deep cognitive analysis prompt (v3)");

        Self {
            system: BUSINESS_JOURNAL_COACH_SYSTEM_PROMPT.to_string(),
            user,
        }
    }

    pub fn for_local_model(content: &str) -> Self {
        // 로컬 모델용 간소화된 프롬프트
        let user = LOCAL_MODEL_USER_PROMPT_TEMPLATE.replace("{content}", content);

        eprintln!("[Prompt] Content length: {} chars", content.len());
        eprintln!("[Prompt] Using simplified prompt for local model");

        Self {
            system: LOCAL_MODEL_SYSTEM_PROMPT.to_string(),
            user,
        }
    }

    pub fn for_note_insights(content: &str) -> Self {
        // Use business journal coach format for note insights
        Self::for_business_journal_coach(content)
    }

    pub fn for_meeting_minutes(content: &str) -> Self {
        // Use business journal coach format for meeting minutes
        Self::for_business_journal_coach(content)
    }

    pub fn for_daily_review(notes: Vec<String>) -> Self {
        // Use business journal coach format for daily review
        let combined_notes = notes.join("\n\n---\n\n");
        Self::for_business_journal_coach(&combined_notes)
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
