# Hoego 리팩토링 계획: Today-Only → Full Note App

**시작일**: 2025-11-21
**현재 상태**: ✅ Phase 1 완료, Phase 2 준비 완료
**목표**: 데이터 손실 버그 수정 및 노트 앱 구조로 전환

---

## 🎯 리팩토링 목적

### 문제 상황

현재 Hoego는 **치명적인 데이터 손실 버그**가 있습니다:

1. 히스토리를 보면서 체크박스를 클릭하면 → **오늘 파일에 저장됨**
2. 히스토리를 보면서 Cmd+E로 저장하면 → **오늘 파일에 저장됨**
3. 히스토리를 보면서 편집하고 ESC를 누르면 → **오늘 파일에 저장됨**

**결과**: 과거 파일들이 오늘 날짜로 덮어씌워져 데이터 손실

### 근본 원인

```typescript
// 5곳에서 이렇게 하드코딩되어 있음
await saveTodayMarkdown(content);  // ❌ 항상 오늘!
```

코드가 "오늘만 편집한다"는 가정으로 작성되었으나, 이제는 **히스토리도 편집 가능**하므로 구조 변경이 필요합니다.

### 해결 방법

**Active Document 패턴** 도입:
- 현재 열린 문서를 추적
- 자동으로 올바른 파일에 저장

---

## 📋 4단계 마이그레이션 계획

### ✅ Phase 1: Foundation (완료)

**목표**: 안전한 기반 코드 구축
**상태**: ✅ 2025-11-21 완료
**리스크**: 낮음 (기존 코드 무변경)

**생성된 파일**:
- `src/types/document.ts` - 타입 정의
- `src/store/documentStore.ts` - Zustand 스토어
- `src/hooks/useActiveDocument.ts` - React 훅

**핵심 성과**:
```typescript
// 이제 이 한 줄로 자동으로 올바른 파일에 저장!
const { saveActiveDocument } = useActiveDocument();
await saveActiveDocument(content);
```

**문서**: [REFACTORING_PHASE1.md](./REFACTORING_PHASE1.md)

---

### ⏳ Phase 2: Save Operations Migration (다음 작업)

**목표**: 5개 버그 지점 수정
**상태**: 🔜 준비 완료
**리스크**: 중간 (각 수정은 단순하지만 철저한 테스트 필요)

**수정 대상**:

| 위치 | 파일 | 줄 | 내용 |
|------|------|----|----|
| 1 | `src/hooks/useMarkdown.ts` | 222 | 체크박스 토글 |
| 2 | `src/hooks/useMarkdown.ts` | 270 | 편집 자동 저장 |
| 3 | `src/apps/main/App.tsx` | 360 | Cmd+E 저장 |
| 4 | `src/apps/main/App.tsx` | 388 | ESC 저장 |
| 5 | `src/apps/main/App.tsx` | 173 | 히스토리 자동 저장 (이미 올바름, 확인만) |

**각 수정 방법**:
```diff
- await saveTodayMarkdown(content);
+ const { saveActiveDocument } = useActiveDocument();
+ await saveActiveDocument(content);
```

**테스트 계획**:
- [ ] 오늘 문서 편집 → 오늘 파일에 저장 확인
- [ ] 히스토리 편집 → 히스토리 파일에 저장 확인
- [ ] 오늘 ↔ 히스토리 전환 → 각각 올바른 파일에 저장 확인

**예상 소요 시간**: 1-2시간

**문서**: [REFACTORING_PHASE2.md](./REFACTORING_PHASE2.md)

---

### ⏳ Phase 3: View Switching Refactor (예정)

**목표**: 뷰 전환 로직 중앙화
**상태**: 📅 Phase 2 이후
**리스크**: 높음 (복잡한 상태 동기화)

**수정 대상**:
- `handleHistoryFileClick` - 히스토리 문서 로드
- `handleHomeClick` - 오늘 문서 로드
- DumpPanel props - content/setContent 통합

**Before**:
```typescript
// 여러 곳에 분산된 로직
const content = await getHistoryMarkdown(file.path);
setMarkdownContent(content);
setCurrentHistoryDate(file.date);
```

**After**:
```typescript
// 중앙화된 로직
const { loadHistory } = useActiveDocument();
await loadHistory(file.date, file.path);
```

**예상 소요 시간**: 2-3시간

---

### ⏳ Phase 4: Cleanup (예정)

**목표**: 레거시 코드 제거
**상태**: 📅 Phase 3 이후
**리스크**: 낮음 (단순 정리)

**제거 대상**:
- `currentHistoryDate` 로컬 상태
- `markdownContent` / `editingContent` (Zustand)
- 중복된 save 로직

**문서 업데이트**:
- 아키텍처 다이어그램
- 개발자 가이드

**예상 소요 시간**: 1시간

---

## 📊 전체 진행 상황

```
┌──────────────────────────────────────────────────┐
│ Phase 1: Foundation          ████████████ 100%  │
│ Phase 2: Save Migration      ░░░░░░░░░░░░   0%  │
│ Phase 3: View Switching      ░░░░░░░░░░░░   0%  │
│ Phase 4: Cleanup             ░░░░░░░░░░░░   0%  │
├──────────────────────────────────────────────────┤
│ Total Progress:              ███░░░░░░░░░  25%  │
└──────────────────────────────────────────────────┘
```

**예상 완료 일정**:
- Phase 2: 2025-11-22 (1-2시간)
- Phase 3: 2025-11-23 (2-3시간)
- Phase 4: 2025-11-24 (1시간)

---

## 🎯 성공 기준

### 버그 수정
- ✅ 히스토리 편집 시 올바른 파일에 저장
- ✅ 오늘 ↔ 히스토리 전환 시 데이터 손실 없음
- ✅ 모든 저장 경로가 Active Document 사용

### 코드 품질
- ✅ TypeScript 타입 에러 0개
- ✅ 단일 저장 함수로 통합
- ✅ 명확한 책임 분리

### 사용성
- ✅ 저장 중 상태 표시
- ✅ Unsaved changes 경고
- ✅ 에러 발생 시 명확한 메시지

---

## 🔧 기술 스택

### 사용 중인 도구
- **React 18** - UI 프레임워크
- **Zustand** - 상태 관리
- **TypeScript** - 타입 안전성
- **Tauri** - 데스크톱 앱 프레임워크

### 새로 도입
- **Active Document Pattern** - 문서 추상화
- **Document Store** - 중앙 상태 관리

---

## 📚 관련 문서

### 리팩토링 가이드
- [Phase 1: Foundation](./REFACTORING_PHASE1.md) ✅ 완료
- [Phase 2: Save Operations](./REFACTORING_PHASE2.md) 🔜 다음
- Phase 3: View Switching (예정)
- Phase 4: Cleanup (예정)

### 기술 문서
- [Active Document API](./REFACTORING_PHASE1.md#3-srchooksuseactivedocumentts-200-lines)
- [Document Store API](./REFACTORING_PHASE1.md#2-srcstore documentstorets-260-lines)
- [Type Definitions](./REFACTORING_PHASE1.md#1-srctypesdocumentts-150-lines)

### 프로젝트 문서
- [CLAUDE.md](./CLAUDE.md) - 코딩 가이드라인
- [README.md](./README.md) - 프로젝트 개요

---

## 🚨 중요 주의사항

### 백업
Phase 2 시작 전 **반드시 백업**:
```bash
# 데이터 백업
cp -r ~/Documents/Hoego/history ~/Documents/Hoego/history_backup_$(date +%Y%m%d)

# 코드 백업 (Git)
git add .
git commit -m "backup: before phase 2 refactoring"
```

### 테스트
각 Phase 완료 후 **수동 테스트 필수**:
1. 오늘 문서 편집 → 저장 확인
2. 히스토리 문서 편집 → 저장 확인
3. 문서 전환 → 이전 변경사항 보존 확인

### 롤백 계획
문제 발생 시:
```bash
# 코드 롤백
git revert HEAD

# 데이터 복구
rm -rf ~/Documents/Hoego/history
cp -r ~/Documents/Hoego/history_backup_YYYYMMDD ~/Documents/Hoego/history
```

---

## 💡 다음 세션 시작하기

### 1. 환경 준비
```bash
cd ~/Develop/Hoego
git status  # 현재 상태 확인
npm run dev # 개발 서버 시작
```

### 2. 문서 확인
```bash
# Phase 2 가이드 읽기
cat REFACTORING_PHASE2.md

# Phase 1 결과 확인
ls -la src/types/document.ts
ls -la src/store/documentStore.ts
ls -la src/hooks/useActiveDocument.ts
```

### 3. Phase 2 시작
```bash
# 체크리스트 확인
# □ 백업 완료?
# □ Phase 2 가이드 읽음?
# □ 테스트 계획 이해함?

# 첫 번째 수정 시작: 체크박스 토글
# (REFACTORING_PHASE2.md 참조)
```

---

## 📞 문의 및 지원

### 질문이 있다면
- Phase 1 API 사용법: `REFACTORING_PHASE1.md` 참조
- Phase 2 수정 방법: `REFACTORING_PHASE2.md` 참조
- 일반 코딩 가이드: `CLAUDE.md` 참조

### 문제 발생 시
1. 에러 메시지 전체 복사
2. 어떤 Phase의 어떤 단계인지 명시
3. 재현 방법 설명

---

## 📝 변경 이력

### 2025-11-21
- ✅ Phase 1 완료
  - `src/types/document.ts` 생성
  - `src/store/documentStore.ts` 생성
  - `src/hooks/useActiveDocument.ts` 생성
  - TypeScript 타입 체크 통과
  - 문서 작성 완료
- 🔜 Phase 2 준비 완료
  - 마스터 계획 문서 작성
  - Phase 2 가이드 작성
  - 다음 세션 준비 완료

---

**다음**: Phase 2 시작 전 [REFACTORING_PHASE2.md](./REFACTORING_PHASE2.md) 읽어주세요!
