# Refactoring Phase 4: Cleanup & Finalization

**Status**: 🔜 Ready to Start
**Prerequisites**: ✅ Phase 1-3 Complete
**Risk Level**: Low
**Estimated Time**: 1 hour

---

## 🎯 Phase 4 목표

레거시 코드 제거 및 최종 정리로 리팩토링 완료

### Before Phase 4
```typescript
// App.tsx에 중복 로직 존재
React.useEffect(() => {
  // 히스토리 자동 저장 (중복!)
  await saveHistoryMarkdown(historyFile.path, markdownContent);
}, [currentHistoryDate, markdownContent]);

// useMarkdown.ts에 사용하지 않는 import
import { saveTodayMarkdown } from '@/lib/tauri';  // ❌ 더 이상 사용 안 함
```

### After Phase 4
```typescript
// 깔끔한 코드 - 중복 제거
// useMarkdown의 자동 저장이 saveActiveDocument()를 사용
// 별도의 히스토리 자동 저장 로직 불필요

// 정리된 import
import { getTodayMarkdown } from '@/lib/tauri';  // ✅ 실제 사용하는 것만
```

---

## 🗑️ 제거 작업

### Task 1: 레거시 히스토리 자동 저장 제거

**위치**: `src/apps/main/App.tsx:158-190`

**제거할 코드**:
```typescript
// 히스토리 편집 시 자동 저장
React.useEffect(() => {
  if (!currentHistoryDate || !markdownContent) return;

  const historyFile = historyFiles.find(f => f.date === currentHistoryDate);
  if (!historyFile) return;

  if (historyDebounceIdRef.current) {
    clearTimeout(historyDebounceIdRef.current);
  }

  historyDebounceIdRef.current = window.setTimeout(() => {
    void (async () => {
      try {
        setIsSaving(true);
        await saveHistoryMarkdown(historyFile.path, markdownContent);
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('[hoego] 히스토리 저장 실패:', error);
        }
        toast.error('히스토리 저장에 실패했습니다.');
      } finally {
        setIsSaving(false);
      }
    })();
  }, 1000);

  return () => {
    if (historyDebounceIdRef.current) {
      clearTimeout(historyDebounceIdRef.current);
    }
  };
}, [currentHistoryDate, markdownContent, historyFiles, setIsSaving]);
```

**제거 이유**:
- `useMarkdown`의 편집 자동 저장이 이미 `saveActiveDocument()`를 사용
- `saveActiveDocument()`가 자동으로 히스토리 파일에 저장
- 이 로직은 **중복**이며 불필요

**제거 후**:
```typescript
// 이 전체 useEffect를 삭제
// (아무것도 남지 않음 - 완전 제거)
```

**검증**:
1. 히스토리 문서 편집 → 자동 저장 확인 (useMarkdown이 처리)
2. 오늘 문서 편집 → 자동 저장 확인
3. 문서 전환 → 이전 변경사항 보존 확인

---

### Task 2: Import 정리

#### 2.1 App.tsx Import 정리

**위치**: `src/apps/main/App.tsx:22-28`

**현재 코드**:
```typescript
import {
  hideOverlayWindow,
  appendHistoryEntry,
  onHistoryUpdated,
  saveHistoryMarkdown,  // ❌ 더 이상 직접 사용 안 함
  saveMiniModePosition,
} from '@/lib/tauri';
```

**수정 후**:
```typescript
import {
  hideOverlayWindow,
  appendHistoryEntry,
  onHistoryUpdated,
  saveMiniModePosition,
} from '@/lib/tauri';
```

**제거 이유**: `saveHistoryMarkdown`을 더 이상 직접 호출하지 않음

#### 2.2 useMarkdown.ts Import 정리

**위치**: `src/hooks/useMarkdown.ts:6`

**현재 코드**:
```typescript
import { getTodayMarkdown, saveTodayMarkdown } from '@/lib/tauri';
```

**수정 후**:
```typescript
import { getTodayMarkdown } from '@/lib/tauri';
```

**제거 이유**: `saveTodayMarkdown`을 더 이상 사용하지 않음 (모든 저장이 `saveActiveDocument()` 사용)

---

### Task 3: historyDebounceIdRef 제거

**위치**: `src/apps/main/App.tsx`

레거시 히스토리 자동 저장에서만 사용하던 ref이므로 함께 제거:

**제거 대상**:
```typescript
const historyDebounceIdRef = React.useRef<number | null>(null);
```

**검증**: 더 이상 `historyDebounceIdRef`를 참조하는 코드가 없는지 확인

---

## 📝 문서 업데이트

### 1. REFACTORING.md 최종 업데이트

**Phase 4 섹션**에 완료 상태 추가:
```markdown
### ✅ Phase 4: Cleanup (완료)

**목표**: 레거시 코드 제거
**상태**: ✅ 2025-11-21 완료
**리스크**: 낮음 (단순 정리)

**제거 항목**:
- ✅ 레거시 히스토리 자동 저장 로직
- ✅ 사용하지 않는 import 정리
- ✅ historyDebounceIdRef 제거

**커밋**: `<commit-hash>`
```

**진행률 업데이트**:
```markdown
┌──────────────────────────────────────────────────┐
│ Phase 1: Foundation          ████████████ 100%  │
│ Phase 2: Save Migration      ████████████ 100%  │
│ Phase 3: View Switching      ████████████ 100%  │
│ Phase 4: Cleanup             ████████████ 100%  │
├──────────────────────────────────────────────────┤
│ Total Progress:              ████████████ 100%  │
└──────────────────────────────────────────────────┘
```

### 2. README.md 업데이트 (선택)

Active Document 패턴 섹션 추가:
```markdown
## Architecture

### Active Document Pattern

Hoego uses an Active Document pattern for state management:

- **Single Source of Truth**: `documentStore` tracks the currently active document
- **Automatic Routing**: All save operations automatically route to the correct file
- **Type Safety**: TypeScript ensures correct document type handling
- **Centralized Loading**: Document loading is centralized in the store

See [REFACTORING.md](./REFACTORING.md) for implementation details.
```

---

## ✅ 완료 체크리스트

### 코드 정리
- [ ] 레거시 히스토리 자동 저장 useEffect 제거
- [ ] App.tsx import 정리 (saveHistoryMarkdown 제거)
- [ ] useMarkdown.ts import 정리 (saveTodayMarkdown 제거)
- [ ] historyDebounceIdRef 제거
- [ ] TypeScript 타입 에러 없음
- [ ] 빌드 성공

### 기능 검증
- [ ] 오늘 문서 편집 → 자동 저장 확인
- [ ] 히스토리 문서 편집 → 자동 저장 확인
- [ ] 문서 전환 → 이전 변경사항 보존 확인
- [ ] 체크박스 토글 → 올바른 파일에 저장
- [ ] Cmd+E, ESC → 올바른 파일에 저장

### 문서 업데이트
- [ ] REFACTORING.md Phase 4 완료 표시
- [ ] REFACTORING.md 진행률 100% 업데이트
- [ ] README.md 업데이트 (선택)

---

## 💾 커밋

모든 작업 완료 후:

```bash
git add .
git commit -m "refactor(phase-4): cleanup legacy code

- Remove legacy history auto-save logic (duplicate)
- Remove unused imports (saveHistoryMarkdown, saveTodayMarkdown)
- Remove historyDebounceIdRef (no longer needed)
- All save operations now use saveActiveDocument()

Benefits:
- Cleaner codebase with no duplicate logic
- Single source of truth for document operations
- Better maintainability

Tested:
- Today document editing ✓
- History document editing ✓
- Document switching ✓
- All auto-save paths verified ✓

🎉 Refactoring Complete: 100%

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## 🎉 리팩토링 완료!

Phase 4 완료 후:
- ✅ 모든 데이터 손실 버그 수정
- ✅ Active Document 패턴 완전 적용
- ✅ 레거시 코드 제거
- ✅ 깔끔한 코드베이스

**다음 단계**: 새로운 기능 추가 또는 추가 개선 작업

---

## 📞 도움말

### 제거할 코드 찾기
```bash
# 레거시 히스토리 자동 저장 위치
grep -n "히스토리 편집 시 자동 저장" src/apps/main/App.tsx

# historyDebounceIdRef 사용 확인
grep -n "historyDebounceIdRef" src/apps/main/App.tsx
```

### 관련 문서
- [Master Plan](./REFACTORING.md)
- [Phase 1: Foundation](./REFACTORING_PHASE1.md)
- [Phase 2: Save Operations](./REFACTORING_PHASE2.md)
- [Next Session Guide](./NEXT_SESSION.md)

---

**마지막 단계입니다!** 🚀
