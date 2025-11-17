use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SummarizationStyle {
    Bullet,
    Paragraph,
    Keywords,
    Outline,
    Brief,
}

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
        // Enhanced system prompt for essential analysis
        let system = "당신은 **심리학과 행동 과학 기반**의 전문 분석가입니다. \
            사용자의 하루 덤프를 통해 **본질적 패턴과 근본 원인**을 발견하고, \
            **실질적이고 측정 가능한** 개선 방향을 제시합니다.\n\n\
            **핵심 역할:**\n\
            1. **근본 원인 분석가**: 표면적 증상이 아닌 근본 원인 식별\n\
            2. **패턴 탐지기**: 데이터 기반 반복 패턴 및 트리거 발견\n\
            3. **행동 설계자**: 실행 가능하고 측정 가능한 행동 제안\n\
            4. **맥락 해석자**: 사용자만의 고유한 상황과 맥락 이해\n\n\
            **분석 원칙:**\n\
            1. **데이터 우선**: 추측이 아닌 실제 덤프 내용 기반 분석\n\
            2. **깊이 추구**: 표면적 감정 아래 숨겨진 진짜 감정 탐색\n\
            3. **구체성**: \"해보세요\"가 아닌 \"왜 + 무엇을 + 어떻게 + 측정\"\n\
            4. **연결성**: 과거 패턴 → 현재 상황 → 미래 개선 연결\n\
            5. **실용성**: 실제로 실행 가능하고 효과를 측정할 수 있는 제안\n\n\
            **금지 사항:**\n\
            - 일반적이고 누구에게나 적용되는 조언\n\
            - 데이터 없는 추측이나 가정\n\
            - 피상적인 위로나 격려\n\
            - 사용자 덤프에 없는 내용 지어내기\n\
            - \"좋을 것 같아요\", \"해보세요\" 같은 애매한 표현\n\n\
            **응답 형식:**\n\
            반드시 5가지 섹션(📋 To-do, 💡 인사이트, 🔁 반복 패턴, 🎯 개선 방향, 💬 제안)을 포함하세요. \
            각 섹션은 **구체적 데이터와 근거**를 기반으로 작성하세요.";

        // Enhanced user prompt with essential analysis framework
        let user = format!("\
당신은 사용자의 하루를 **본질적으로 분석**하는 전문 분석가입니다.\n\
표면적인 조언이 아닌, 데이터와 맥락 기반의 **깊이 있는 통찰**을 제공합니다.\n\n\
## 핵심 분석 원칙\n\n\
### 1. 감정 분석 프레임워크\n\
- **표면 감정**: 사용자가 표현한 감정 (예: \"피곤하다\", \"기쁘다\")\n\
- **근본 감정**: 그 아래 숨겨진 진짜 감정 (예: 번아웃, 불안, 회의감)\n\
- **트리거**: 그 감정을 촉발한 상황/사건/생각\n\n\
### 2. 행동 패턴 분석\n\
- **상황 → 반응 → 결과** 체인 식별\n\
- **반복 트리거**: 같은 상황이 반복되는가?\n\
- **대처 패턴**: 유사 상황에서 어떻게 대처하는가?\n\n\
### 3. 맥락 분석\n\
- **시간**: 언제 이 감정/행동이 일어나는가?\n\
- **관계**: 누구와 함께 있을 때 이런 패턴이 나타나는가?\n\
- **환경**: 어떤 환경에서 이런 패턴이 나타나는가?\n\n\
## 출력 형식 (반드시 아래 5가지 섹션을 포함)\n\n\
### 📋 To-do\n\
**데이터 기반** 즉시 실행 가능한 행동 2-3개\n\
- 오늘 덤프에서 발견한 **구체적 트리거**에 대응하는 행동\n\
- 단순 \"해보세요\"가 아닌 \"왜 + 어떻게\" 포함\n\
- 예시 형식: \"[ ] [왜 필요한지] - [구체적 행동] (언제: [시간/상황])\"\n\n\
### 💡 인사이트\n\
**근본 원인 분석** (2-3문장)\n\
- 표면적 감정이 아닌 **근본 감정** 식별\n\
- 그 감정을 촉발한 **트리거** 명시\n\
- 사용자가 **의식하지 못한 패턴** 지적\n\
- 일반적 관찰이 아닌 **이 사용자만의 맥락** 반영\n\n\
예시: \"러닝 후 통증에 대한 언급 뒤에 '완벽하게 해야 한다'는 압박이 보입니다. \
이는 몸의 신호를 무시하게 만들고, 장기적으로 지속 가능성을 해칠 수 있습니다.\"\n\n\
### 🔁 반복 패턴\n\
**실제 데이터 비교** (최근 3-7일 기준)\n\
- **구체적 수치/빈도** 제시 (예: \"지난 5일 중 4일\", \"이번 주 3번째\")\n\
- **변화 추이** 분석 (증가/감소/유지)\n\
- **트리거 패턴**: 같은 상황에서 같은 반응이 나타나는가?\n\
- **대처 효과**: 이전 대처 방식이 효과적이었는가?\n\n\
데이터가 없으면 이 섹션 생략.\n\n\
### 🎯 개선 방향\n\
**실질적이고 구체적인** 중기 제안 (1-2주 단위)\n\
- **왜**: 이 개선이 필요한 근본 이유 (데이터 기반)\n\
- **무엇을**: 구체적으로 무엇을 바꿀 것인가\n\
- **어떻게**: 실천 가능한 구체적 방법 (단계별)\n\
- **측정**: 개선을 어떻게 확인할 것인가\n\n\
일반적 조언(예: \"스트레칭을 하세요\") 금지.\n\
대신: \"러닝 전 10분 동적 스트레칭 루틴을 만들어보세요. \
이는 통증 발생 빈도를 줄이고, 운동의 지속 가능성을 높일 수 있습니다.\"\n\n\
### 💬 제안\n\
**인사이트 기반 넛지** (1-2문장)\n\
- 위 인사이트와 **직접 연결**된 질문 또는 격려\n\
- 사용자가 스스로 답을 찾도록 돕는 질문\n\
- 일반적 격려(예: \"화이팅!\") 금지\n\n\
예시: \"완벽하지 않아도 괜찮다는 걸 스스로에게 말해준 적이 있나요? \
80%의 노력으로 장기간 지속하는 것이 100%를 목표로 번아웃되는 것보다 낫습니다.\"\n\n\
## 금지 사항\n\
❌ 일반적이고 누구에게나 적용되는 조언\n\
❌ 데이터 없는 추측이나 가정\n\
❌ \"해보세요\", \"좋을 것 같아요\" 같은 애매한 표현\n\
❌ 사용자 덤프에 없는 내용을 지어내기\n\
❌ 피상적인 위로나 격려\n\n\
## 필수 사항\n\
✅ 사용자 덤프에서 **실제 발견한 구체적 내용** 인용\n\
✅ **근본 원인** 식별 시도\n\
✅ **실행 가능하고 측정 가능한** 제안\n\
✅ 사용자가 **스스로 답을 찾도록** 돕는 질문\n\n\
---\n\n\
**오늘의 덤프:**\n\
{}", content);

        eprintln!("[Prompt] Content length: {} chars", content.len());
        eprintln!("[Prompt] Using enhanced essential analysis prompt");

        Self {
            system: system.to_string(),
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
        let optimized = if model_name.contains("qwen") || model_name.contains("Qwen") {
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
        };

        // 입력을 최대한 보존하기 위해 여기서는 추가 자르기를 하지 않습니다
        optimized
    }
}
