# Phase 5: 상태 관리 최적화 🗄️

**우선순위**: 🟢 LOW
**예상 소요**: 3-4 시간
**상태**: ⏳ 대기 중

---

## 📋 목표

Zustand 스토어 정리 및 최적화:
- 명확한 도메인별 스토어 분리
- 효율적인 퍼시스턴스
- React Query 도입 검토
- 불필요한 리렌더링 방지

---

## 📊 진행률

**전체**: 0% (0/8)

---

## 🗃️ 5.1 스토어 구조 재설계 (0/4)

### 작업 목록

- [ ] appStore.ts 분석
- [ ] 도메인별 스토어 분리 고려
- [ ] 퍼시스턴스 전략
- [ ] 미들웨어 활용

### Zustand 스토어 분리

```typescript
// store/ui-store.ts
import { create } from 'zustand';

interface UIStore {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  theme: 'light',
  sidebarOpen: true,
  setTheme: (theme) => set({ theme }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));

// store/editor-store.ts
interface EditorStore {
  content: string;
  isDirty: boolean;
  setContent: (content: string) => void;
  reset: () => void;
}

export const useEditorStore = create<EditorStore>((set) => ({
  content: '',
  isDirty: false,
  setContent: (content) => set({ content, isDirty: true }),
  reset: () => set({ content: '', isDirty: false }),
}));
```

---

## 🔄 5.2 React Query 도입 검토 (0/4)

### 작업 목록

- [ ] 서버/클라이언트 상태 분리
- [ ] 캐싱 전략
- [ ] 낙관적 업데이트
- [ ] 백그라운드 동기화

### React Query 예시

```typescript
// hooks/useDumps.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoke } from '@/lib/tauri';

export function useDumps() {
  return useQuery({
    queryKey: ['dumps'],
    queryFn: () => invoke('load_dumps', {}),
  });
}

export function useSaveDump() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DumpFormData) => invoke('save_dump', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dumps'] });
    },
  });
}
```

---

## ✅ 완료 체크리스트

- [ ] 스토어가 도메인별로 분리되었는가?
- [ ] 불필요한 전역 상태가 제거되었는가?
- [ ] React Query가 적절히 도입되었는가?
- [ ] 캐싱 전략이 효율적인가?

---

**이전 Phase**: [Phase 4: 폼 관리 & 검증](./phase-4-form-validation.md)
**다음 Phase**: [Phase 6: 날짜/시간 처리 통일](./phase-6-datetime-handling.md)
