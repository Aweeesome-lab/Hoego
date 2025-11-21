# Hoego 리팩토링 계획

## 목표

아키텍처 문서(`docs/architecture/`)에 정의된 구조에 맞춰 코드베이스를 재구성하여:
- 명확한 모듈 경계와 책임 분리
- 유지보수 가능한 컴포넌트 구조
- 타입 안전성 향상
- 코드 품질 및 테스트 가능성 개선

---

## Phase 1: Backend 모듈 재구성 🦀

**목표**: Rust 코드를 명확한 모듈 구조로 재구성

### 1.1 디렉토리 구조 생성
- [ ] `commands/` 모듈 생성
- [ ] `services/` 모듈 생성
- [ ] `models/` 모듈 생성
- [ ] `utils/` 모듈 생성
- [ ] `platform/` 모듈 생성

### 1.2 Commands 모듈 구성
- [ ] `commands/mod.rs` 생성
- [ ] `commands/dump.rs` - 일지 관련 commands
- [ ] `commands/feedback.rs` - 피드백 관련 commands
- [ ] `commands/retrospect.rs` - 회고 관련 commands
- [ ] `commands/history.rs` - 히스토리 관련 commands
- [ ] `commands/settings.rs` - 설정 관련 commands
- [ ] `commands/ai.rs` - AI 관련 commands
- [ ] `commands/llm.rs` - LLM 관련 commands
- [ ] `commands/window.rs` - 윈도우 관련 commands

### 1.3 Services 모듈 구성
- [ ] `services/mod.rs` 생성
- [ ] `services/dump_service.rs` - 일지 비즈니스 로직
- [ ] `services/feedback_service.rs` - 피드백 비즈니스 로직
- [ ] `services/retrospect_service.rs` - 회고 비즈니스 로직
- [ ] `services/history_service.rs` - 히스토리 비즈니스 로직
- [ ] `services/ai_service.rs` - AI 통합 로직
- [ ] `services/storage_service.rs` - 파일 저장/로드
- [ ] `services/llm/` - LLM 서비스 (기존 llm/ 이동)
  - [ ] `services/llm/mod.rs`
  - [ ] `services/llm/engine.rs`
  - [ ] `services/llm/summarize.rs`
  - [ ] `services/llm/download.rs`
  - [ ] `services/llm/security.rs`
  - [ ] `services/llm/providers/`

### 1.4 Models 모듈 구성
- [ ] `models/mod.rs` 생성
- [ ] `models/dump.rs` - 일지 데이터 모델
- [ ] `models/feedback.rs` - 피드백 데이터 모델
- [ ] `models/retrospect.rs` - 회고 데이터 모델
- [ ] `models/settings.rs` - 설정 데이터 모델
- [ ] `models/paths.rs` - 경로 구조체
- [ ] `models/errors.rs` - 에러 타입 정의

### 1.5 Utils 모듈 구성
- [ ] `utils/mod.rs` 생성
- [ ] `utils/pii_masker.rs` - PII 마스킹 (기존 파일 이동)
- [ ] `utils/logger.rs` - 로깅 유틸리티
- [ ] `utils/datetime.rs` - 날짜/시간 처리
- [ ] `utils/link_preview.rs` - 링크 프리뷰 (기존 파일 이동)

### 1.6 Platform 모듈 구성
- [ ] `platform/mod.rs` 생성
- [ ] `platform/tray.rs` - 시스템 트레이 (기존 파일 이동)
- [ ] `platform/window_manager.rs` - 윈도우 관리 (기존 파일 이동)
- [ ] `platform/shortcuts.rs` - 단축키 (기존 파일 이동)

### 1.7 루트 레벨 정리
- [ ] `lib.rs` - 모듈 선언 및 초기화
- [ ] `main.rs` - 앱 진입점 (최소화)
- [ ] 기존 루트 파일들을 적절한 모듈로 이동
  - [ ] `ai_summary.rs` → `services/ai_service.rs`
  - [ ] `app_settings.rs` → `models/settings.rs` + `services/settings_service.rs`
  - [ ] `history.rs` → `services/history_service.rs`
  - [ ] `model_selection.rs` → `models/` or `services/`
  - [ ] `weekly_data.rs` → `services/weekly_service.rs`
  - [ ] `utils.rs` → `utils/` 세분화

---

## Phase 2: Frontend 컴포넌트 추출 ⚛️

**목표**: 큰 컴포넌트를 작고 재사용 가능한 단위로 분리

### 2.1 Main App 컴포넌트 분리
- [ ] `src/apps/main/App.tsx` 분석 및 분리 계획 수립
- [ ] 레이아웃 컴포넌트 추출
- [ ] 패널 컴포넌트 분리 (Dump, Feedback, Retrospect)
- [ ] 상태 관리 로직 hooks로 추출

### 2.2 Settings 컴포넌트 분리
- [ ] `src/apps/settings/settings.tsx` 분석
- [ ] 각 설정 섹션을 독립 컴포넌트로 분리
- [ ] 차트 컴포넌트 최적화
- [ ] 폼 관리 로직 hooks로 추출

### 2.3 History 컴포넌트 분리
- [ ] `src/apps/history/` 컴포넌트 검토
- [ ] 파일 리스트 컴포넌트 최적화
- [ ] 필터/검색 컴포넌트 추출
- [ ] 가상 스크롤링 고려 (성능 최적화)

### 2.4 공유 컴포넌트 정리
- [ ] `src/components/` 구조 검토
- [ ] 중복 컴포넌트 통합
- [ ] UI 컴포넌트 일관성 확보
- [ ] Radix UI 기반 컴포넌트 표준화

### 2.5 Hooks 정리 및 추가
- [ ] 커스텀 훅 정리 (`src/hooks/`)
- [ ] 폼 관련 훅 추가 (React Hook Form)
- [ ] 데이터 페칭 훅 추가 (TanStack Query 고려)
- [ ] 단축키 훅 정리

---

## Phase 3: IPC & 타입 안전성 🔗

**목표**: Frontend-Backend 통신 타입 안전성 확보

### 3.1 Tauri Commands 타입 생성
- [ ] `tauri-specta` 설정
- [ ] Rust 타입에서 TypeScript 타입 자동 생성
- [ ] `src/types/tauri-commands.ts` 자동 갱신 설정

### 3.2 에러 처리 표준화
- [ ] Rust `AppError` 타입 정의 (`models/errors.rs`)
- [ ] Frontend 에러 매핑 구현 (`src/constants/errors.ts`)
- [ ] 에러 바운더리 구현
- [ ] 사용자 친화적 에러 메시지

### 3.3 IPC 클라이언트 래퍼
- [ ] `src/lib/tauri.ts` 강화
- [ ] 타입 안전한 invoke 래퍼
- [ ] 로딩/에러 상태 처리
- [ ] 재시도 로직 구현

---

## Phase 4: 폼 관리 & 검증 📝

**목표**: React Hook Form + Zod 통합

### 4.1 Zod 스키마 정의
- [ ] 일지 폼 스키마
- [ ] 설정 폼 스키마
- [ ] 회고 템플릿 스키마
- [ ] 공통 검증 규칙

### 4.2 폼 컴포넌트 구현
- [ ] React Hook Form 통합
- [ ] 검증 에러 표시
- [ ] 폼 상태 관리
- [ ] 자동 저장 기능

---

## Phase 5: 상태 관리 최적화 🗄️

**목표**: Zustand 스토어 정리 및 최적화

### 5.1 스토어 구조 재설계
- [ ] `src/store/appStore.ts` 분석
- [ ] 도메인별 스토어 분리 고려
- [ ] 퍼시스턴스 전략 (localStorage vs Tauri)
- [ ] 미들웨어 활용 (devtools, persist)

### 5.2 React Query 도입 검토
- [ ] 서버 상태 vs 클라이언트 상태 분리
- [ ] 캐싱 전략
- [ ] 낙관적 업데이트
- [ ] 백그라운드 동기화

---

## Phase 6: 날짜/시간 처리 통일 📅

**목표**: Rust-TypeScript 간 날짜/시간 처리 일관성

### 6.1 Rust 구현
- [ ] `chrono` 사용 표준화
- [ ] ISO 8601 포맷 강제
- [ ] 타임존 처리 (UTC)

### 6.2 TypeScript 구현
- [ ] `date-fns` 또는 `dayjs` 선택
- [ ] 날짜 파싱/포맷팅 유틸
- [ ] 타임존 변환 헬퍼

---

## Phase 7: 코드 품질 & 문서화 ✨

**목표**: 코드 품질 향상 및 문서화

### 7.1 JSDoc 주석 추가
- [ ] 모든 export 컴포넌트
- [ ] 모든 커스텀 훅
- [ ] 모든 서비스 함수

### 7.2 Rust 문서화
- [ ] 모든 public 함수에 doc comments
- [ ] 모듈 레벨 문서
- [ ] 예제 코드 추가

### 7.3 테스팅
- [ ] Frontend: Vitest + Testing Library
- [ ] Backend: Rust 단위 테스트
- [ ] E2E 테스트 (선택)

### 7.4 Linting & Formatting
- [ ] ESLint 규칙 정리
- [ ] Prettier 설정 통일
- [ ] `rustfmt` + `clippy` 적용
- [ ] Pre-commit hooks 설정

---

## Phase 8: 성능 최적화 ⚡

**목표**: 앱 성능 개선

### 8.1 React 최적화
- [ ] `React.memo` 적용
- [ ] `useMemo` / `useCallback` 최적화
- [ ] 코드 스플리팅 (`React.lazy`)
- [ ] 번들 크기 분석

### 8.2 Rust 최적화
- [ ] 불필요한 클론 제거
- [ ] 비동기 작업 병렬화
- [ ] 파일 I/O 최적화
- [ ] 메모리 프로파일링

---

## Phase 9: 보안 & 프라이버시 강화 🔒

**목표**: 데이터 보호 및 보안 강화

### 9.1 PII 보호
- [ ] PII 마스킹 규칙 검토
- [ ] 로깅 필터링
- [ ] LLM 전송 데이터 최소화

### 9.2 Tauri Capabilities
- [ ] 최소 권한 원칙 적용
- [ ] 파일 시스템 접근 제한
- [ ] 네트워크 접근 제한

---

## Phase 10: 최종 정리 🎯

**목표**: 배포 준비

### 10.1 문서 업데이트
- [ ] README.md
- [ ] CHANGELOG.md
- [ ] 아키텍처 문서 최종 검토

### 10.2 빌드 & 배포
- [ ] 프로덕션 빌드 테스트
- [ ] 코드 사이닝 설정
- [ ] 업데이트 메커니즘 검토

---

## 진행 방식

1. **Phase 단위 진행**: 한 번에 한 Phase씩 완료
2. **체크포인트**: 각 Phase 완료 시 git commit
3. **테스트**: 주요 변경 후 앱 동작 확인
4. **문서화**: `refactoring-progress.md`에 진행 상황 기록

---

## 우선순위

- **High**: Phase 1 (Backend 재구성), Phase 2 (컴포넌트 분리)
- **Medium**: Phase 3 (IPC), Phase 4 (폼), Phase 5 (상태)
- **Low**: Phase 6-10 (최적화, 문서화, 정리)

---

**최종 수정일**: 2025-11-21
