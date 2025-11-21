# 상태 관리 (Zustand)

## 스토어 구조

```typescript
// src/store/appStore.ts
import { create } from 'zustand';

interface AppStore {
  // View 상태
  viewMode: 'dump' | 'feedback' | 'retrospect';
  setViewMode: (mode: AppStore['viewMode']) => void;

  // 현재 작업 중인 데이터
  currentDump: DumpData | null;
  setCurrentDump: (dump: DumpData | null) => void;

  currentFeedback: FeedbackData | null;
  setCurrentFeedback: (feedback: FeedbackData | null) => void;

  currentRetrospect: RetrospectData | null;
  setCurrentRetrospect: (retrospect: RetrospectData | null) => void;

  // UI 상태
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  viewMode: 'dump',
  setViewMode: (mode) => set({ viewMode: mode }),

  currentDump: null,
  setCurrentDump: (dump) => set({ currentDump: dump }),

  currentFeedback: null,
  setCurrentFeedback: (feedback) => set({ currentFeedback: feedback }),

  currentRetrospect: null,
  setCurrentRetrospect: (retrospect) => set({ currentRetrospect: retrospect }),

  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}));
```

## 사용 예시

```typescript
function DumpPanel() {
  const { currentDump, setCurrentDump } = useAppStore();

  const handleSave = async (content: string) => {
    const id = await tauriAPI.saveDump(content);
    setCurrentDump({ id, content, timestamp: nowUTC() });
  };

  return <div>{/* ... */}</div>;
}
```

---
