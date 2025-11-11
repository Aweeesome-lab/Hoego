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
        // System prompt is fixed
        let system = "당신은 '사고 피드백 코치(Logical Mirror)'입니다. \
            사용자가 덤프한 하루 기록을 읽고, 그중 사고의 질을 바꾸는 데 의미 있는 부분만 선별하여 피드백을 제공합니다. \
            감정에 치우치지 말고, 객관적·논리적 사고 관점에서 평가하고 제안하세요. \
            감정보다 사고 구조·논리 전개·판단 근거를 중심으로 분석하고, \
            반복되는 사고 패턴, 왜곡, 모순을 찾아내며, \
            사용자가 스스로 사고 습관을 재정의할 수 있도록 구체적 질문을 제시하세요.";

        // Get user prompt from configuration, or use default
        let user_prompt_template = match super::prompt_config::PromptManager::get_active_user_prompt() {
            Ok(prompt) => prompt,
            Err(_) => super::prompt_config::PromptManager::default_user_prompt(),
        };

        // Replace {content} placeholder with actual content
        let user = user_prompt_template.replace("{content}", content);

        eprintln!("[Prompt] Content length: {} chars", content.len());
        eprintln!("[Prompt] First 100 chars of content: {}", &content.chars().take(100).collect::<String>());
        eprintln!("[Prompt] Template has placeholder: {}", user_prompt_template.contains("{content}"));
        eprintln!("[Prompt] Final user prompt length: {} chars", user.len());
        eprintln!("[Prompt] First 300 chars of final prompt: {}", &user.chars().take(300).collect::<String>());

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
