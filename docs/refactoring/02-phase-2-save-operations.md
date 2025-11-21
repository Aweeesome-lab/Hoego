# Refactoring Phase 2: Save Operations Migration

**Status**: 🔜 Ready to Start
**Prerequisites**: ✅ Phase 1 Complete
**Risk Level**: Medium
**Estimated Time**: 1-2 hours

---

## 🎯 Phase 2 목표

5개의 데이터 손실 버그 지점을 **안전하게 수정**합니다.

### Before Phase 2
```typescript
// 5곳에서 이렇게 하드코딩
await saveTodayMarkdown(content);  // ❌ 항상 오늘 파일!
```

### After Phase 2
```typescript
// 모든 곳에서 자동으로 올바른 파일에 저장
const { saveActiveDocument } = useActiveDocument();
await saveActiveDocument(content);  // ✅ 자동 라우팅!
```

---

## ✅ 시작 전 체크리스트

### 1. 백업 (필수!)
```bash
# 데이터 백업
cp -r ~/Documents/Hoego/history ~/Documents/Hoego/history_backup_$(date +%Y%m%d)

# Git 커밋
cd ~/Develop/Hoego
git add .
git commit -m "refactor: phase 1 complete - before phase 2"
```

### 2. Phase 1 확인
```bash
# 파일 존재 확인
ls -la src/types/document.ts
ls -la src/store/documentStore.ts
ls -la src/hooks/useActiveDocument.ts

# 타입 체크
npm run type-check
```

### 3. 테스트 환경 준비
```bash
# 개발 서버 시작
npm run dev

# 앱이 정상 작동하는지 확인
# - 오늘 문서 로드 확인
# - 히스토리 사이드바 확인
# - 편집 기능 확인
```

---

## 🔧 수정 작업 (5단계)

### Step 1: 체크박스 토글 수정 ⭐ 가장 중요

**위치**: `src/hooks/useMarkdown.ts:186-240`

**현재 코드** (줄 222):
```typescript
const handleTaskCheckboxToggle = useCallback(
  async (listItem: { position?: Position | null }, nextChecked: boolean) => {
    // ... 로직 ...

    try {
      setIsSaving(true);
      await saveTodayMarkdown(nextContent);  // ❌ 문제!
      lastSavedRef.current = nextContent;
    } catch (error) {
      // ... 에러 처리 ...
    }
  },
  [/* dependencies */]
);
```

**수정할 코드**:
```typescript
const handleTaskCheckboxToggle = useCallback(
  async (listItem: { position?: Position | null }, nextChecked: boolean) => {
    // ... 로직 ...

    try {
      setIsSaving(true);
      // ✅ 변경: Active Document 사용
      const { saveActiveDocument } = useDocumentStore.getState();
      const result = await saveActiveDocument(nextContent);

      if (!result.success) {
        throw new Error(result.error);
      }

      lastSavedRef.current = nextContent;
    } catch (error) {
      // ... 에러 처리 ...
    }
  },
  [/* dependencies */]
);
```

**변경 사항**:
1. `saveTodayMarkdown` 제거
2. `useDocumentStore.getState().saveActiveDocument` 사용
3. 결과 체크 추가

**테스트**:
```
1. 오늘 문서에서 체크박스 클릭
   ✅ 오늘 파일 업데이트 확인

2. 히스토리 문서에서 체크박스 클릭
   ✅ 히스토리 파일 업데이트 확인
   ✅ 오늘 파일은 변경 안 됨 확인
```

---

### Step 2: 편집 자동 저장 수정

**위치**: `src/hooks/useMarkdown.ts:260-285`

**현재 코드** (줄 270):
```typescript
useEffect(() => {
  if (!isEditing) return;
  if (editingContent === lastSavedRef.current) return;

  if (debounceIdRef.current) {
    clearTimeout(debounceIdRef.current);
  }

  debounceIdRef.current = window.setTimeout(() => {
    void (async () => {
      try {
        setIsSaving(true);
        await saveTodayMarkdown(editingContent);  // ❌ 문제!
        lastSavedRef.current = editingContent;
      } catch (error) {
        // ...
      } finally {
        setIsSaving(false);
      }
    })();
  }, 2000);

  return () => {
    if (debounceIdRef.current) {
      clearTimeout(debounceIdRef.current);
    }
  };
}, [isEditing, editingContent, setIsSaving]);
```

**수정할 코드**:
```typescript
useEffect(() => {
  if (!isEditing) return;
  if (editingContent === lastSavedRef.current) return;

  if (debounceIdRef.current) {
    clearTimeout(debounceIdRef.current);
  }

  debounceIdRef.current = window.setTimeout(() => {
    void (async () => {
      try {
        setIsSaving(true);
        // ✅ 변경: Active Document 사용
        const { saveActiveDocument } = useDocumentStore.getState();
        const result = await saveActiveDocument(editingContent);

        if (!result.success) {
          throw new Error(result.error);
        }

        lastSavedRef.current = editingContent;
      } catch (error) {
        // ...
      } finally {
        setIsSaving(false);
      }
    })();
  }, 2000);

  return () => {
    if (debounceIdRef.current) {
      clearTimeout(debounceIdRef.current);
    }
  };
}, [isEditing, editingContent, setIsSaving]);
```

**필요한 import 추가** (파일 상단):
```typescript
import { useDocumentStore } from '@/store/documentStore';
```

**테스트**:
```
1. 오늘 문서 편집 → 2초 대기
   ✅ 자동 저장 확인

2. 히스토리 문서 편집 → 2초 대기
   ✅ 히스토리 파일에 자동 저장 확인
```

---

### Step 3: Cmd+E 저장 수정

**위치**: `src/apps/main/App.tsx:331-376`

**현재 코드** (줄 360):
```typescript
React.useEffect(() => {
  const handleKey = async (event: KeyboardEvent) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'e') {
      event.preventDefault();

      // ... 로직 ...

      try {
        setIsSaving(true);
        const newContent = /* ... */;
        await saveTodayMarkdown(newContent);  // ❌ 문제!
        // ...
      } catch (error) {
        // ...
      }
    }
  };

  window.addEventListener('keydown', handleKey);
  return () => window.removeEventListener('keydown', handleKey);
}, [/* dependencies */]);
```

**수정할 코드**:
```typescript
React.useEffect(() => {
  const handleKey = async (event: KeyboardEvent) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'e') {
      event.preventDefault();

      // ... 로직 ...

      try {
        setIsSaving(true);
        const newContent = /* ... */;

        // ✅ 변경: Active Document 사용
        const { saveActiveDocument } = useDocumentStore.getState();
        const result = await saveActiveDocument(newContent);

        if (!result.success) {
          throw new Error(result.error);
        }

        // ...
      } catch (error) {
        // ...
      }
    }
  };

  window.addEventListener('keydown', handleKey);
  return () => window.removeEventListener('keydown', handleKey);
}, [/* dependencies */]);
```

**필요한 import 추가** (파일 상단):
```typescript
import { useDocumentStore } from '@/store/documentStore';
```

**테스트**:
```
1. 오늘 문서에서 Cmd+E
   ✅ 오늘 파일 저장 확인

2. 히스토리에서 Cmd+E
   ✅ 히스토리 파일 저장 확인
```

---

### Step 4: ESC 저장 수정

**위치**: `src/apps/main/App.tsx:378-405`

**현재 코드** (줄 388):
```typescript
React.useEffect(() => {
  const handleKey = async (event: KeyboardEvent) => {
    if (event.key === 'Escape' && isEditing) {
      event.preventDefault();

      // ... 로직 ...

      try {
        setIsSaving(true);
        await saveTodayMarkdown(editingContent);  // ❌ 문제!
        // ...
      } catch (error) {
        // ...
      }
    }
  };

  window.addEventListener('keydown', handleKey);
  return () => window.removeEventListener('keydown', handleKey);
}, [/* dependencies */]);
```

**수정할 코드**:
```typescript
React.useEffect(() => {
  const handleKey = async (event: KeyboardEvent) => {
    if (event.key === 'Escape' && isEditing) {
      event.preventDefault();

      // ... 로직 ...

      try {
        setIsSaving(true);

        // ✅ 변경: Active Document 사용
        const { saveActiveDocument } = useDocumentStore.getState();
        const result = await saveActiveDocument(editingContent);

        if (!result.success) {
          throw new Error(result.error);
        }

        // ...
      } catch (error) {
        // ...
      }
    }
  };

  window.addEventListener('keydown', handleKey);
  return () => window.removeEventListener('keydown', handleKey);
}, [/* dependencies */]);
```

**테스트**:
```
1. 편집 모드에서 ESC
   ✅ 올바른 파일에 저장 확인
```

---

### Step 5: 히스토리 자동 저장 확인

**위치**: `src/apps/main/App.tsx:158-190`

**현재 코드** (줄 173-185):
```typescript
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
        await saveHistoryMarkdown(historyFile.path, markdownContent);  // ✅ 이미 올바름!
        // ...
      } catch (error) {
        // ...
      }
    })();
  }, 1000);
}, [currentHistoryDate, markdownContent, historyFiles, setIsSaving]);
```

**작업**: 이 코드는 **이미 올바르게** 작동하고 있습니다!

하지만 일관성을 위해 나중에(Phase 3에서) Active Document로 전환할 예정입니다.

**현재는**: 그대로 두고 확인만 합니다.

**테스트**:
```
1. 히스토리 문서 열기
2. 내용 편집
3. 1초 대기
   ✅ 히스토리 파일에 저장되는지 확인
```

---

## 🧪 통합 테스트

모든 수정 완료 후 **반드시** 실행:

### Test Scenario 1: 오늘 문서 편집
```
1. 앱 실행 (오늘 문서 자동 로드)
2. 체크박스 추가: "- [ ] 테스트 항목"
3. 체크박스 클릭 → 체크
   ✅ ~/Documents/Hoego/history/20251121.md 열어서 체크 확인

4. 텍스트 편집: "테스트 내용"
5. Cmd+E 누르기
   ✅ 파일에서 "테스트 내용" 확인

6. 편집 모드 진입
7. 추가 편집
8. ESC 누르기
   ✅ 변경사항 저장 확인
```

### Test Scenario 2: 히스토리 편집
```
1. 사이드바에서 과거 날짜 클릭 (예: 11월 18일)
2. 히스토리 문서 로드 확인
3. 체크박스 클릭
   ✅ ~/Documents/Hoego/history/20251118.md 열어서 변경 확인
   ✅ 20251121.md는 변경 안 됨 확인!

4. Cmd+E로 저장
   ✅ 20251118.md에 저장 확인
   ✅ 20251121.md 변경 안 됨 확인!
```

### Test Scenario 3: 문서 전환
```
1. 오늘 문서에서 "오늘 내용" 입력
2. Cmd+E 저장
3. 히스토리 (11월 18일) 선택
4. "히스토리 내용" 입력
5. Cmd+E 저장
6. 다시 "오늘" 클릭

확인:
✅ 20251121.md에 "오늘 내용" 있음
✅ 20251118.md에 "히스토리 내용" 있음
✅ 서로 섞이지 않음!
```

---

## 🚨 문제 발생 시

### Type Error 발생
```bash
# useDocumentStore import 확인
grep "useDocumentStore" src/hooks/useMarkdown.ts
grep "useDocumentStore" src/apps/main/App.tsx

# 타입 체크
npm run type-check
```

### 저장이 안 됨
```typescript
// saveActiveDocument 결과 확인
const result = await saveActiveDocument(content);
console.log('Save result:', result);  // success: false면 error 확인
```

### 여전히 잘못된 파일에 저장됨
```typescript
// Active Document 상태 확인
const { activeDocument } = useDocumentStore.getState();
console.log('Active document:', activeDocument);
// type이 'today'인지 'history'인지 확인
```

---

## 📝 완료 후 체크리스트

### 코드 검증
- [ ] TypeScript 타입 에러 없음
- [ ] 모든 import 정상 작동
- [ ] 콘솔 에러 없음

### 기능 검증
- [ ] 오늘 문서 체크박스 토글 → 오늘 파일에 저장
- [ ] 히스토리 문서 체크박스 토글 → 히스토리 파일에 저장
- [ ] 오늘 문서 Cmd+E → 오늘 파일에 저장
- [ ] 히스토리 문서 Cmd+E → 히스토리 파일에 저장
- [ ] 편집 모드 ESC → 올바른 파일에 저장
- [ ] 문서 전환 시 각각 올바른 파일에 저장

### 데이터 검증
- [ ] 오늘 파일이 히스토리 내용으로 덮어씌워지지 않음
- [ ] 히스토리 파일이 오늘 내용으로 덮어씌워지지 않음
- [ ] 기존 데이터 손실 없음

---

## 💾 커밋

모든 테스트 통과 후:

```bash
git add .
git commit -m "refactor(phase-2): migrate save operations to Active Document

- Fix checkbox toggle to save to correct file
- Fix edit auto-save to save to correct file
- Fix Cmd+E save to save to correct file
- Fix ESC save to save to correct file
- All save operations now use saveActiveDocument()

Fixes data loss bug where editing history would overwrite today's file.

Tested:
- Today document editing ✓
- History document editing ✓
- Document switching ✓
- All save paths verified ✓

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## 🎯 다음 단계

Phase 2 완료 후:
1. [REFACTORING.md](./REFACTORING.md) 업데이트 (진행률 50%)
2. Phase 3 시작: View Switching Refactor

---

## 📞 도움말

### API 레퍼런스
```typescript
// Document Store 사용법
const { saveActiveDocument } = useDocumentStore.getState();
const result = await saveActiveDocument(content);

// 결과 타입
interface SaveResult {
  success: boolean;
  error?: string;
  timestamp: number;
}
```

### 관련 문서
- [Phase 1: Foundation](./REFACTORING_PHASE1.md)
- [Master Plan](./REFACTORING.md)
- [Coding Guidelines](./CLAUDE.md)

---

**시작 준비 완료!** 🚀

백업 확인 후 Step 1부터 차근차근 진행하세요.
