# Storybook Integration Plan

> Hoego 프로젝트에 Storybook을 도입하여 UI 컴포넌트를 독립적으로 개발하고 문서화합니다.

## 📋 목표

- **순수 UI 컴포넌트**만 Storybook에서 관리
- Tauri API 의존성 제거 또는 모킹
- 컴포넌트 시각적 문서화 및 테스트
- 디자인 시스템 기반 구축

---

## 🎯 Phase 1: 설치 및 초기 설정

### 1.1 Storybook 설치

```bash
# Storybook 자동 설치 (Vite + React 감지)
npx storybook@latest init

# 예상 설치 패키지:
# - @storybook/react-vite
# - @storybook/addon-essentials
# - @storybook/addon-interactions
# - @storybook/addon-links
# - @storybook/blocks
# - storybook
```

### 1.2 초기 설정 파일

**.storybook/main.ts**
```typescript
import type { StorybookConfig } from '@storybook/react-vite';
import path from 'path';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  viteFinal: async (config) => {
    // Tailwind CSS 및 경로 별칭 설정
    return {
      ...config,
      resolve: {
        ...config.resolve,
        alias: {
          ...config.resolve?.alias,
          '@': path.resolve(__dirname, '../src'),
        },
      },
    };
  },
};

export default config;
```

**.storybook/preview.ts**
```typescript
import type { Preview } from '@storybook/react';
import '../src/styles/globals.css'; // Tailwind CSS 임포트

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
};

export default preview;
```

### 1.3 package.json 스크립트 추가

```json
{
  "scripts": {
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  }
}
```

---

## 🧩 Phase 2: 컴포넌트 분류 및 우선순위

### 2.1 Storybook 적합 컴포넌트 (✅ 우선순위)

#### Tier 1: 순수 UI 컴포넌트 (Tauri 의존성 없음)
- `src/components/ui/command.tsx` ⭐ **최우선**
  - cmdk 기반 커맨드 팔레트 UI
  - 완전히 독립적인 UI 컴포넌트

#### Tier 2: Layout 컴포넌트 (최소 의존성)
- `src/components/layout/Header.tsx`
- `src/components/layout/Footer.tsx`
  - 확인 필요: Tauri API 사용 여부

#### Tier 3: AI 관련 컴포넌트 (UI 부분만)
- `src/components/ai/thinking.tsx`
- `src/components/ai/response.tsx`
  - UI 렌더링 부분만 스토리 작성
  - 데이터는 목(mock) 사용

#### Tier 4: Markdown 컴포넌트
- `src/components/markdown/MarkdownComponents.tsx`
- `src/components/markdown/MemoizedReactMarkdown.tsx`
  - 다양한 마크다운 렌더링 케이스 시각화

### 2.2 Storybook 부적합 컴포넌트 (❌ 제외 또는 보류)

#### Tauri API 의존성이 높은 컴포넌트
- `src/components/panels/DumpPanel.tsx`
- `src/components/panels/RetrospectPanel.tsx`
- `src/components/panels/AiPanel.tsx`
- `src/components/NoteSummarizer.tsx`
  - Tauri API 호출이 많아 모킹 복잡도가 높음
  - Phase 3 이후 고려 (모킹 인프라 구축 후)

---

## 🎨 Phase 3: 초기 스토리 작성

### 3.1 Command 컴포넌트 스토리 (최우선)

**src/components/ui/command.stories.tsx**
```typescript
import type { Meta, StoryObj } from '@storybook/react';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from './command';

const meta: Meta<typeof Command> = {
  title: 'UI/Command',
  component: Command,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Command>;

export const Default: Story = {
  render: () => (
    <Command className="rounded-lg border shadow-md">
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Suggestions">
          <CommandItem>
            <span>Calendar</span>
          </CommandItem>
          <CommandItem>
            <span>Search Emoji</span>
          </CommandItem>
          <CommandItem>
            <span>Calculator</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Settings">
          <CommandItem>
            <span>Profile</span>
            <CommandShortcut>⌘P</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <span>Settings</span>
            <CommandShortcut>⌘S</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
};

export const WithDialog: Story = {
  render: () => (
    <CommandDialog>
      <CommandInput placeholder="Search..." />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup heading="Quick Actions">
          <CommandItem>Action 1</CommandItem>
          <CommandItem>Action 2</CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  ),
};
```

### 3.2 Header/Footer 스토리 (Tauri 모킹 필요 시)

Tauri API 사용 여부를 먼저 확인한 후:

**Option A: Tauri 의존성 없음**
- 바로 스토리 작성

**Option B: Tauri 의존성 있음**
- 모킹 설정 후 스토리 작성 (Phase 4)

### 3.3 AI 컴포넌트 스토리 (목 데이터 사용)

**src/components/ai/thinking.stories.tsx**
```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { Thinking } from './thinking';

const meta: Meta<typeof Thinking> = {
  title: 'AI/Thinking',
  component: Thinking,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Thinking>;

export const Default: Story = {
  args: {
    // 목 props
  },
};

export const Loading: Story = {
  args: {
    // 로딩 상태
  },
};
```

---

## 🔧 Phase 4: Tauri API 모킹 인프라 (선택적)

### 4.1 Tauri API 모킹 설정

**.storybook/mocks/tauri.tsx**
```typescript
import React from 'react';

// Tauri API 모킹 컨텍스트
export const MockTauriContext = React.createContext({
  invoke: async (cmd: string, args?: any) => {
    console.log('[Mock Tauri] invoke:', cmd, args);
    return Promise.resolve({});
  },
});

export const MockTauriProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <MockTauriContext.Provider
      value={{
        invoke: async (cmd: string, args?: any) => {
          // 목 응답 정의
          switch (cmd) {
            case 'get_settings':
              return { theme: 'dark', language: 'en' };
            case 'save_note':
              return { success: true };
            default:
              return {};
          }
        },
      }}
    >
      {children}
    </MockTauriContext.Provider>
  );
};
```

**.storybook/preview.tsx** (업데이트)
```typescript
import type { Preview } from '@storybook/react';
import React from 'react';
import '../src/styles/globals.css';
import { MockTauriProvider } from './mocks/tauri';

const preview: Preview = {
  decorators: [
    (Story) => (
      <MockTauriProvider>
        <Story />
      </MockTauriProvider>
    ),
  ],
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
};

export default preview;
```

### 4.2 모킹 전략

- **Level 1**: 컴포넌트가 Tauri API를 직접 호출하지 않으면 모킹 불필요
- **Level 2**: 최소 모킹 (기본값만 반환)
- **Level 3**: 실제 응답 구조를 시뮬레이션 (복잡한 Panel 컴포넌트)

---

## 📊 Phase 5: 디자인 시스템 구축 (장기)

### 5.1 목표

- Tailwind 기반 디자인 토큰 문서화
- 컴포넌트 스타일 가이드 정립
- 재사용 가능한 UI 컴포넌트 라이브러리 구축

### 5.2 추가 UI 컴포넌트 작성

현재 `src/components/ui/`에는 `command.tsx`만 있으므로, 향후 추가할 컴포넌트:

- Button
- Input
- Select
- Checkbox
- Dialog
- Dropdown
- Tooltip
- Badge
- Card
- ...등 (shadcn/ui 스타일)

---

## ✅ 실행 체크리스트

### Phase 1 (필수)
- [ ] Storybook 설치: `npx storybook@latest init`
- [ ] `.storybook/main.ts` 설정 (경로 별칭, Tailwind)
- [ ] `.storybook/preview.ts` 설정 (글로벌 스타일)
- [ ] `npm run storybook` 실행 확인

### Phase 2 (필수)
- [ ] 각 컴포넌트 파일 확인하여 Tauri 의존성 파악
- [ ] 우선순위 재조정 (Tauri 의존성 기준)

### Phase 3 (필수)
- [ ] `command.stories.tsx` 작성 및 테스트
- [ ] Header/Footer 컴포넌트 확인 및 스토리 작성
- [ ] AI 컴포넌트 기본 스토리 작성

### Phase 4 (선택)
- [ ] Tauri API 모킹 인프라 구축
- [ ] Panel 컴포넌트 스토리 작성

### Phase 5 (장기)
- [ ] 디자인 시스템 문서화
- [ ] 추가 UI 컴포넌트 작성

---

## 🚨 주의사항

1. **Tauri 앱과 Storybook은 완전히 분리**
   - Storybook은 브라우저 환경 (포트 6006)
   - Tauri 앱은 데스크톱 환경

2. **Tauri API 호출 방지**
   - `@tauri-apps/api`를 직접 임포트하는 컴포넌트는 모킹 필수
   - 또는 순수 UI 부분만 추출하여 별도 컴포넌트화

3. **점진적 도입**
   - 한 번에 모든 컴포넌트를 Storybook에 올리지 않음
   - 순수 UI 컴포넌트부터 시작하여 점진적 확장

4. **개발 워크플로우**
   - UI 개발 시: Storybook (빠른 반복)
   - 통합 테스트: Tauri 앱 (실제 환경)

---

## 📝 다음 단계

이 계획에 동의하시면 다음 순서로 진행하겠습니다:

1. **Phase 1 실행**: Storybook 설치 및 초기 설정
2. **컴포넌트 분석**: Header/Footer/AI 컴포넌트의 Tauri 의존성 확인
3. **Phase 3 실행**: 첫 스토리 작성 (command.tsx)
4. **검증**: Storybook UI에서 컴포넌트가 정상 렌더링되는지 확인

진행하시겠습니까?
