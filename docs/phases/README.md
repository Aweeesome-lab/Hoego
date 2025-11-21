# Hoego 리팩토링 Phase 가이드

> 독립적이고 self-contained된 Phase별 리팩토링 가이드

---

## 📖 개요

이 디렉토리는 Hoego 프로젝트의 체계적인 리팩토링을 위한 **10개의 독립적인 Phase 문서**를 포함합니다.

각 Phase 문서는:
- ✅ **독립적** - 다른 문서에 의존하지 않음
- 📋 **체크박스 추적** - 진행 상황을 문서 내에서 직접 추적
- 📊 **진행률 표시** - 실시간 완료 퍼센트
- 💡 **실전 예제** - Before/After 코드 포함
- 🔗 **상호 참조** - 관련 Phase 링크

---

## 🗺️ Phase 전체 지도

### 🔴 HIGH Priority (필수 - 먼저 완료)

| Phase | 제목 | 예상 시간 | 난이도 | 상태 |
|-------|------|-----------|--------|------|
| **[Phase 1](./phase-1-backend-restructure.md)** | Backend 모듈 재구성 🦀 | 4-6시간 | ⭐⭐⭐ | 📋 준비 완료 |
| **[Phase 2](./phase-2-frontend-components.md)** | Frontend 컴포넌트 추출 ⚛️ | 5-7시간 | ⭐⭐⭐ | ⏳ 대기 중 |
| **[Phase 9](./phase-9-security-privacy.md)** | 보안 & 프라이버시 강화 🔒 | 2-3시간 | ⭐⭐ | ⏳ 대기 중 |

### 🟡 MEDIUM Priority (중요)

| Phase | 제목 | 예상 시간 | 난이도 | 상태 |
|-------|------|-----------|--------|------|
| **[Phase 3](./phase-3-ipc-type-safety.md)** | IPC & 타입 안전성 🔗 | 3-4시간 | ⭐⭐ | ⏳ 대기 중 |
| **[Phase 4](./phase-4-form-validation.md)** | 폼 관리 & 검증 📝 | 2-3시간 | ⭐⭐ | ⏳ 대기 중 |
| **[Phase 10](./phase-10-final.md)** | 최종 정리 🎯 | 2-3시간 | ⭐ | ⏳ 대기 중 |

### 🟢 LOW Priority (선택적 개선)

| Phase | 제목 | 예상 시간 | 난이도 | 상태 |
|-------|------|-----------|--------|------|
| **[Phase 5](./phase-5-state-management.md)** | 상태 관리 최적화 🗄️ | 3-4시간 | ⭐⭐ | ⏳ 대기 중 |
| **[Phase 6](./phase-6-datetime-handling.md)** | 날짜/시간 처리 통일 📅 | 2시간 | ⭐ | ⏳ 대기 중 |
| **[Phase 7](./phase-7-quality-docs.md)** | 코드 품질 & 문서화 ✨ | 4-5시간 | ⭐⭐ | ⏳ 대기 중 |
| **[Phase 8](./phase-8-performance.md)** | 성능 최적화 ⚡ | 3-4시간 | ⭐⭐⭐ | ⏳ 대기 중 |

---

## 🎯 권장 순서

### 최소 실행 경로 (MVP)
```
Phase 1 → Phase 2 → Phase 9 → Phase 10
```
**총 예상 시간**: 13-19시간
**목표**: 기본 구조 개선 + 보안 강화 + 배포 준비

### 완전 실행 경로 (Full)
```
Phase 1 → Phase 2 → Phase 3 → Phase 4 →
Phase 5 → Phase 6 → Phase 7 → Phase 8 →
Phase 9 → Phase 10
```
**총 예상 시간**: 30-40시간
**목표**: 완전한 코드베이스 현대화

### 맞춤형 경로 (Custom)

**Backend 중심**:
```
Phase 1 → Phase 3 → Phase 6 → Phase 9
```

**Frontend 중심**:
```
Phase 2 → Phase 4 → Phase 5 → Phase 8
```

**품질 중심**:
```
Phase 7 → Phase 8 → Phase 9 → Phase 10
```

---

## 📋 Phase 상세 설명

### Phase 1: Backend 모듈 재구성 🦀

**목표**: Rust 코드를 명확한 모듈 구조로 재구성

**주요 작업**:
- Commands, Services, Models, Utils, Platform 디렉토리 생성
- 기존 루트 레벨 파일들을 적절한 모듈로 이동
- lib.rs 및 main.rs 정리

**완료 기준**:
- [x] 5개 주요 모듈 디렉토리 생성
- [x] 42개 작업 항목 완료
- [x] cargo build 성공
- [x] 모든 기능 정상 작동

[**📄 Phase 1 문서 보기**](./phase-1-backend-restructure.md)

---

### Phase 2: Frontend 컴포넌트 추출 ⚛️

**목표**: 큰 React 컴포넌트를 작고 재사용 가능한 단위로 분리

**주요 작업**:
- App.tsx, Settings.tsx, History 컴포넌트 분리
- 공유 UI 컴포넌트 정리
- Custom hooks 추출

**완료 기준**:
- [x] 모든 컴포넌트 200줄 이하
- [x] 20개 작업 항목 완료
- [x] JSDoc 주석 추가
- [x] 단일 책임 원칙 준수

[**📄 Phase 2 문서 보기**](./phase-2-frontend-components.md)

---

### Phase 3: IPC & 타입 안전성 🔗

**목표**: Frontend-Backend 통신의 타입 안전성 확보

**주요 작업**:
- tauri-specta 설정
- Rust → TypeScript 타입 자동 생성
- 에러 처리 표준화
- IPC 클라이언트 래퍼

**완료 기준**:
- [x] 타입 자동 생성 설정
- [x] 에러 바운더리 구현
- [x] 재시도 로직 구현
- [x] 10개 작업 항목 완료

[**📄 Phase 3 문서 보기**](./phase-3-ipc-type-safety.md)

---

### Phase 4: 폼 관리 & 검증 📝

**목표**: React Hook Form + Zod 통합

**주요 작업**:
- Zod 스키마 정의
- React Hook Form 통합
- 자동 저장 기능

**완료 기준**:
- [x] 모든 폼에 검증 적용
- [x] 8개 작업 항목 완료
- [x] 사용자 친화적 에러 메시지

[**📄 Phase 4 문서 보기**](./phase-4-form-validation.md)

---

### Phase 5: 상태 관리 최적화 🗄️

**목표**: Zustand 스토어 정리 및 React Query 도입

**주요 작업**:
- 도메인별 스토어 분리
- React Query 도입 검토
- 캐싱 전략

**완료 기준**:
- [x] 스토어 분리 완료
- [x] 8개 작업 항목 완료
- [x] 불필요한 리렌더링 제거

[**📄 Phase 5 문서 보기**](./phase-5-state-management.md)

---

### Phase 6: 날짜/시간 처리 통일 📅

**목표**: Rust-TypeScript 간 날짜/시간 처리 일관성

**주요 작업**:
- chrono 표준화 (Rust)
- date-fns/dayjs 선택 (TypeScript)
- ISO 8601 포맷 강제

**완료 기준**:
- [x] 6개 작업 항목 완료
- [x] 포맷 일관성 확보
- [x] UTC 타임존 통일

[**📄 Phase 6 문서 보기**](./phase-6-datetime-handling.md)

---

### Phase 7: 코드 품질 & 문서화 ✨

**목표**: 코드 품질 향상 및 문서화

**주요 작업**:
- JSDoc 주석 작성
- Rust 문서화
- 테스트 작성
- Linting & Formatting

**완료 기준**:
- [x] 12개 작업 항목 완료
- [x] 모든 public API 문서화
- [x] 테스트 커버리지 >70%

[**📄 Phase 7 문서 보기**](./phase-7-quality-docs.md)

---

### Phase 8: 성능 최적화 ⚡

**목표**: 앱 성능 개선

**주요 작업**:
- React 메모이제이션
- 코드 스플리팅
- Rust 클론 제거
- 병렬 처리

**완료 기준**:
- [x] 8개 작업 항목 완료
- [x] 번들 크기 최적화
- [x] 불필요한 리렌더링 제거

[**📄 Phase 8 문서 보기**](./phase-8-performance.md)

---

### Phase 9: 보안 & 프라이버시 강화 🔒

**목표**: 데이터 보호 및 보안 강화

**주요 작업**:
- PII 마스킹 강화
- Tauri Capabilities 최소 권한
- 로깅 필터링

**완료 기준**:
- [x] 6개 작업 항목 완료
- [x] PII 로그 노출 제로
- [x] 보안 감사 통과

[**📄 Phase 9 문서 보기**](./phase-9-security-privacy.md)

---

### Phase 10: 최종 정리 🎯

**목표**: 배포 준비

**주요 작업**:
- 문서 최종 검토
- 프로덕션 빌드 테스트
- 코드 사이닝
- 릴리스 노트

**완료 기준**:
- [x] 5개 작업 항목 완료
- [x] 모든 테스트 통과
- [x] 프로덕션 빌드 성공

[**📄 Phase 10 문서 보기**](./phase-10-final.md)

---

## 📊 전체 진행률 추적

### 체크박스 카운트

```bash
# 특정 Phase 진행률 확인
grep -o "\[x\]" phase-1-backend-restructure.md | wc -l

# 전체 Phase 진행률 확인
grep -o "\[x\]" phase-*.md | wc -l
```

### 진행 상황 업데이트

각 Phase 문서 내에서 직접 체크박스를 업데이트하고 commit:

```bash
# 작업 완료 시
git add docs/phases/phase-X-*.md
git commit -m "refactor: Phase X - completed [task description]

✅ [1dc1798] refactor: Phase X - task description

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## 🚀 시작하기

### 1단계: Phase 선택

필요에 맞는 경로 선택:
- 🎯 **빠른 개선**: Phase 1, 2만
- 🏆 **완전한 리팩토링**: Phase 1-10 순서대로
- 🎨 **맞춤형**: 필요한 Phase만 선택

### 2단계: Phase 문서 읽기

선택한 Phase 문서를 열고:
1. 📋 목표 확인
2. 📊 작업 목록 검토
3. 💡 예제 코드 학습
4. ✅ 체크리스트 준비

### 3단계: 작업 실행

1. 체크박스를 하나씩 완료
2. 진행률 업데이트
3. Git commit 생성
4. 다음 작업으로 이동

### 4단계: Phase 완료

1. ✅ 완료 체크리스트 검토
2. 💾 최종 commit
3. 🎉 다음 Phase로 이동

---

## 🔗 관련 문서

### 아키텍처
- [아키텍처 개요](../architecture/index.md)
- [프로젝트 구조](../architecture/프로젝트-구조.md)
- [IPC 통신 패턴](../architecture/ipc-통신-패턴.md)

### 가이드
- [컴포넌트 추출 가이드](../component-extraction-guide.md)
- [컴포넌트 작성 규칙](../architecture/컴포넌트-작성-규칙.md)

### 레거시 문서 (참고용)
- [리팩토링 계획](../refactoring-plan.md) - Phase 문서로 대체됨
- [리팩토링 진행 상황](../refactoring-progress.md) - Phase별 추적으로 대체됨

---

## 💡 팁

### 효율적인 작업을 위한 팁

1. **한 번에 하나의 Phase만 집중**
   - 멀티태스킹 지양
   - Phase 내 작업을 순차적으로 완료

2. **작은 단위로 commit**
   - 각 작업 항목마다 commit
   - 의미 있는 커밋 메시지

3. **테스트를 자주 실행**
   - 변경 후 즉시 테스트
   - 문제를 빨리 발견하고 수정

4. **문서화를 미루지 말 것**
   - 코드 작성 직후 주석 추가
   - 나중으로 미루면 잊어버림

5. **휴식을 취하기**
   - 장시간 작업 후 휴식
   - 신선한 관점으로 코드 검토

---

## ❓ FAQ

### Q: Phase를 순서대로 해야 하나요?

A: 필수는 아닙니다. 하지만:
- Phase 1, 2는 다른 Phase의 기반이 되므로 먼저 권장
- Phase 3은 Phase 1 완료 후 진행 권장
- Phase 10은 모든 Phase 완료 후

### Q: Phase를 건너뛸 수 있나요?

A: 가능합니다!
- 🔴 HIGH Priority는 필수
- 🟡 MEDIUM은 권장
- 🟢 LOW는 선택

### Q: 하나의 Phase가 너무 크면?

A: Phase 내 작업을 더 작은 단위로 나눠서 진행하세요.

### Q: 중간에 막히면?

A: 1) Phase 문서의 예제 참고
   2) 아키텍처 문서 확인
   3) 이슈 남기기

---

**최종 업데이트**: 2025-11-21
**작성자**: Claude SM Agent
**버전**: 1.0.0
