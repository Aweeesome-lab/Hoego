use serde::Serialize;
use std::fs;
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use tauri::{AppHandle, Manager, State};
use time::format_description::well_known::Rfc3339;
use time::macros::format_description;
use time::OffsetDateTime;

use crate::history::{HistoryState, ensure_daily_file};
use crate::llm;
use crate::pii_masker;
use crate::utils::*;

/// AI 피드백 스트리밍 취소 상태 관리
pub struct StreamCancellationState {
    pub is_cancelled: Arc<AtomicBool>,
}

impl Default for StreamCancellationState {
    fn default() -> Self {
        Self {
            is_cancelled: Arc::new(AtomicBool::new(false)),
        }
    }
}

impl StreamCancellationState {
    pub fn reset(&self) {
        self.is_cancelled.store(false, Ordering::SeqCst);
    }

    pub fn cancel(&self) {
        self.is_cancelled.store(true, Ordering::SeqCst);
    }

    pub fn is_cancelled(&self) -> bool {
        self.is_cancelled.load(Ordering::SeqCst)
    }
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AiSummaryFile {
    pub filename: String,
    pub path: String,
    pub created_at: Option<String>,
    pub content: String,
    pub pii_masked: bool, // 개인정보 보호 여부
}

/// AI 요약 디렉토리를 생성합니다
pub fn ensure_summaries_dir(path: &PathBuf) -> Result<(), String> {
    fs::create_dir_all(path)
        .map_err(|error| format!("AI 요약 디렉토리 생성 실패: {error}, 경로: {:?}", path))
}

/// AI 요약 파일을 작성합니다
fn write_ai_summary_file(date: &OffsetDateTime, content: &str, pii_masked: bool) -> Result<AiSummaryFile, String> {
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
        pii_masked,
    })
}

// Tauri Commands

#[tauri::command]
pub async fn generate_ai_feedback(
    history: State<'_, HistoryState>,
    llm_state: tauri::State<'_, Arc<llm::LLMManager>>,
    model_selection_state: State<'_, crate::model_selection::ModelSelectionState>,
) -> Result<AiSummaryFile, String> {
    let now = current_local_time()?;
    let (today_path, _) = ensure_daily_file(history.inner(), &now)?;
    let today_content = fs::read_to_string(&today_path).unwrap_or_default();

    if today_content.trim().is_empty() {
        return Err("오늘 기록된 내용이 없어 요약을 생성할 수 없습니다.".into());
    }

    // 선택된 모델 확인
    let selected_model_lock = model_selection_state.selected.read().await;
    let selected_model = selected_model_lock.clone();
    drop(selected_model_lock);

    // 모델 타입 결정
    let use_cloud_llm = if let Some(ref model) = selected_model {
        model.model_type == "cloud"
    } else {
        // 선택된 모델이 없으면 로컬 모델만 사용
        false
    };

    // 🔒 개인정보 마스킹 처리 (클라우드 LLM 사용 시에만)
    let (masked_content, pii_detected) = if use_cloud_llm {
        eprintln!("[PII Masking] Cloud LLM detected - applying PII masking");
        let masked = pii_masker::mask_pii(&today_content, false);
        let detected = today_content != masked;

        eprintln!("[AI Feedback] Original length: {} chars", today_content.len());
        eprintln!("[AI Feedback] Masked length: {} chars", masked.len());
        if detected {
            eprintln!("[PII Masking] ⚠️ PII detected and masked");
        } else {
            eprintln!("[PII Masking] ✅ No PII detected");
        }

        (masked, detected)
    } else {
        eprintln!("[PII Masking] Local model detected - skipping PII masking");
        (today_content.clone(), false)
    };

    // 길이 조정: 코치형 피드백(Paragraph)로 500단어 내외 요청 → 충분한 밀도의 결과
    let request = llm::summarize::SummaryRequest {
        content: masked_content,
        style: None, // 프롬프트는 use_local_prompt로 결정됨
        max_length: Some(500),
        model_id: None,
        use_local_prompt: Some(!use_cloud_llm), // 로컬 모델이면 true, 클라우드면 false
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

    // LLM이 생성한 내용을 그대로 사용 (메타 헤더 제거)
    let markdown = if summary_body.is_empty() {
        "(생성된 요약이 비어 있습니다)".to_string()
    } else {
        summary_body.to_string()
    };

    write_ai_summary_file(&now, &markdown, pii_detected)
}

#[tauri::command]
pub async fn generate_ai_feedback_stream(
    app: AppHandle,
    history: State<'_, HistoryState>,
    llm_state: tauri::State<'_, Arc<llm::LLMManager>>,
    cloud_llm_state: State<'_, llm::CloudLLMState>,
    model_selection_state: State<'_, crate::model_selection::ModelSelectionState>,
    cancellation_state: State<'_, StreamCancellationState>,
    target_date: Option<String>, // Optional target date in YYYY-MM-DD format
) -> Result<(), String> {
    // 스트리밍 시작 시 취소 플래그 초기화
    cancellation_state.reset();
    // Determine the target date
    let target_time = if let Some(date_str) = target_date {
        // Parse the provided date (YYYY-MM-DD format)
        let date_format = time::format_description::parse("[year]-[month]-[day]")
            .map_err(|e| format!("날짜 형식 파싱 실패: {}", e))?;

        let date = time::Date::parse(&date_str, &date_format)
            .map_err(|e| format!("날짜 파싱 실패 ({}): {}", date_str, e))?;

        // Convert to OffsetDateTime with current local time zone
        let current_offset = OffsetDateTime::now_local()
            .map_err(|e| format!("로컬 시간 오프셋 가져오기 실패: {}", e))?
            .offset();

        date.with_hms(12, 0, 0)
            .map_err(|e| format!("시간 설정 실패: {}", e))?
            .assume_offset(current_offset)
    } else {
        // Use today's date
        current_local_time()?
    };

    let (target_path, _) = ensure_daily_file(history.inner(), &target_time)?;
    let today_content = fs::read_to_string(&target_path).unwrap_or_default();

    if today_content.trim().is_empty() {
        return Err("오늘 기록된 내용이 없어 요약을 생성할 수 없습니다.".into());
    }

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

    // 🔒 개인정보 마스킹 처리 (클라우드 LLM 사용 시에만)
    let (masked_content, pii_detected) = if use_cloud_llm {
        eprintln!("[PII Masking] Cloud LLM detected - applying PII masking");
        let masked = pii_masker::mask_pii(&today_content, false);
        let detected = today_content != masked;

        eprintln!("[PII Masking] Original length: {} chars", today_content.len());
        eprintln!("[PII Masking] Masked length: {} chars", masked.len());
        if detected {
            eprintln!("[PII Masking] ⚠️ PII detected and masked");
        } else {
            eprintln!("[PII Masking] ✅ No PII detected");
        }

        (masked, detected)
    } else {
        eprintln!("[PII Masking] Local model detected - skipping PII masking");
        (today_content.clone(), false)
    };

    // 마스킹 통계를 프론트엔드로 전송 (개발 모드 검증용)
    if let Err(e) = app.emit_all(
        "ai_feedback_masking_stats",
        serde_json::json!({
            "originalLength": today_content.len(),
            "maskedLength": masked_content.len(),
            "piiDetected": pii_detected,
        }),
    ) {
        eprintln!("[PII Masking] Failed to emit masking stats: {}", e);
    }

    // 프롬프트 구성 (모델 타입에 따라 선택)
    let prompt = if use_cloud_llm {
        eprintln!("[Prompt Selection] Using cloud prompt (deep cognitive analysis)");
        llm::prompts::PromptTemplate::for_business_journal_coach(&masked_content)
    } else {
        eprintln!("[Prompt Selection] Using local prompt (simplified 3-section)");
        llm::prompts::PromptTemplate::for_local_model(&masked_content)
    };
    let chat_messages = prompt.to_chat_format();

    // 모델별 처리 및 결과 반환
    let result = if use_cloud_llm {
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
            max_tokens: Some(4000),
            system_prompt: None,
            metadata: None,
        };

        // CloudLLM provider 가져오기
        let provider_lock = cloud_llm_state.current_provider.read().await;

        if let Some(provider) = provider_lock.as_ref() {
            // 스트리밍 방식으로 호출
            match provider.stream(request).await {
                Ok(mut rx) => {
                    let mut full_text = String::new();
                    let emit_handle = app.clone();
                    let mut cancelled = false;

                    // 스트림에서 델타 수신하며 emit
                    while let Some(delta) = rx.recv().await {
                        // 취소 확인
                        if cancellation_state.is_cancelled() {
                            eprintln!("[Cloud LLM Stream] Cancelled by user");
                            cancelled = true;
                            break;
                        }

                        full_text.push_str(&delta);

                        // 델타를 프론트엔드로 emit
                        if let Err(e) = emit_handle.emit_all(
                            "ai_feedback_stream_delta",
                            &serde_json::json!({ "text": delta }),
                        ) {
                            eprintln!("[Cloud LLM Stream] emit delta failed: {}", e);
                            break;
                        }
                    }

                    // 취소는 에러가 아니라 조기 종료로 처리
                    if cancelled {
                        // 취소된 경우 빈 문자열로 처리하고 함수를 조기 반환
                        return Ok(());
                    }

                    Ok(full_text)
                }
                Err(e) => {
                    Err(format!("Cloud LLM 오류: {}", e))
                }
            }
        } else {
            Err("Cloud LLM이 설정되지 않았습니다. 설정에서 API 키를 등록해주세요.".to_string())
        }
    } else {
        // 로컬 LLM 사용
        let mut engine = llm_state.engine.lock().await;

        let mut last_emit_ok = true;
        let emit_handle = app.clone();
        let cancel_check = cancellation_state.clone();

        // 스트리밍 호출
        let result = engine
            .chat_complete_stream(
                chat_messages,
                None,
                None,
                |delta| {
                    // 취소 확인
                    if cancel_check.is_cancelled() {
                        return;
                    }

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

        // 스트리밍 완료 후 취소 확인
        if cancellation_state.is_cancelled() {
            // 취소된 경우 정상 종료
            return Ok(());
        }

        result
    };

    match result {
        Ok(full_text) => {
            // LLM이 생성한 내용을 그대로 사용 (메타 헤더 제거)
            let markdown = if full_text.trim().is_empty() {
                "(생성된 요약이 비어 있습니다)".to_string()
            } else {
                full_text.trim().to_string()
            };

            match write_ai_summary_file(&target_time, &markdown, pii_detected) {
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

/// AI 피드백 스트리밍을 취소합니다
#[tauri::command]
pub async fn cancel_ai_feedback_stream(
    app: AppHandle,
    cancellation_state: State<'_, StreamCancellationState>,
) -> Result<(), String> {
    eprintln!("[AI Feedback] Cancel requested");
    cancellation_state.cancel();

    // 취소 이벤트를 프론트엔드로 전송
    if let Err(e) = app.emit_all(
        "ai_feedback_stream_cancelled",
        &serde_json::json!({}),
    ) {
        eprintln!("[AI Feedback] Failed to emit cancellation event: {}", e);
    }

    Ok(())
}

#[tauri::command]
pub fn list_ai_summaries(limit: Option<usize>, target_date: Option<String>) -> Result<Vec<AiSummaryFile>, String> {
    let dir = summaries_directory_path()?;
    ensure_summaries_dir(&dir)?;

    // Determine which date to filter for
    let date_key = if let Some(date_str) = target_date {
        // Parse YYYY-MM-DD format and convert to YYYYMMDD
        let date_format = time::format_description::parse("[year]-[month]-[day]")
            .map_err(|e| format!("날짜 형식 파싱 실패: {}", e))?;

        let date = time::Date::parse(&date_str, &date_format)
            .map_err(|e| format!("날짜 파싱 실패 ({}): {}", date_str, e))?;

        // Convert to YYYYMMDD format
        date.format(&time::macros::format_description!("[year][month][day]"))
            .map_err(|e| format!("날짜 포맷 실패: {}", e))?
    } else {
        // Use today's date
        let today = current_local_time()?;
        format_date_key(&today)?
    };

    let mut summaries: Vec<(OffsetDateTime, AiSummaryFile)> = fs::read_dir(&dir)
        .map_err(|error| error.to_string())?
        .filter_map(|entry| match entry {
            Ok(entry) => {
                let path = entry.path();
                if path.extension().and_then(|ext| ext.to_str()) != Some("md") {
                    return None;
                }
                let filename = entry.file_name().to_string_lossy().into_owned();

                // Filter for the specified date's summaries (ai-feedback-YYYYMMDD*.md pattern)
                if !filename.starts_with(&format!("ai-feedback-{date_key}")) {
                    return None;
                }

                let content = fs::read_to_string(&path).unwrap_or_default();

                // 개인정보 보호 메타데이터 파싱
                let pii_masked = content.contains("개인정보 보호: 적용됨");

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
                        pii_masked,
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
