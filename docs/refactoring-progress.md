# Hoego 리팩토링 진행 상황

> ⭐ **TOP PRIORITY** - 작업 시작 전 반드시 확인하고, 완료 시 체크박스 업데이트 필수!

---

## 📊 전체 진행률

**0% 완료** (0/150+ 작업)

---

## 📝 현재 작업

**현재 Phase**: 준비 단계
**현재 작업**: 리팩토링 문서 구조 생성
**상태**: 🟡 진행 중

---

## Phase 1: Backend 모듈 재구성 🦀

**진행률**: 0% (0/42)

### 1.1 디렉토리 구조 생성
- [ ] `commands/` 모듈 생성
- [ ] `services/` 모듈 생성
- [ ] `models/` 모듈 생성
- [ ] `utils/` 모듈 생성
- [ ] `platform/` 모듈 생성

### 1.2 Commands 모듈 구성 (0/9)
- [ ] `commands/mod.rs` 생성
- [ ] `commands/dump.rs` - 일지 관련 commands
- [ ] `commands/feedback.rs` - 피드백 관련 commands
- [ ] `commands/retrospect.rs` - 회고 관련 commands
- [ ] `commands/history.rs` - 히스토리 관련 commands
- [ ] `commands/settings.rs` - 설정 관련 commands
- [ ] `commands/ai.rs` - AI 관련 commands
- [ ] `commands/llm.rs` - LLM 관련 commands
- [ ] `commands/window.rs` - 윈도우 관련 commands

### 1.3 Services 모듈 구성 (0/12)
- [ ] `services/mod.rs` 생성
- [ ] `services/dump_service.rs` - 일지 비즈니스 로직
- [ ] `services/feedback_service.rs` - 피드백 비즈니스 로직
- [ ] `services/retrospect_service.rs` - 회고 비즈니스 로직
- [ ] `services/history_service.rs` - 히스토리 비즈니스 로직
- [ ] `services/ai_service.rs` - AI 통합 로직
- [ ] `services/storage_service.rs` - 파일 저장/로드
- [ ] `services/llm/mod.rs` 생성
- [ ] `services/llm/engine.rs` 이동
- [ ] `services/llm/summarize.rs` 이동
- [ ] `services/llm/download.rs` 이동
- [ ] `services/llm/providers/` 이동

### 1.4 Models 모듈 구성 (0/7)
- [ ] `models/mod.rs` 생성
- [ ] `models/dump.rs` - 일지 데이터 모델
- [ ] `models/feedback.rs` - 피드백 데이터 모델
- [ ] `models/retrospect.rs` - 회고 데이터 모델
- [ ] `models/settings.rs` - 설정 데이터 모델
- [ ] `models/paths.rs` - 경로 구조체
- [ ] `models/errors.rs` - 에러 타입 정의

### 1.5 Utils 모듈 구성 (0/5)
- [ ] `utils/mod.rs` 생성
- [ ] `utils/pii_masker.rs` - PII 마스킹 이동
- [ ] `utils/logger.rs` - 로깅 유틸리티
- [ ] `utils/datetime.rs` - 날짜/시간 처리
- [ ] `utils/link_preview.rs` - 링크 프리뷰 이동

### 1.6 Platform 모듈 구성 (0/4)
- [ ] `platform/mod.rs` 생성
- [ ] `platform/tray.rs` - 시스템 트레이 이동
- [ ] `platform/window_manager.rs` - 윈도우 관리 이동
- [ ] `platform/shortcuts.rs` - 단축키 이동

### 1.7 루트 레벨 정리 (0/7)
- [ ] `ai_summary.rs` → `services/ai_service.rs`로 이동
- [ ] `app_settings.rs` → `models/settings.rs` + `services/` 분리
- [ ] `history.rs` → `services/history_service.rs`로 이동
- [ ] `model_selection.rs` → 적절한 모듈로 이동
- [ ] `weekly_data.rs` → `services/weekly_service.rs`로 이동
- [ ] `utils.rs` → `utils/` 세분화
- [ ] `lib.rs` 및 `main.rs` 정리

---

## Phase 2: Frontend 컴포넌트 추출 ⚛️

**진행률**: 0% (0/20)

### 2.1 Main App 컴포넌트 분리 (0/4)
- [ ] `App.tsx` 분석 및 분리 계획 수립
- [ ] 레이아웃 컴포넌트 추출
- [ ] 패널 컴포넌트 분리 (Dump, Feedback, Retrospect)
- [ ] 상태 관리 로직 hooks로 추출

### 2.2 Settings 컴포넌트 분리 (0/4)
- [ ] `settings.tsx` 분석
- [ ] 각 설정 섹션을 독립 컴포넌트로 분리
- [ ] 차트 컴포넌트 최적화
- [ ] 폼 관리 로직 hooks로 추출

### 2.3 History 컴포넌트 분리 (0/4)
- [ ] `history/` 컴포넌트 검토
- [ ] 파일 리스트 컴포넌트 최적화
- [ ] 필터/검색 컴포넌트 추출
- [ ] 가상 스크롤링 고려

### 2.4 공유 컴포넌트 정리 (0/4)
- [ ] `components/` 구조 검토
- [ ] 중복 컴포넌트 통합
- [ ] UI 컴포넌트 일관성 확보
- [ ] Radix UI 기반 컴포넌트 표준화

### 2.5 Hooks 정리 (0/4)
- [ ] 커스텀 훅 정리
- [ ] 폼 관련 훅 추가 (React Hook Form)
- [ ] 데이터 페칭 훅 추가
- [ ] 단축키 훅 정리

---

## Phase 3: IPC & 타입 안전성 🔗

**진행률**: 0% (0/10)

### 3.1 Tauri Commands 타입 생성 (0/3)
- [ ] `tauri-specta` 설정
- [ ] Rust → TypeScript 타입 자동 생성
- [ ] `tauri-commands.ts` 자동 갱신 설정

### 3.2 에러 처리 표준화 (0/4)
- [ ] Rust `AppError` 타입 정의
- [ ] Frontend 에러 매핑 구현
- [ ] 에러 바운더리 구현
- [ ] 사용자 친화적 에러 메시지

### 3.3 IPC 클라이언트 래퍼 (0/3)
- [ ] `lib/tauri.ts` 강화
- [ ] 타입 안전한 invoke 래퍼
- [ ] 재시도 로직 구현

---

## Phase 4: 폼 관리 & 검증 📝

**진행률**: 0% (0/8)

### 4.1 Zod 스키마 정의 (0/4)
- [ ] 일지 폼 스키마
- [ ] 설정 폼 스키마
- [ ] 회고 템플릿 스키마
- [ ] 공통 검증 규칙

### 4.2 폼 컴포넌트 구현 (0/4)
- [ ] React Hook Form 통합
- [ ] 검증 에러 표시
- [ ] 폼 상태 관리
- [ ] 자동 저장 기능

---

## Phase 5: 상태 관리 최적화 🗄️

**진행률**: 0% (0/8)

### 5.1 스토어 구조 재설계 (0/4)
- [ ] `appStore.ts` 분석
- [ ] 도메인별 스토어 분리 고려
- [ ] 퍼시스턴스 전략
- [ ] 미들웨어 활용

### 5.2 React Query 도입 검토 (0/4)
- [ ] 서버/클라이언트 상태 분리
- [ ] 캐싱 전략
- [ ] 낙관적 업데이트
- [ ] 백그라운드 동기화

---

## Phase 6: 날짜/시간 처리 통일 📅

**진행률**: 0% (0/6)

### 6.1 Rust 구현 (0/3)
- [ ] `chrono` 사용 표준화
- [ ] ISO 8601 포맷 강제
- [ ] 타임존 처리 (UTC)

### 6.2 TypeScript 구현 (0/3)
- [ ] 날짜 라이브러리 선택
- [ ] 날짜 파싱/포맷팅 유틸
- [ ] 타임존 변환 헬퍼

---

## Phase 7: 코드 품질 & 문서화 ✨

**진행률**: 0% (0/12)

### 7.1 JSDoc 주석 (0/3)
- [ ] export 컴포넌트 주석
- [ ] 커스텀 훅 주석
- [ ] 서비스 함수 주석

### 7.2 Rust 문서화 (0/3)
- [ ] public 함수 doc comments
- [ ] 모듈 레벨 문서
- [ ] 예제 코드 추가

### 7.3 테스팅 (0/3)
- [ ] Frontend 테스트 (Vitest)
- [ ] Backend 테스트 (Rust)
- [ ] E2E 테스트 (선택)

### 7.4 Linting & Formatting (0/3)
- [ ] ESLint 규칙 정리
- [ ] Prettier 설정 통일
- [ ] Pre-commit hooks 설정

---

## Phase 8: 성능 최적화 ⚡

**진행률**: 0% (0/8)

### 8.1 React 최적화 (0/4)
- [ ] `React.memo` 적용
- [ ] `useMemo`/`useCallback` 최적화
- [ ] 코드 스플리팅
- [ ] 번들 크기 분석

### 8.2 Rust 최적화 (0/4)
- [ ] 불필요한 클론 제거
- [ ] 비동기 작업 병렬화
- [ ] 파일 I/O 최적화
- [ ] 메모리 프로파일링

---

## Phase 9: 보안 & 프라이버시 강화 🔒

**진행률**: 0% (0/6)

### 9.1 PII 보호 (0/3)
- [ ] PII 마스킹 규칙 검토
- [ ] 로깅 필터링
- [ ] LLM 전송 데이터 최소화

### 9.2 Tauri Capabilities (0/3)
- [ ] 최소 권한 원칙 적용
- [ ] 파일 시스템 접근 제한
- [ ] 네트워크 접근 제한

---

## Phase 10: 최종 정리 🎯

**진행률**: 0% (0/5)

### 10.1 문서 업데이트 (0/3)
- [ ] README.md
- [ ] CHANGELOG.md
- [ ] 아키텍처 문서 최종 검토

### 10.2 빌드 & 배포 (0/2)
- [ ] 프로덕션 빌드 테스트
- [ ] 코드 사이닝 설정

---

## 📅 세션 노트

### 2025-11-21 - 리팩토링 문서 구조 완성 ✅
- ✅ 아키텍처 문서 기반 현황 분석 완료
- ✅ `docs/refactoring-plan.md` 생성 완료 (10개 Phase, 150+ 작업 항목)
- ✅ `docs/refactoring-progress.md` 생성 완료 (이 파일, 체크박스 추적)
- ✅ `docs/component-extraction-guide.md` 생성 완료 (React 패턴, 실전 예제)

**성과**:
- 📋 완전한 리팩토링 로드맵 수립
- ✅ 진행 상황 추적 시스템 구축
- 📚 컴포넌트 분리 가이드라인 문서화
- 🎯 Phase 1 시작 준비 완료

**다음 작업**:
- Git commit 생성 (docs: refactoring 문서 구조 완성)
- Phase 1.1 시작 - Backend 디렉토리 구조 생성

---

## 🎯 다음 단계

1. **즉시**: `component-extraction-guide.md` 작성 완료
2. **다음 세션**: Phase 1.1 시작 - Backend 디렉토리 구조 생성
3. **확인 필요**: 기존 코드에서 사용 중인 패턴 파악

---

## 📌 중요 규칙

### 작업 완료 시 (REQUIRED)
1. ✅ 체크박스 업데이트
2. 📝 세션 노트에 commit hash + 메시지 기록
3. 📊 전체 진행률 업데이트
4. 💾 Git commit 생성
   - Format: `refactor: [phase-name] - completed task description`
   - Co-author 추가: `Co-Authored-By: Claude <noreply@anthropic.com>`

### 금지 사항
- ❌ 문서 읽지 않고 작업 시작
- ❌ 완료 작업 체크 누락
- ❌ 세션 노트 기록 누락
- ❌ Commit 없이 다음 단계 진행

---

**최종 업데이트**: 2025-11-21 10:30
**담당**: Claude SM Agent
