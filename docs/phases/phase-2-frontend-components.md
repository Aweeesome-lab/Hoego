# Phase 2: Frontend 컴포넌트 추출 ⚛️

**우선순위**: 🔴 HIGH
**예상 소요**: 5-7 시간
**상태**: ⏳ 대기 중 (Phase 1 완료 후)

---

## 📋 목표

큰 React 컴포넌트를 작고 재사용 가능한 단위로 분리하여:
- 200줄 이하의 관리 가능한 컴포넌트
- 명확한 단일 책임
- 재사용 가능한 UI 라이브러리
- 테스트 가능한 구조

---

## 📊 진행률

**전체**: 0% (0/20)

---

## 🎯 2.1 Main App 컴포넌트 분리 (0/4)

### 현재 상황 분석

```bash
# App.tsx 크기 확인
wc -l src/apps/main/App.tsx

# 복잡도 분석 (대략)
# - useState 개수
# - useEffect 개수
# - 이벤트 핸들러 개수
# - JSX 라인 수
```

### 작업 목록

- [ ] **App.tsx 분석 및 분리 계획 수립**
  - 현재 책임 목록 작성
  - 추출할 컴포넌트 식별
  - 의존성 그래프 작성

- [ ] **레이아웃 컴포넌트 추출**
  - `components/layout/AppLayout.tsx` 생성
  - Header, Sidebar, Footer 포함
  - 전체 페이지 구조 관리

- [ ] **패널 컴포넌트 분리**
  - `components/panels/DumpPanel.tsx` - 일지 작성
  - `components/panels/FeedbackPanel.tsx` - AI 피드백
  - `components/panels/RetrospectPanel.tsx` - 회고

- [ ] **상태 관리 로직 hooks로 추출**
  - `hooks/useDump.ts` - 일지 관련 로직
  - `hooks/useFeedback.ts` - 피드백 관련 로직
  - `hooks/useRetrospect.ts` - 회고 관련 로직

### 실행 예시

**Before - App.tsx (거대한 컴포넌트):**

```typescript
// src/apps/main/App.tsx (500+ lines)
export function App() {
  // 30+ useState
  const [dumpContent, setDumpContent] = useState('');
  const [feedbackContent, setFeedbackContent] = useState('');
  const [retrospectContent, setRetrospectContent] = useState('');
  // ... 27 more states

  // 20+ useEffect
  useEffect(() => { /* ... */ }, []);
  // ... 19 more effects

  // 많은 이벤트 핸들러
  const handleDumpSave = async () => { /* ... */ };
  const handleFeedbackGenerate = async () => { /* ... */ };
  // ... 30 more handlers

  // 거대한 JSX (200+ lines)
  return (
    <div className="app">
      {/* Header - 50 lines */}
      {/* Dump Panel - 80 lines */}
      {/* Feedback Panel - 80 lines */}
      {/* Retrospect Panel - 80 lines */}
      {/* Footer - 30 lines */}
    </div>
  );
}
```

**After - App.tsx (간소화):**

```typescript
// src/apps/main/App.tsx (80 lines)
import { AppLayout } from '@/components/layout/AppLayout';
import { DumpPanel } from '@/components/panels/DumpPanel';
import { FeedbackPanel } from '@/components/panels/FeedbackPanel';
import { RetrospectPanel } from '@/components/panels/RetrospectPanel';
import { useDump } from '@/hooks/useDump';
import { useFeedback } from '@/hooks/useFeedback';
import { useRetrospect } from '@/hooks/useRetrospect';

export function App() {
  const dump = useDump();
  const feedback = useFeedback();
  const retrospect = useRetrospect();

  return (
    <AppLayout>
      <DumpPanel
        content={dump.content}
        onContentChange={dump.setContent}
        onSave={dump.save}
        isSaving={dump.isSaving}
      />
      <FeedbackPanel
        content={feedback.content}
        onGenerate={feedback.generate}
        isGenerating={feedback.isGenerating}
      />
      <RetrospectPanel
        content={retrospect.content}
        onGenerate={retrospect.generate}
        isGenerating={retrospect.isGenerating}
      />
    </AppLayout>
  );
}
```

---

## ⚙️ 2.2 Settings 컴포넌트 분리 (0/4)

### 현재 파일 분석

```bash
# Settings 관련 파일 확인
ls -lh src/apps/settings/
ls -lh src/apps/settings/components/
```

### 작업 목록

- [ ] **settings.tsx 분석**
  - 현재 구조 파악
  - 분리 가능한 섹션 식별
  - props drilling 문제 확인

- [ ] **각 설정 섹션을 독립 컴포넌트로 분리**
  - `GeneralSettings.tsx` 정리 (이미 존재)
  - `LLMSettings.tsx` 정리 (이미 존재)
  - `CloudLLMSettings.tsx` 정리 (이미 존재)
  - `PromptSettings.tsx` 정리 (이미 존재)
  - `RetrospectiveTemplateSettings.tsx` 정리 (이미 존재)

- [ ] **차트 컴포넌트 최적화**
  - `charts/ProductivityChart.tsx` 검토
  - `charts/DailyTrendChart.tsx` 검토
  - `charts/CategoryPieChart.tsx` 검토
  - 중복 로직 제거

- [ ] **폼 관리 로직 hooks로 추출**
  - `hooks/useSettingsForm.ts` 생성
  - React Hook Form 통합
  - Zod 검증 추가

### Settings 구조 개선

**Before:**

```typescript
// settings.tsx (300+ lines)
export function Settings() {
  // 모든 설정 상태
  const [general, setGeneral] = useState({...});
  const [llm, setLLM] = useState({...});
  const [cloud, setCloud] = useState({...});

  // 모든 핸들러
  const handleGeneralChange = () => {...};
  const handleLLMChange = () => {...};

  return (
    <div>
      {/* 모든 설정 섹션이 한 파일에 */}
    </div>
  );
}
```

**After:**

```typescript
// settings.tsx (100 lines)
export function Settings() {
  return (
    <SettingsLayout>
      <GeneralSettings />
      <LLMSettings />
      <CloudLLMSettings />
      <PromptSettings />
      <TemplateSettings />
      <WeeklyDashboard />
    </SettingsLayout>
  );
}

// 각 섹션은 독립 파일로
// components/GeneralSettings.tsx
// components/LLMSettings.tsx
// ...
```

---

## 📜 2.3 History 컴포넌트 분리 (0/4)

### 현재 파일 구조

```bash
src/apps/history/
├── history.tsx
└── components/
    ├── HistoryApp.tsx
    ├── HistoryPanel.tsx
    ├── HistoryFileList.tsx
    ├── HistoryFileItem.tsx
    ├── HistoryHeader.tsx
    └── EmptyState.tsx
```

### 작업 목록

- [ ] **history/ 컴포넌트 검토**
  - 각 컴포넌트 크기 확인
  - 책임 분리 검토
  - 불필요한 prop drilling 확인

- [ ] **파일 리스트 컴포넌트 최적화**
  - `HistoryFileList.tsx` 성능 개선
  - 가상 스크롤링 고려 (많은 파일 시)
  - 메모이제이션 적용

- [ ] **필터/검색 컴포넌트 추출**
  - `HistoryFilter.tsx` 생성
  - `HistorySearch.tsx` 생성
  - `HistorySort.tsx` 생성

- [ ] **가상 스크롤링 도입 고려**
  - `react-window` 또는 `react-virtualized` 평가
  - 성능 테스트
  - 필요시 구현

### 성능 최적화

```typescript
// HistoryFileList.tsx - 최적화 전
export function HistoryFileList({ files }: Props) {
  return (
    <ul>
      {files.map(file => (
        <HistoryFileItem key={file.id} file={file} />
      ))}
    </ul>
  );
}

// HistoryFileList.tsx - 최적화 후
import { memo } from 'react';
import { FixedSizeList as List } from 'react-window';

export const HistoryFileList = memo(function HistoryFileList({ files }: Props) {
  const Row = ({ index, style }: any) => (
    <div style={style}>
      <HistoryFileItem file={files[index]} />
    </div>
  );

  return (
    <List
      height={600}
      itemCount={files.length}
      itemSize={80}
      width="100%"
    >
      {Row}
    </List>
  );
});
```

---

## 🎨 2.4 공유 컴포넌트 정리 (0/4)

### 현재 UI 컴포넌트

```bash
src/components/ui/
├── button.tsx
├── input.tsx
├── textarea.tsx
├── select.tsx
├── checkbox.tsx
├── switch.tsx
├── card.tsx
├── badge.tsx
├── separator.tsx
├── icon-button.tsx
├── pill-button.tsx
├── status-badge.tsx
├── panel-header.tsx
└── typography.tsx
```

### 작업 목록

- [ ] **components/ 구조 검토**
  - 중복 컴포넌트 확인
  - 사용되지 않는 컴포넌트 제거
  - 파일 명명 일관성 확인

- [ ] **중복 컴포넌트 통합**
  - Button 관련: `button`, `icon-button`, `pill-button` 통합 검토
  - Badge 관련: `badge`, `status-badge` 통합 검토

- [ ] **UI 컴포넌트 일관성 확보**
  - Props 인터페이스 표준화
  - className 패턴 통일
  - 접근성 속성 추가

- [ ] **Radix UI 기반 컴포넌트 표준화**
  - 모든 UI 컴포넌트를 Radix UI로 전환 검토
  - shadcn/ui 패턴 적용
  - 테마 시스템 통합

### 컴포넌트 통합 예시

**Before - 여러 버튼 컴포넌트:**

```typescript
// button.tsx
export function Button({ ... }) { ... }

// icon-button.tsx
export function IconButton({ ... }) { ... }

// pill-button.tsx
export function PillButton({ ... }) { ... }
```

**After - 통합된 Button:**

```typescript
// button.tsx
import { cn } from '@/lib/utils';

interface ButtonProps {
  variant?: 'default' | 'outline' | 'ghost' | 'icon' | 'pill';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export function Button({
  variant = 'default',
  size = 'md',
  icon,
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'button',
        `button-${variant}`,
        `button-${size}`,
        className
      )}
      {...props}
    >
      {icon && <span className="button-icon">{icon}</span>}
      {children}
    </button>
  );
}

// 사용
<Button variant="icon" icon={<SaveIcon />} />
<Button variant="pill">저장</Button>
<Button>기본 버튼</Button>
```

---

## 🪝 2.5 Hooks 정리 및 추가 (0/4)

### 현재 Hooks

```bash
src/hooks/
├── useHistory.ts
├── useCloudLLM.ts
├── useAiPipeline.ts
├── useTheme.ts
└── useAppShortcuts.ts
```

### 작업 목록

- [ ] **커스텀 훅 정리**
  - 각 훅의 책임 검토
  - 너무 큰 훅 분리
  - JSDoc 주석 추가

- [ ] **폼 관련 훅 추가**
  - `hooks/useForm.ts` - React Hook Form wrapper
  - `hooks/useDumpForm.ts` - 일지 폼 전용
  - `hooks/useSettingsForm.ts` - 설정 폼 전용

- [ ] **데이터 페칭 훅 추가**
  - `hooks/useQuery.ts` - TanStack Query wrapper
  - `hooks/useMutation.ts` - Mutation wrapper
  - 또는 TanStack Query 직접 사용 검토

- [ ] **단축키 훅 정리**
  - `useAppShortcuts.ts` 검토
  - 개별 기능별 단축키 훅으로 분리 고려

### 폼 훅 예시

```typescript
// hooks/useDumpForm.ts
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const dumpSchema = z.object({
  content: z.string().min(1, '내용을 입력해주세요'),
  tags: z.array(z.string()).optional(),
});

export type DumpFormData = z.infer<typeof dumpSchema>;

export function useDumpForm(initialData?: DumpFormData) {
  const form = useForm<DumpFormData>({
    resolver: zodResolver(dumpSchema),
    defaultValues: initialData || {
      content: '',
      tags: [],
    },
  });

  return form;
}

// 사용
function DumpPanel() {
  const form = useDumpForm();

  const handleSubmit = form.handleSubmit(async (data) => {
    await saveDump(data);
  });

  return (
    <form onSubmit={handleSubmit}>
      {/* ... */}
    </form>
  );
}
```

---

## ✅ 완료 체크리스트

### 컴포넌트 크기
- [ ] 모든 컴포넌트가 200줄 이하인가?
- [ ] 복잡한 컴포넌트가 적절히 분리되었는가?

### 단일 책임
- [ ] 각 컴포넌트가 하나의 명확한 책임을 가지는가?
- [ ] 관련 없는 로직이 섞여있지 않은가?

### 재사용성
- [ ] UI 컴포넌트가 범용적으로 사용 가능한가?
- [ ] 중복 코드가 제거되었는가?

### JSDoc 주석
- [ ] 모든 export 컴포넌트에 JSDoc이 있는가?
- [ ] Props 설명이 명확한가?

### 타입 안전성
- [ ] Props 타입이 명확히 정의되었는가?
- [ ] any 타입이 최소화되었는가?

### 성능
- [ ] 필요한 곳에 memo/useMemo가 적용되었는가?
- [ ] 불필요한 리렌더링이 없는가?

### 테스트
- [ ] 주요 컴포넌트에 테스트가 작성되었는가?
- [ ] Hooks 테스트가 작성되었는가?

---

## 📝 참고 자료

### 컴포넌트 작성 패턴

```typescript
// 표준 컴포넌트 구조
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import type { ComponentProps } from '@/types';

// Props 타입
interface MyComponentProps {
  title: string;
  onSave: () => void;
}

/**
 * 컴포넌트 설명
 * @param title - 제목
 * @param onSave - 저장 핸들러
 */
export function MyComponent({ title, onSave }: MyComponentProps) {
  // 1. Hooks
  const [state, setState] = useState('');

  // 2. Handlers
  const handleClick = () => {
    // ...
  };

  // 3. Effects
  useEffect(() => {
    // ...
  }, []);

  // 4. Render
  return (
    <div>
      <h1>{title}</h1>
      <Button onClick={handleClick}>클릭</Button>
    </div>
  );
}
```

---

## 🔗 관련 문서

- [컴포넌트 추출 가이드](../component-extraction-guide.md)
- [컴포넌트 작성 규칙](../architecture/컴포넌트-작성-규칙.md)
- [프로젝트 구조](../architecture/프로젝트-구조.md)

---

**이전 Phase**: [Phase 1: Backend 모듈 재구성](./phase-1-backend-restructure.md)
**다음 Phase**: [Phase 3: IPC & 타입 안전성](./phase-3-ipc-type-safety.md)
