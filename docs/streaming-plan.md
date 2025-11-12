# OTRA AI 피드백 스트리밍 전환 계획

## 목표
- 기존 동기식 요약 생성(`generate_ai_feedback`)을 대체하는 스트리밍 전용 경로를 추가한다.
- 모델 토큰이 생성되는 대로 UI에 점진적으로 표시하고, 완료 시 파일로 저장하여 목록에 반영한다.

## 아키텍처 개요
- Backend(Tauri/Rust)
  - `llm/engine.rs`에 `chat_complete_stream(...)` 추가: OpenAI 호환 Chat Completions SSE(`stream: true`)로 토큰 델타를 콜백으로 전달.
  - `main.rs`에 `generate_ai_feedback_stream` 커맨드 추가: 오늘자 노트로 프롬프트 구성 → 스트리밍 호출 → 델타를 `app.emit_all("ai_feedback_stream_delta", { text })`로 전파 → 종료 시 파일 저장 후 `ai_feedback_stream_complete` 송신.
  - 오류 시 `ai_feedback_stream_error` 이벤트 송신. (선택) 취소 커맨드 추가.

- Frontend(React/TS)
  - `lib/tauri.ts`에 `generateAiFeedbackStream()`와 이벤트 구독 헬퍼 추가.
  - `App.tsx`에 스트리밍 상태(`isStreamingAiFeedback`, `streamingAiText`, `streamingError`)와 배치 렌더(30–60ms) 구현.
  - 완료 이벤트 수신 시 구독 해제 후 `loadAiSummaries()`로 최종 파일 목록 갱신.

## 이벤트 명세
- `ai_feedback_stream_delta`: `{ text: string }`
- `ai_feedback_stream_complete`: `{ filename: string, path: string, createdAt?: string }`
- `ai_feedback_stream_error`: `{ message: string }`

## 테스트 전략
- Rust 단위 테스트: SSE 라인 파서/조립기를 순수 함수로 분리하여 다양한 경계 케이스(청크 분할, 공백 라인, `[DONE]`, 잘못된 JSON)를 검증.
- 통합 경로는 로컬 모델/서버 의존성이 있으므로 최소화하고, UI는 수동 스모크로 확인.

## 단계별 작업
1) 설계 문서 작성(현재 단계)
2) SSE 파서 유닛 테스트(엔진 내부 helper) 구현 및 통과
3) `chat_complete_stream` 추가 및 `generate_ai_feedback_stream` 커맨드 구현, 간단 런타임 테스트
4) 프론트 이벤트 구독/배치 렌더/완료 후 동기화 구현
5) 오류/취소 동작 보완 및 문서/가이드 업데이트

## 성능/UX 주의사항
- 델타마다 즉시 리렌더 대신 타이머 배치(30–60ms)로 프레임 드랍 방지.
- `ReactMarkdown`는 긴 텍스트에서 비용이 크므로 일정 크기마다만 갱신.
- 파일 저장은 완료 시 1회만 수행.

