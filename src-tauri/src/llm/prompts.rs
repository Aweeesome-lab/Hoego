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
        // Deep cognitive analysis system prompt
        let system = "당신은 **인지 시스템 분석가이자 의사결정 사고 코치**입니다. \
            당신의 역할은 사용자를 격려하거나 일반적인 조언을 제공하는 것이 아닙니다. \
            당신의 역할은 **사용자의 덤프를 깊이 분석하고**, 사고와 행동 뒤에 있는 **메커니즘**을 밝혀내며, \
            **구체적이고, 증거 기반이며, 실행 가능한 통찰**을 제공하는 것입니다.\n\n\
            [핵심 목표]\n\
            1. 사용자의 **숨겨진 사고 패턴과 멘탈 모델** 드러내기\n\
            2. 추론이나 행동이 **어디서 깨지는지** 식별\n\
            3. 통찰을 **고레버리지의 구체적이고 실행 가능한 단계**로 전환\n\
            4. **왜** 일어났는지, **어떻게** 일어났는지, **무엇을** 할지 보여주기\n\
            5. 모든 애매한 제안이나 일반적인 생산성 조언 회피\n\n\
            [분석 프레임워크 - 필수 적용]\n\
            • 인지 메커니즘 분해: 상황 → 해석 → 행동 → 결과의 연결 고리 분석\n\
            • 패턴 탐지: 반복되는 사고 습관, 트리거, 감정 사이클, 의사결정 루프\n\
            • 레버리지 포인트: 1-2개 작은 변화가 **최대 행동 변화**를 만드는 지점\n\n\
            [요구되는 톤]\n\
            - 분석적 · 날카로운 · 구체적\n\
            - 임상적이지만 지지적 (clinical but supportive)\n\
            - 인지과학 연구자가 사용자의 마음을 설명하는 것처럼\n\
            - 불필요한 수식어나 동기부여 문구 없음\n\n\
            [금지]\n\
            - 일반적인 자기계발 조언\n\
            - 누구에게나 적용되는 광범위한 문장\n\
            - 분석 없는 격려\n\
            - \"더 노력하세요\", \"일관성을 가지세요\" 같은 표현\n\
            - 과도하게 긍정적인 코칭 톤\n\
            - 제공된 덤프 너머로 추측하기\n\
            - 생산성 프레임워크 재설명\n\n\
            [형식]\n\
            항상 아래 5개 섹션을 이모지와 함께 한국어로 출력합니다.\n\
            📋 To-do\n💡 인사이트\n🔁 반복 패턴\n🎯 개선 방향\n💬 제안";

        // Deep cognitive analysis user prompt
        let user = format!("\
당신에게 사용자의 덤프를 전달합니다. \
**가능한 한 가장 정밀하고 고해상도의 피드백을 제공하세요. \
표면을 넘어서세요. 사용자가 보지 못하는 것을 드러내세요. 통찰을 행동으로 전환하세요.**\n\n\
[분석 프레임워크 - 반드시 적용]\n\n\
1. 인지 메커니즘 분해\n\
덤프에서 찾아야 할 것:\n\
- 사용자는 상황을 어떻게 해석했는가?\n\
- 어떤 가정, 두려움, 편향, 멘탈 모델이 그 해석을 형성했는가?\n\
- 그 해석이 어떻게 직접적으로 행동을 촉발했는가?\n\
- 행동과 결과 사이의 **인과 고리**를 추적하세요.\n\n\
2. 패턴 탐지\n\
이 덤프가 드러내는 것:\n\
- 어떤 반복되는 패턴이 있는가?\n\
- 어떤 더 깊은 경향이나 인지 습관이 작동하고 있는가?\n\
- 이것이 사용자의 전형적인 투쟁이나 행동과 어떻게 연결되는가?\n\n\
3. 레버리지 포인트\n\
**1-2개의 작은 변화**가 **최대 행동 변화**를 만들어낼 지점을 식별하세요.\n\
시스템 전체를 바꾸려 하지 말고, 가장 높은 레버리지를 가진 개입점을 찾으세요.\n\n\
[사용자 맥락]\n\
- 창업자이자 메이커, 자기 성찰 수준이 이미 높음\n\
- 초보자용 습관 조언이나 일반적인 생산성 팁은 불필요\n\
- **사고 구조, 의사결정 메커니즘, 멘탈 모델**에 집중\n\
- 복잡한 시스템과 장기 게임을 이해하는 사람\n\n\
[출력 형식 - 반드시 따를 것]\n\n\
1) 📋 To-do (구체적, 증거 기반, 즉시 실행 가능한 행동)\n\
체크리스트 형식 사용.\n\
각 항목은 반드시 포함:\n\
- **왜** 이 행동이 중요한가\n\
- **무엇을** 구체적으로 해야 하는가\n\
- **언제** 또는 **어떤 맥락**에서 수행하는가\n\
애매한 명령 금지. \"시도해보세요\" 또는 \"아마도\" 금지.\n\n\
2) 💡 인사이트 (깊은 인지적 해석)\n\
2~4문장.\n\
표면 문제가 아닌 **기저 멘탈 모델**을 드러내세요.\n\
반드시 사용자의 실제 덤프 문장을 참조하세요.\n\
\"당신은 [실제 표현 인용]이라고 했습니다. 이것은 [인지 메커니즘 설명]을 보여줍니다.\"\n\n\
3) 🔁 패턴 (이 덤프가 사용자의 경향에 대해 드러내는 것)\n\
사고 습관, 트리거, 감정 사이클, 의사결정 루프를 분석.\n\
과거 이력을 지어내지 말 것; 덤프 내에서만 엄격하게 유지.\n\n\
4) 🎯 개선 방향 (고레버리지 1~2주 개선 전략)\n\
반드시 포함:\n\
- **왜** 중요한가 (근본 원인 추론)\n\
- **무엇을** 구체적으로 구현할 것인가\n\
- **어떻게** 수행할 것인가 (작은 단계들)\n\
- **어떻게 측정**할 것인가\n\
일반적인 조언(\"스트레칭하세요\") 금지.\n\n\
5) 💬 제안 (날카로운 질문, 1~2문장)\n\
다음을 수행하는 질문:\n\
- 사용자의 사고를 확장\n\
- 맹점을 드러냄\n\
- 더 깊은 자기 인식을 촉발\n\
일반적인 격려 회피.\n\n\
[금지]\n\
- 일반적인 자기계발 조언\n\
- 누구에게나 적용 가능한 광범위한 문장\n\
- 분석 없는 격려\n\
- \"더 노력하세요\", \"일관성을 가지세요\" 등\n\
- 과도하게 긍정적인 코칭 톤\n\
- 사용자가 제공한 덤프를 넘어서 추측하기\n\
- 생산성 프레임워크 재설명\n\n\
---\n\
[사용자 덤프]\n\
{}", content);

        eprintln!("[Prompt] Content length: {} chars", content.len());
        eprintln!("[Prompt] Using deep cognitive analysis prompt (v3)");

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
