use super::{
    prompts::{PromptTemplate, SummarizationStyle},
    LLMManager,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SummaryRequest {
    pub content: String,
    pub style: Option<SummarizationStyle>,
    pub max_length: Option<usize>,
    pub model_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SummaryResult {
    pub summary: String,
    pub style: SummarizationStyle,
    pub model_used: String,
    pub tokens_used: usize,
    pub processing_time_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchSummaryRequest {
    pub notes: Vec<NoteToSummarize>,
    pub style: Option<SummarizationStyle>,
    pub combine: bool, // Whether to create one combined summary
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NoteToSummarize {
    pub id: String,
    pub content: String,
    pub title: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchSummaryResult {
    pub summaries: Vec<NoteSummary>,
    pub combined_summary: Option<String>,
    pub total_tokens: usize,
    pub total_time_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NoteSummary {
    pub note_id: String,
    pub summary: String,
}

// Tauri command handlers
#[tauri::command]
pub async fn summarize_note(
    state: tauri::State<'_, Arc<LLMManager>>,
    request: SummaryRequest,
) -> Result<SummaryResult, String> {
    let start_time = std::time::Instant::now();

    // Get the engine
    let mut engine = state.engine.lock().await;

    // Check if model is loaded
    if !engine.is_running() {
        // Try to load default model
        let model_manager = &state.model_manager;
        let model_path = match model_manager.get_default_model().await {
            Ok(Some(default_model)) => default_model.path,
            Ok(None) => {
                return Err("No model loaded. Please download a model first.".to_string());
            }
            Err(_) => {
                return Err("Failed to get default model.".to_string());
            }
        };

        engine
            .load_model(model_path)
            .map_err(|e| e.to_string())?;

        // Wait a moment for the server to initialize
        drop(engine);
        tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;

        // Wait for server to be ready (max 30 seconds)
        for _ in 0..15 {
            let engine = state.engine.lock().await;
            if engine.wait_for_ready().await.unwrap_or(false) {
                break;
            }
            drop(engine);
            tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;
        }

        engine = state.engine.lock().await;

        // Final check
        if !engine.wait_for_ready().await.unwrap_or(false) {
            return Err("LLM server failed to start. Please try again.".to_string());
        }
    } else {
        // Check if server is ready
        if !engine.wait_for_ready().await.unwrap_or(false) {
            return Err("LLM server is not ready. Please wait a moment and try again.".to_string());
        }
    }

    // Use business journal coach format for daily summaries
    let (prompt, style) = if request.style.is_none() || matches!(request.style, Some(SummarizationStyle::Paragraph)) {
        // Default to business journal coach format for general summaries
        (
            PromptTemplate::for_business_journal_coach(&request.content),
            SummarizationStyle::Paragraph
        )
    } else {
        // Use specific style if requested
        let style = request.style.unwrap();
        (
            PromptTemplate::for_summarization(&style, &request.content, request.max_length),
            style
        )
    };

    // Get model info
    let model_info = engine.get_model_info().ok_or("No model loaded")?;

    // Prefer chat-completions path to let llama.cpp apply the model's chat template
    let chat_messages = prompt.to_chat_format();

    eprintln!("[Summarize] Using chat-completions with {} messages (max_tokens: engine default)", chat_messages.len());

    // 응답 토큰: 엔진 설정 최대치(모델별 상한)로 위임 → 길이 제약 없음
    let summary = engine
        .chat_complete(chat_messages, None, None)
        .await
        .map_err(|e| e.to_string())?;

    let processing_time_ms = start_time.elapsed().as_millis() as u64;

    Ok(SummaryResult {
        summary,
        style,
        model_used: model_info.name,
        tokens_used: 0, // Would need actual token counting
        processing_time_ms,
    })
}

#[tauri::command]
pub async fn batch_summarize(
    state: tauri::State<'_, Arc<LLMManager>>,
    request: BatchSummaryRequest,
) -> Result<BatchSummaryResult, String> {
    let start_time = std::time::Instant::now();
    let mut summaries = Vec::new();
    let mut total_tokens = 0;

    let style = request.style.unwrap_or(SummarizationStyle::Brief);

    // Process each note
    for note in request.notes.iter() {
        let summary_request = SummaryRequest {
            content: note.content.clone(),
            style: Some(style.clone()),
            max_length: Some(100), // Brief for batch processing
            model_id: None,
        };

        match summarize_note(state.clone(), summary_request).await {
            Ok(result) => {
                summaries.push(NoteSummary {
                    note_id: note.id.clone(),
                    summary: result.summary,
                });
                total_tokens += result.tokens_used;
            }
            Err(e) => {
                summaries.push(NoteSummary {
                    note_id: note.id.clone(),
                    summary: format!("[Error: {}]", e),
                });
            }
        }
    }

    // Create combined summary if requested
    let combined_summary = if request.combine && !summaries.is_empty() {
        let combined_content = summaries
            .iter()
            .map(|s| s.summary.clone())
            .collect::<Vec<_>>()
            .join("\n\n");

        let combined_request = SummaryRequest {
            content: combined_content,
            style: Some(SummarizationStyle::Paragraph),
            max_length: Some(200),
            model_id: None,
        };

        summarize_note(state.clone(), combined_request)
            .await
            .ok()
            .map(|r| r.summary)
    } else {
        None
    };

    Ok(BatchSummaryResult {
        summaries,
        combined_summary,
        total_tokens,
        total_time_ms: start_time.elapsed().as_millis() as u64,
    })
}

#[tauri::command]
pub async fn get_note_insights(
    state: tauri::State<'_, Arc<LLMManager>>,
    content: String,
) -> Result<String, String> {
    let mut engine = state.engine.lock().await;

    if !engine.is_running() {
        return Err("No model loaded".to_string());
    }

    // Use business journal coach format (for_note_insights now uses it)
    let prompt = PromptTemplate::for_note_insights(&content);

    let chat_messages = prompt.to_chat_format();

    // brief 응답 목표: 200 토큰
    engine
        .chat_complete(chat_messages, Some(200), None)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_meeting_minutes(
    state: tauri::State<'_, Arc<LLMManager>>,
    content: String,
) -> Result<String, String> {
    let mut engine = state.engine.lock().await;

    if !engine.is_running() {
        return Err("No model loaded".to_string());
    }

    // Use business journal coach format (for_meeting_minutes now uses it)
    let prompt = PromptTemplate::for_meeting_minutes(&content);

    let chat_messages = prompt.to_chat_format();

    // 회의록/인사이트: 512 토큰 제한
    engine
        .chat_complete(chat_messages, Some(512), None)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn daily_review(
    state: tauri::State<'_, Arc<LLMManager>>,
    notes: Vec<String>,
) -> Result<String, String> {
    let mut engine = state.engine.lock().await;

    if !engine.is_running() {
        return Err("No model loaded".to_string());
    }

    // Use business journal coach format (which is already set in for_daily_review)
    let prompt = PromptTemplate::for_daily_review(notes);

    let chat_messages = prompt.to_chat_format();

    // 데일리 리뷰: 600 토큰 제한
    engine
        .chat_complete(chat_messages, Some(600), None)
        .await
        .map_err(|e| e.to_string())
}
