use serde::Serialize;
use std::fs;
use std::path::PathBuf;
use std::sync::Arc;
use tauri::{AppHandle, Manager, State};
use time::format_description::well_known::Rfc3339;
use time::macros::format_description;
use time::OffsetDateTime;

use crate::history::{HistoryState, ensure_daily_file};
use crate::llm;
use crate::utils::*;

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AiSummaryFile {
    pub filename: String,
    pub path: String,
    pub created_at: Option<String>,
    pub content: String,
}

/// AI 요약 디렉토리를 생성합니다
pub fn ensure_summaries_dir(path: &PathBuf) -> Result<(), String> {
    fs::create_dir_all(path)
        .map_err(|error| format!("AI 요약 디렉토리 생성 실패: {error}, 경로: {:?}", path))
}

/// AI 요약 파일을 작성합니다
fn write_ai_summary_file(date: &OffsetDateTime, content: &str) -> Result<AiSummaryFile, String> {
    let dir = summaries_directory_path()?;
    ensure_summaries_dir(&dir)?;

    let date_key = date
        .format(&format_description!(
            "[year][month][day]-[hour][minute][second]"
        ))
        .map_err(|error| error.to_string())?;

    let mut filename = format!("ai-feedback-{date_key}.md");
    let mut path = dir.join(&filename);
    let mut suffix = 1;

    while path.exists() {
        filename = format!("ai-feedback-{date_key}-{suffix}.md");
        path = dir.join(&filename);
        suffix += 1;
    }

    fs::write(&path, content.as_bytes()).map_err(|error| format!("AI 요약 저장 실패: {error}"))?;

    let created_at = date.format(&Rfc3339).ok();

    Ok(AiSummaryFile {
        filename,
        path: path.to_string_lossy().into_owned(),
        created_at,
        content: content.to_string(),
    })
}

// Tauri Commands

#[tauri::command]
pub async fn generate_ai_feedback(
    history: State<'_, HistoryState>,
    llm_state: tauri::State<'_, Arc<llm::LLMManager>>,
) -> Result<AiSummaryFile, String> {
    let now = current_local_time()?;
    let (today_path, _) = ensure_daily_file(history.inner(), &now)?;
    let today_content = fs::read_to_string(&today_path).unwrap_or_default();

    if today_content.trim().is_empty() {
        return Err("오늘 기록된 내용이 없어 요약을 생성할 수 없습니다.".into());
    }

    eprintln!("[AI Feedback] Today's content length: {} chars", today_content.len());
    eprintln!("[AI Feedback] First 200 chars: {}", &today_content.chars().take(200).collect::<String>());

    // 길이 조정: 코치형 피드백(Paragraph)로 500단어 내외 요청 → 충분한 밀도의 결과
    let request = llm::summarize::SummaryRequest {
        content: today_content,
        style: None, // business_journal_coach 사용
        max_length: Some(500),
        model_id: None,
    };

    let summary = match tokio::time::timeout(
        std::time::Duration::from_secs(90),
        llm::summarize::summarize_note(llm_state, request),
    )
    .await
    {
        Ok(result) => result?,
        Err(_) => return Err("요약 생성 시간이 초과되었습니다 (90초)".into()),
    };

    let summary_body = summary.summary.trim();
    let markdown = format!(
        "# 정리하기 ({})\n\n## 오늘 정리\n{}\n\n---\n*모델: {} · 처리시간: {}ms*",
        format_date_label(&now),
        if summary_body.is_empty() {
            "(생성된 요약이 비어 있습니다)".to_string()
        } else {
            summary_body.to_string()
        },
        summary.model_used,
        summary.processing_time_ms
    );

    write_ai_summary_file(&now, &markdown)
}

#[tauri::command]
pub async fn generate_ai_feedback_stream(
    app: AppHandle,
    history: State<'_, HistoryState>,
    llm_state: tauri::State<'_, Arc<llm::LLMManager>>,
    cloud_llm_state: State<'_, llm::CloudLLMState>,
    model_selection_state: State<'_, crate::model_selection::ModelSelectionState>,
) -> Result<(), String> {
    let now = current_local_time()?;
    let (today_path, _) = ensure_daily_file(history.inner(), &now)?;
    let today_content = fs::read_to_string(&today_path).unwrap_or_default();

    if today_content.trim().is_empty() {
        return Err("오늘 기록된 내용이 없어 요약을 생성할 수 없습니다.".into());
    }

    // 프롬프트 구성 (business journal coach)
    let prompt = llm::prompts::PromptTemplate::for_business_journal_coach(&today_content);
    let chat_messages = prompt.to_chat_format();

    // 선택된 모델 확인
    let selected_model_lock = model_selection_state.selected.read().await;
    let selected_model = selected_model_lock.clone();
    drop(selected_model_lock);

    // 모델 타입 결정
    let use_cloud_llm = if let Some(ref model) = selected_model {
        model.model_type == "cloud"
    } else {
        // 선택된 모델이 없으면 로컬 모델 확인
        let engine = llm_state.engine.lock().await;
        !engine.is_running()
    };

    let start_time = std::time::Instant::now();
    let result: Result<String, String>;
    let model_used: String;

    if use_cloud_llm {
        // Cloud LLM 사용
        eprintln!("[AI Feedback] Using Cloud LLM");

        // 선택된 모델 정보 가져오기
        let cloud_model_id = selected_model
            .as_ref()
            .map(|m| m.model_id.clone())
            .unwrap_or_else(|| "gpt-4-turbo".to_string());

        eprintln!("[AI Feedback] Selected cloud model: {}", cloud_model_id);

        // 프롬프트를 Cloud LLM 형식으로 변환
        let messages: Vec<llm::types::Message> = chat_messages
            .iter()
            .map(|msg| llm::types::Message {
                role: match msg.role.as_str() {
                    "system" => llm::types::Role::System,
                    "user" => llm::types::Role::User,
                    "assistant" => llm::types::Role::Assistant,
                    _ => llm::types::Role::User,
                },
                content: msg.content.clone(),
            })
            .collect();

        let request = llm::types::CompletionRequest {
            messages,
            model: cloud_model_id.clone(),
            temperature: Some(0.7),
            max_tokens: Some(1000),
            system_prompt: None,
            metadata: None,
        };

        // CloudLLM provider 가져오기
        let provider_lock = cloud_llm_state.current_provider.read().await;

        if let Some(provider) = provider_lock.as_ref() {
            match provider.complete(request).await {
                Ok(response) => {
                    model_used = response.model.clone();
                    result = Ok(response.content.clone());

                    // 텍스트를 한 번에 emit (스트리밍 아님)
                    let _ = app.emit_all(
                        "ai_feedback_stream_delta",
                        &serde_json::json!({ "text": &response.content }),
                    );
                }
                Err(e) => {
                    model_used = "Cloud LLM (failed)".to_string();
                    result = Err(format!("Cloud LLM 오류: {}", e.to_string()));
                }
            }
        } else {
            model_used = "Cloud LLM (not configured)".to_string();
            result = Err("Cloud LLM이 설정되지 않았습니다. 설정에서 API 키를 등록해주세요.".to_string());
        }
    } else {
        // 로컬 LLM 사용
        let mut engine = llm_state.engine.lock().await;

        model_used = engine
            .get_model_info()
            .map(|m| m.name)
            .unwrap_or_else(|| "unknown".to_string());

        let mut last_emit_ok = true;
        let emit_handle = app.clone();

        // 스트리밍 호출
        result = engine
            .chat_complete_stream(
                chat_messages,
                None,
                None,
                |delta| {
                    if last_emit_ok {
                        if let Err(e) = emit_handle.emit_all(
                            "ai_feedback_stream_delta",
                            &serde_json::json!({ "text": delta }),
                        ) {
                            eprintln!("[AI Stream] emit delta failed: {}", e);
                            last_emit_ok = false;
                        }
                    }
                },
            )
            .await
            .map_err(|e| e.to_string());
    }

    match result {
        Ok(full_text) => {
            let processing_time_ms = start_time.elapsed().as_millis() as u64;
            let markdown = format!(
                "# 정리하기 ({})\n\n## 오늘 정리\n{}\n\n---\n*모델: {} · 처리시간: {}ms*",
                format_date_label(&now),
                if full_text.trim().is_empty() {
                    "(생성된 요약이 비어 있습니다)".to_string()
                } else {
                    full_text.trim().to_string()
                },
                model_used,
                processing_time_ms
            );

            match write_ai_summary_file(&now, &markdown) {
                Ok(saved) => {
                    let _ = app.emit_all(
                        "ai_feedback_stream_complete",
                        &serde_json::json!({
                            "filename": saved.filename,
                            "path": saved.path,
                            "createdAt": saved.created_at,
                        }),
                    );
                    Ok(())
                }
                Err(e) => {
                    let _ = app.emit_all(
                        "ai_feedback_stream_error",
                        &serde_json::json!({ "message": e }),
                    );
                    Err(e)
                }
            }
        }
        Err(e) => {
            let msg = e.to_string();
            let _ = app.emit_all(
                "ai_feedback_stream_error",
                &serde_json::json!({ "message": msg }),
            );
            Err(msg)
        }
    }
}

#[tauri::command]
pub fn list_ai_summaries(limit: Option<usize>) -> Result<Vec<AiSummaryFile>, String> {
    let dir = summaries_directory_path()?;
    ensure_summaries_dir(&dir)?;

    // Get today's date in YYYYMMDD format
    let today = current_local_time()?;
    let today_date_key = format_date_key(&today)?;

    let mut summaries: Vec<(OffsetDateTime, AiSummaryFile)> = fs::read_dir(&dir)
        .map_err(|error| error.to_string())?
        .filter_map(|entry| match entry {
            Ok(entry) => {
                let path = entry.path();
                if path.extension().and_then(|ext| ext.to_str()) != Some("md") {
                    return None;
                }
                let filename = entry.file_name().to_string_lossy().into_owned();

                // Filter for today's summaries only (ai-feedback-YYYYMMDD*.md pattern)
                if !filename.starts_with(&format!("ai-feedback-{today_date_key}")) {
                    return None;
                }

                let content = fs::read_to_string(&path).unwrap_or_default();
                let metadata = entry.metadata().ok();
                let (sort_key, created_at) = metadata
                    .and_then(|meta| meta.modified().ok())
                    .map(|modified| {
                        let odt: OffsetDateTime = modified.into();
                        let iso = odt.format(&Rfc3339).unwrap_or_else(|_| odt.to_string());
                        (odt, Some(iso))
                    })
                    .unwrap_or((OffsetDateTime::UNIX_EPOCH, None));

                Some((
                    sort_key,
                    AiSummaryFile {
                        filename,
                        path: path.to_string_lossy().into_owned(),
                        created_at,
                        content,
                    },
                ))
            }
            Err(_) => None,
        })
        .collect();

    summaries.sort_by(|a, b| b.0.cmp(&a.0));
    let limit = limit.unwrap_or(10);
    Ok(summaries
        .into_iter()
        .take(limit)
        .map(|(_, summary)| summary)
        .collect())
}
