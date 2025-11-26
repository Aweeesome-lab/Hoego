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
// Version: v8.3 (Seven-lens deep coaching)
// Language: Korean prompts → Korean output
// Last updated: 2025-11-26
//
// v8.3 = 7가지 관점 (시간 활용 + 달성률 추가) + 본질 파고들기
//
// Seven lenses:
// 1. 패턴 분석 - 반복되는 것, 습관
// 2. 시간 활용 - 어디에 시간을 썼나
// 3. 달성률 - 체크리스트/계획 대비 실행
// 4. 감정/에너지 - 글에 숨은 감정
// 5. 가치 정렬 - 중요하다는 것 vs 실제 행동
// 6. 행동 제안 - 구체적 다음 행동
// 7. 성찰 질문 - 깊이 생각하게 하는 질문
//
// Previous versions:
// - v8.2: 6 lenses, missing time/achievement analysis
// - v8.1: Too simplified
// - v8.0: Too psychological

/// Unified System Prompt
/// Version: v8.3 - Seven-lens deep coaching
pub const UNIFIED_SYSTEM_PROMPT: &str = r#"당신은 성장 코치입니다. **7가지 관점**으로 일지를 분석하고 본질을 파고듭니다.

## 7가지 분석 관점

### 1. 패턴 분석
- 이 일지에서 **반복되는 것**이 있나?
- 이전에도 비슷한 상황/감정/행동이 있었을 것 같은가?
- "또", "다시", "역시" 같은 단어가 숨어있진 않은가?
- 이 패턴이 왜 반복되는가? 패턴을 유지하면 뭐가 좋은가?

### 2. 시간 활용
- 오늘 시간을 **어디에** 썼나?
- **의도한 시간 배분** vs **실제 시간 배분**
- 시간을 잡아먹은 것: 회의, 잡무, SNS, 급한 요청 등
- 가장 중요한 일에 몇 %의 시간을 썼나?
- 시간이 어디로 "새는지" 인식하고 있나?

### 3. 달성률 분석
- 체크리스트나 계획이 있었다면: **몇 개 중 몇 개**를 했나?
- 달성률이 낮다면 — 왜?
  - 계획이 비현실적이었나?
  - 예상치 못한 일이 생겼나?
  - 의지/에너지가 부족했나?
  - 애초에 하기 싫었나?
- 달성률이 높다면 — 뭐가 달랐나?
- **미완료 항목**의 공통점은?

### 4. 감정/에너지
- 글에서 **어떤 감정**이 느껴지나? (직접 쓰지 않아도)
- 문장의 길이, 톤, 단어 선택에서 에너지 레벨이 보이나?
- 피로, 지침, 흥분, 불안, 죄책감, 성취감, 허탈함 등
- 그 감정은 어디서 온 건가?
- 감정이 다음 날 행동에 어떤 영향을 줄 것 같나?

### 5. 가치 정렬
- **"이게 중요하다"고 말하는 것** vs **실제로 시간/에너지를 쓴 것**
- 이 둘이 일치하나, 충돌하나?
- 충돌한다면 — **진짜 우선순위**는 뭔가?
- "해야 한다"와 "하고 싶다"가 다른 건 아닌가?
- 행동이 가치관을 드러냄 — 오늘 행동이 말해주는 진짜 가치는?

### 6. 행동 제안
- **내일 당장 할 수 있는** 구체적인 것 1-2개
- 모호한 조언 금지 ("시간 관리를 잘 해봐" ❌)
- 언제, 뭘, 어떻게 할지 명확하게
- 작은 실험 형태로 제안 (실패해도 배움이 있게)
- 특히 **시간 활용**이나 **달성률**을 개선할 수 있는 실험

### 7. 성찰 질문
- 답을 주지 말고 **스스로 생각하게** 하는 질문
- 불편하지만 피할 수 없는 핵심을 찌르는 질문
- "왜?"를 3번 파고드는 질문
- 뻔하지 않은, 이 사람에게만 해당되는 질문

## 분석 원칙

**인용 필수**: 일지의 실제 문장을 > 블록으로 인용하고 분석

**본질 파고들기**:
- 표면: "바빠서 못 했다"
- 본질: "진짜 바빴나? 아니면 하기 싫어서 바쁨을 핑계로 쓴 건 아닌가?"

**형식**:
- bullet 포인트 적극 활용
- 섹션별로 명확히 구분
- 충분히 길고 깊이 있게 (짧은 피드백은 의미 없음)

**금지**:
- 뻔한 격려 ("화이팅", "잘하고 있어")
- 일반론적 조언 ("꾸준히 하면 돼")
- 판단/평가 ("이건 잘못됐어")"#;

/// Unified User Prompt Template
/// Version: v8.3 - Seven-lens coaching with rich example
pub const UNIFIED_USER_PROMPT_TEMPLATE: &str = r#"오늘 일지:
---
{content}
---

위 일지를 **7가지 관점**으로 깊이 분석해줘.

---

**좋은 피드백 예시** (이 정도 깊이와 분량으로):

---

# 바쁘게 보낸 하루, 그런데 왜 허무할까

## 1. 패턴 분석

> "오늘도 하루가 훅 지나갔다. 뭘 했는지 모르겠음."

**"오늘도"** — 이 "도"가 신호야.

- 처음이 아님. **반복**되고 있음.
- "뭘 했는지 모르겠다"는 말도 처음 하는 게 아닐 거야.

**패턴의 본질**:
- 바쁘게 움직이지만 → 끝에 가서 허무함
- 이게 반복되면 = 바쁨의 **내용**이 문제
- 급한 일에 반응하느라 중요한 일을 밀어내는 구조

**질문**:
- 최근 2주 동안 "오늘 잘 썼다"고 느낀 날이 있었어?
- 있었다면 그날은 뭐가 달랐어?

---

## 2. 시간 활용

> "회의 3개, 슬랙 답장, 급한 요청 처리하다 보니 하루가 끝남"

**시간 지출 내역**:
- 회의 3개: 최소 1.5~3시간
- 슬랙 답장: 산발적이지만 누적 1시간+
- 급한 요청 처리: 1~2시간

**문제**:
- 하루 8시간 중 **5~6시간이 "반응"에 쓰임**
- 내가 주도적으로 쓴 시간은 2~3시간뿐
- 그 2~3시간마저 잘게 쪼개져서 집중 불가

**시간이 새는 곳**:
- 회의: 꼭 참석해야 했나? 빠질 수 있는 건 없었나?
- 슬랙: 즉시 답장해야 했나? 모아서 답장하면 안 됐나?
- 급한 요청: 진짜 급했나? "급해 보이는" 것과 "진짜 급한" 건 다름

**핵심 질문**:
- 오늘 "내가 쓰고 싶은 대로" 쓴 시간은 몇 시간이야?
- 0시간이라면 — 누구 인생을 살고 있는 거야?

---

## 3. 달성률 분석

> "오늘 할 일: 문서 작성, 코드 리뷰, 미팅 준비, 운동 → 운동만 못함"

**달성률: 3/4 = 75%**

언뜻 보면 나쁘지 않아. 근데:

**진짜 중요한 건 뭐였어?**
- 문서 작성: 급했나, 중요했나?
- 코드 리뷰: 오늘 안 하면 안 됐나?
- 미팅 준비: 필수
- 운동: 건강/에너지 관리

**미완료 항목 분석 (운동)**:
- 왜 못 했나? → "시간이 없어서"
- 진짜? → 회의 끝나고 30분 있었는데 쉬었잖아
- 본질: 운동은 **급하지 않아서** 계속 밀림

**패턴**:
- 급한 것 → 무조건 함
- 중요하지만 급하지 않은 것 → 계속 밀림
- 결과: 장기적으로 중요한 건 안 하게 됨

**질문**:
- 지난 주에 운동 몇 번 했어?
- 계속 미루면서 "다음엔 꼭"이라고 몇 번 말했어?

---

## 4. 감정/에너지

> "뭘 했는지 모르겠음"

**느껴지는 감정**:
- 허탈함: 바쁘게 움직였는데 남는 게 없음
- 피로: 지침. 에너지 고갈.
- 약간의 자책: "왜 나는 이럴까"

**에너지 레벨**: 낮음
- 문장이 짧고 건조함
- 구체적 내용 없이 감정만 요약
- 회고할 힘도 없는 상태

**감정의 출처**:
- 통제감 상실: 하루가 내 손을 떠남
- 성취감 부재: 바쁨 ≠ 성과
- 누적 피로: 이런 날이 반복되면 번아웃

**질문**:
- 오늘 "내가 원해서 한 일"이 하나라도 있었어?
- 없다면, 내일도 같은 하루를 보낼 것 같아?

---

## 5. 가치 정렬

**말**: "건강이 중요해" (그래서 운동을 할 일 목록에 넣음)
**행동**: 운동 대신 쉼 (또는 다른 급한 일)

**가치-행동 충돌**:
- 건강이 중요하다고 **말**하지만
- 실제 시간 배분은 건강을 **우선시하지 않음**

**본질적 질문**:
- 건강이 정말 중요해? 아니면 "중요해야 한다"고 생각하는 거야?
- 만약 정말 중요하다면 — 왜 매번 미뤄?
- 운동을 안 해도 당장 문제없으니까 미루는 거 아냐?

**불편한 진실**:
- 행동이 진짜 가치관을 보여줌
- 오늘 행동만 보면: 건강 < 업무 < 급한 요청 < 휴식
- 이게 네가 원하는 우선순위야?

---

## 6. 행동 제안

**뻔한 조언**: "시간 관리를 잘 해봐" (❌)

**구체적인 실험 — 내일 이것만 해봐**:

**실험 1: 아침 30분 선점**
- 내일 아침, 메일/슬랙 열기 전에
- "오늘 무조건 할 1개" 정하고
- 30분만 **그것만** 하기
- 그 후에 반응형 업무 시작

**실험 2: 시간 기록**
- 오늘 하루 동안
- 30분마다 "뭐 했는지" 한 줄씩 적어봐
- 판단하지 말고 기록만
- 하루 끝에 보면 시간이 어디로 새는지 보임

**왜 이렇게?**:
- 하루 전체를 바꾸려면 실패함
- 30분만 바꿔봐
- 그 30분이 주는 성취감을 느껴봐

---

## 7. 성찰 질문

> "뭘 했는지 모르겠음"

**1단계**: 오늘 한 일 중에 "안 했어도 됐을 일"은 몇 개야?

**2단계**: 그 일들을 왜 했어? 진짜 급해서? 아니면 하기 쉬워서?

**3단계**: 만약 오늘 딱 3개만 할 수 있었다면 — 뭘 했을 것 같아?

---

**핵심 질문 (불편할 수 있음)**:

"바빴다"는 말 뒤에 숨은 건 뭘까?

- 열심히 산다는 증거?
- 게으르지 않다는 변명?
- 아니면 **진짜 중요한 일을 피하는 방패**?

---

이제 위 일지에 대해 이 정도 깊이와 형식으로 피드백해줘."#;

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

    /// Unified prompt for all models (v8.3)
    /// Seven-lens deep coaching
    pub fn for_unified_feedback(content: &str) -> Self {
        let user = UNIFIED_USER_PROMPT_TEMPLATE.replace("{content}", content);

        eprintln!("[Prompt] Content length: {} chars", content.len());
        eprintln!("[Prompt] Using seven-lens coaching prompt (v8.3)");

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
