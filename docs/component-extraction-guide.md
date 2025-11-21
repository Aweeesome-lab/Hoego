# 컴포넌트 추출 가이드

> React 컴포넌트를 작고 재사용 가능한 단위로 분리하는 실용적 가이드

---

## 목차

1. [언제 분리해야 하나?](#언제-분리해야-하나)
2. [분리 프로세스](#분리-프로세스)
3. [컴포넌트 작성 패턴](#컴포넌트-작성-패턴)
4. [실전 예제](#실전-예제)
5. [체크리스트](#체크리스트)

---

## 언제 분리해야 하나?

### 🟢 분리 권장 (High Priority)

**크기 기준:**
- ✅ **200줄 이상** - 무조건 분리 검토
- ✅ **150줄 이상** + 복잡한 로직 - 분리 강력 권장
- ✅ **100줄 이상** + 여러 책임 - 분리 고려

**재사용 기준:**
- ✅ **2곳 이상에서 사용** - 즉시 분리
- ✅ **향후 재사용 가능성 높음** - 분리 고려

**책임 기준:**
- ✅ **독립적인 기능** (로그인 폼, 검색 바 등)
- ✅ **복잡한 상태 관리** (여러 useState, useEffect)
- ✅ **외부 의존성** (API 호출, localStorage 등)

**복잡도 기준:**
- ✅ **중첩된 조건문 3단계 이상**
- ✅ **map 안에 복잡한 JSX**
- ✅ **5개 이상의 props**

### 🟡 분리 선택 (Optional)

- 🔶 50-100줄 사이 + 명확한 책임
- 🔶 한 곳에서만 사용하지만 복잡한 로직
- 🔶 테스트가 필요한 비즈니스 로직 포함

### 🔴 분리 불필요 (Keep as is)

- ❌ **50줄 이하** 단순 헬퍼 컴포넌트
- ❌ **한 곳에서만 사용** + 부모와 강하게 결합
- ❌ **단순 스타일 래퍼** (`<div className="...">{children}</div>`)

---

## 분리 프로세스

### Step 1: 분석

```typescript
// ❌ Before: 거대한 App.tsx (500+ lines)
export function App() {
  // 30+ useState
  // 20+ useEffect
  // 복잡한 비즈니스 로직
  // 많은 이벤트 핸들러
  // 거대한 JSX (200+ lines)
}
```

**질문하기:**
1. 이 컴포넌트가 하는 일이 무엇인가?
2. 독립적인 기능 단위는 무엇인가?
3. 어떤 부분이 재사용될 수 있는가?
4. 상태와 로직을 어떻게 분리할 수 있는가?

### Step 2: 책임 분리 계획

**예시: App.tsx 분석**

```yaml
현재 책임:
  - 레이아웃 관리 (header, sidebar, footer)
  - Dump 패널 (일지 작성)
  - Feedback 패널 (AI 피드백)
  - Retrospect 패널 (회고)
  - 히스토리 섹션
  - 전역 상태 관리
  - 테마 관리
  - 단축키 처리

분리 계획:
  유지: App.tsx
    - 전체 레이아웃 구조
    - 전역 상태 초기화
    - 라우팅 (있다면)

  추출:
    - components/layout/AppLayout.tsx
    - components/panels/DumpPanel.tsx
    - components/panels/FeedbackPanel.tsx
    - components/panels/RetrospectPanel.tsx
    - components/history/HistorySection.tsx
    - hooks/useTheme.ts
    - hooks/useAppShortcuts.ts
```

### Step 3: 추출 순서

**권장 순서:**
1. **UI 컴포넌트** (버튼, 입력, 카드 등) - 의존성 없음
2. **레이아웃 컴포넌트** (Header, Sidebar, Footer)
3. **패널/섹션 컴포넌트** (큰 기능 단위)
4. **Custom Hooks** (상태 로직)
5. **Services** (비즈니스 로직)

### Step 4: 실제 추출

#### 4.1 컴포넌트 추출

```typescript
// ❌ Before: App.tsx
export function App() {
  const [dumpContent, setDumpContent] = useState('');

  const handleDumpSave = async () => {
    try {
      await invoke('save_dump', { content: dumpContent });
      toast.success('저장 완료');
    } catch (error) {
      toast.error('저장 실패');
    }
  };

  return (
    <div className="app">
      <div className="dump-panel">
        <textarea
          value={dumpContent}
          onChange={(e) => setDumpContent(e.target.value)}
        />
        <button onClick={handleDumpSave}>저장</button>
      </div>
      {/* 나머지 200줄... */}
    </div>
  );
}
```

```typescript
// ✅ After 1: components/panels/DumpPanel.tsx
interface DumpPanelProps {
  initialContent?: string;
  onSave: (content: string) => Promise<void>;
}

/**
 * 일지 작성 패널 - 사용자가 일일 일지를 작성하는 컴포넌트
 * @param initialContent - 초기 일지 내용 (선택)
 * @param onSave - 저장 시 호출되는 비동기 함수
 */
export function DumpPanel({ initialContent = '', onSave }: DumpPanelProps) {
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(content);
      toast.success('저장 완료');
    } catch (error) {
      toast.error('저장 실패');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="dump-panel">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={isSaving}
      />
      <button onClick={handleSave} disabled={isSaving}>
        {isSaving ? '저장 중...' : '저장'}
      </button>
    </div>
  );
}
```

```typescript
// ✅ After 2: App.tsx (간소화)
import { DumpPanel } from '@/components/panels/DumpPanel';
import { useDump } from '@/hooks/useDump';

export function App() {
  const { saveDump } = useDump();

  return (
    <div className="app">
      <DumpPanel onSave={saveDump} />
      {/* 나머지 컴포넌트들... */}
    </div>
  );
}
```

#### 4.2 Custom Hook 추출

```typescript
// ✅ hooks/useDump.ts
import { invoke } from '@tauri-apps/api';
import type { DumpData } from '@/types/dump';

/**
 * 일지 관련 로직을 관리하는 Hook
 */
export function useDump() {
  const saveDump = async (content: string): Promise<void> => {
    const data: DumpData = {
      content,
      timestamp: new Date().toISOString(),
    };

    await invoke('save_dump', { data });
  };

  const loadDumps = async (): Promise<DumpData[]> => {
    return await invoke('load_dumps');
  };

  return {
    saveDump,
    loadDumps,
  };
}
```

---

## 컴포넌트 작성 패턴

### 패턴 1: 표준 컴포넌트 구조

```typescript
// 1. Imports
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useSettings } from '@/hooks/useSettings';
import type { Settings } from '@/types/settings';

// 2. Types (컴포넌트 전용)
interface SettingsPanelProps {
  initialSettings: Settings;
  onSave: (settings: Settings) => Promise<void>;
}

// 3. Constants (컴포넌트 전용)
const DEFAULT_THEME = 'light';

// 4. Main Component
/**
 * 설정 패널 - 애플리케이션 설정을 관리하는 컴포넌트
 */
export function SettingsPanel({ initialSettings, onSave }: SettingsPanelProps) {
  // 4-1. Hooks
  const [settings, setSettings] = useState(initialSettings);
  const { theme, setTheme } = useSettings();

  // 4-2. Event Handlers
  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
  };

  const handleSave = async () => {
    await onSave(settings);
  };

  // 4-3. Effects
  useEffect(() => {
    // 초기화 로직
  }, []);

  // 4-4. Render Helpers (선택)
  const renderThemeSelector = () => (
    <select value={theme} onChange={(e) => handleThemeChange(e.target.value)}>
      <option value="light">라이트</option>
      <option value="dark">다크</option>
    </select>
  );

  // 4-5. Main Render
  return (
    <div className="settings-panel">
      {renderThemeSelector()}
      <Button onClick={handleSave}>저장</Button>
    </div>
  );
}

// 5. Sub-components (필요시만 export)
function ThemePreview({ theme }: { theme: string }) {
  return <div className={`preview-${theme}`}>미리보기</div>;
}
```

### 패턴 2: Composition Pattern

```typescript
// ✅ Good: 컴포지션으로 유연성 확보
export function Card({ children }: { children: ReactNode }) {
  return <div className="card">{children}</div>;
}

export function CardHeader({ children }: { children: ReactNode }) {
  return <header className="card-header">{children}</header>;
}

export function CardBody({ children }: { children: ReactNode }) {
  return <div className="card-body">{children}</div>;
}

// 사용
<Card>
  <CardHeader>제목</CardHeader>
  <CardBody>내용</CardBody>
</Card>
```

### 패턴 3: Render Props Pattern

```typescript
// ✅ 유연한 렌더링 제어
interface FileListProps {
  files: File[];
  renderItem: (file: File) => ReactNode;
  renderEmpty?: () => ReactNode;
}

export function FileList({ files, renderItem, renderEmpty }: FileListProps) {
  if (files.length === 0) {
    return renderEmpty?.() ?? <EmptyState />;
  }

  return (
    <ul>
      {files.map(file => (
        <li key={file.id}>{renderItem(file)}</li>
      ))}
    </ul>
  );
}

// 사용
<FileList
  files={myFiles}
  renderItem={(file) => (
    <div>
      <strong>{file.name}</strong>
      <span>{file.size}</span>
    </div>
  )}
/>
```

---

## 실전 예제

### 예제 1: 큰 Settings 컴포넌트 분리

**Before:**
```typescript
// settings.tsx (500+ lines)
export function Settings() {
  // 30+ useState for different settings
  // Complex form handling
  // Multiple sections (General, LLM, Prompt, etc.)

  return (
    <div>
      {/* General Settings - 100 lines */}
      {/* LLM Settings - 150 lines */}
      {/* Prompt Settings - 100 lines */}
      {/* Template Settings - 150 lines */}
    </div>
  );
}
```

**After:**
```typescript
// settings.tsx (50 lines)
export function Settings() {
  return (
    <div className="settings-container">
      <GeneralSettings />
      <LLMSettings />
      <PromptSettings />
      <TemplateSettings />
    </div>
  );
}

// components/GeneralSettings.tsx (80 lines)
export function GeneralSettings() { /* ... */ }

// components/LLMSettings.tsx (120 lines)
export function LLMSettings() { /* ... */ }

// components/PromptSettings.tsx (80 lines)
export function PromptSettings() { /* ... */ }

// components/TemplateSettings.tsx (120 lines)
export function TemplateSettings() { /* ... */ }
```

### 예제 2: 복잡한 리스트 컴포넌트 분리

**Before:**
```typescript
// HistoryPanel.tsx (300 lines)
export function HistoryPanel() {
  // State for filtering, sorting, pagination
  // Complex file list rendering with inline logic

  return (
    <div>
      {/* Search/Filter UI - 50 lines */}
      {/* File List - 200 lines with complex logic */}
      {/* Pagination - 50 lines */}
    </div>
  );
}
```

**After:**
```typescript
// HistoryPanel.tsx (80 lines)
export function HistoryPanel() {
  const { files, filters, setFilters } = useHistoryFiles();

  return (
    <div>
      <HistoryHeader filters={filters} onFilterChange={setFilters} />
      <HistoryFileList files={files} />
      <HistoryPagination />
    </div>
  );
}

// components/HistoryHeader.tsx (60 lines)
// components/HistoryFileList.tsx (100 lines)
// components/HistoryFileItem.tsx (50 lines)
// components/HistoryPagination.tsx (40 lines)
// hooks/useHistoryFiles.ts (80 lines)
```

---

## 체크리스트

### ✅ 추출 전 확인사항

- [ ] 컴포넌트가 150줄 이상인가?
- [ ] 여러 책임을 가지고 있는가?
- [ ] 재사용 가능한 부분이 있는가?
- [ ] 테스트하기 어려운가?
- [ ] Props가 5개 이상인가?

### ✅ 추출 후 확인사항

- [ ] JSDoc 주석이 작성되었는가?
- [ ] Props 타입이 명확한가?
- [ ] 파일 크기가 200줄 이하인가?
- [ ] 단일 책임 원칙을 따르는가?
- [ ] Import 순서가 올바른가?
- [ ] 컴포넌트 내부 구조가 표준을 따르는가?
  - [ ] Hooks → Handlers → Effects → Render
- [ ] 불필요한 의존성이 없는가?
- [ ] 에러 처리가 적절한가?

### ✅ 파일 구조 확인

- [ ] 적절한 디렉토리에 위치하는가?
  - `components/ui/` - 재사용 UI
  - `components/layout/` - 레이아웃
  - `components/panels/` - 기능 패널
  - `apps/[app-name]/components/` - 앱 전용
- [ ] 파일명이 명확한가? (1-2 단어 선호)
- [ ] 폴더 depth가 2단계 이하인가?

---

## 마무리 팁

### 🎯 실용적 접근

1. **완벽함보다 진행**: 처음부터 완벽하게 분리하려 하지 말고, 점진적으로 개선
2. **측정 가능한 개선**: "더 읽기 쉬워졌는가?"를 기준으로
3. **과도한 분리 지양**: 10줄 컴포넌트를 별도 파일로 만들 필요 없음
4. **팀 컨벤션 우선**: 이 가이드는 출발점, 팀 상황에 맞게 조정

### 🚫 피해야 할 실수

1. **과도한 추상화**: 2곳에서만 사용되는데 과도하게 일반화
2. **Props Drilling 지옥**: 너무 많은 depth로 props 전달
3. **거대한 파일 방치**: "나중에 리팩토링"은 절대 오지 않음
4. **무분별한 분리**: 한 파일 보기 위해 10개 파일 열어야 함

---

**참고 문서:**
- [컴포넌트 작성 규칙](./architecture/컴포넌트-작성-규칙.md)
- [프로젝트 구조](./architecture/프로젝트-구조.md)
- [리팩토링 계획](./refactoring-plan.md)
- [리팩토링 진행 상황](./refactoring-progress.md)

---

**최종 수정일**: 2025-11-21
