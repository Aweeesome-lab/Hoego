# Storybook Setup & UI Component System Roadmap

> Hoego 프로젝트의 UI 컴포넌트 시스템 구축 및 Storybook 완성 로드맵

## 🎯 목표

1. **Font 및 Typography 시스템 구축**
2. **재사용 가능한 UI 컴포넌트 라이브러리 구축**
3. **기존 컴포넌트 리팩토링**
4. **Storybook 세팅 완성**

---

## 📊 현황 분석

### ✅ 이미 완료된 것
- Tailwind CSS 설정 (shadcn/ui 스타일)
- 디자인 토큰 (color, radius, animation)
- Storybook 기본 설치 (10.0.7)
- command.tsx 컴포넌트 및 스토리

### ⚠️ 부족한 것
- **Font 설정** (현재 시스템 폰트만 사용)
- **기본 UI 컴포넌트** (Button, Input, Card 등)
- **Typography 시스템** (heading, body, caption 등)
- **컴포넌트 일관성** (재사용 가능한 패턴)

### 📁 현재 컴포넌트 구조
```
src/components/
├── ui/
│   └── command.tsx          ⭐ 유일한 재사용 가능 UI 컴포넌트
├── layout/
│   ├── Header.tsx           ✅ 잘 구조화됨 (props 기반)
│   └── Footer.tsx
├── panels/                  ⚠️ Tauri 의존성 높음
│   ├── DumpPanel.tsx
│   ├── RetrospectPanel.tsx
│   ├── AiPanel.tsx
│   └── ...
├── ai/
│   ├── thinking.tsx
│   └── response.tsx
├── markdown/
│   ├── MarkdownComponents.tsx
│   └── MemoizedReactMarkdown.tsx
└── NoteSummarizer.tsx
```

---

## 🚀 Phase 1: Font & Typography 시스템 (우선순위 1)

### 1.1 Font 선택 및 설치

**추천 폰트 조합:**
```
Primary (한글/영문): Pretendard Variable
- 변수 폰트로 다양한 weight 지원
- 한글 가독성 우수
- 시스템 폰트 대체 최적화

Code (고정폭): JetBrains Mono
- 코드/마크다운용
- 리가처 지원

Fallback: system-ui, -apple-system
```

**설치 방법:**
```bash
# Option 1: CDN (빠른 테스트)
# index.html에 추가

# Option 2: Self-hosted (권장)
# public/fonts/ 에 폰트 파일 배치
```

### 1.2 Tailwind 폰트 설정

**tailwind.config.ts 업데이트:**
```typescript
theme: {
  extend: {
    fontFamily: {
      sans: ['Pretendard Variable', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Monaco', 'monospace'],
    },
    fontSize: {
      // Typography scale
      'display-lg': ['3rem', { lineHeight: '3.5rem', fontWeight: '700' }],
      'display': ['2.25rem', { lineHeight: '2.75rem', fontWeight: '700' }],
      'h1': ['2rem', { lineHeight: '2.5rem', fontWeight: '600' }],
      'h2': ['1.5rem', { lineHeight: '2rem', fontWeight: '600' }],
      'h3': ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }],
      'h4': ['1.125rem', { lineHeight: '1.5rem', fontWeight: '600' }],
      'body-lg': ['1.125rem', { lineHeight: '1.75rem', fontWeight: '400' }],
      'body': ['1rem', { lineHeight: '1.5rem', fontWeight: '400' }],
      'body-sm': ['0.875rem', { lineHeight: '1.25rem', fontWeight: '400' }],
      'caption': ['0.75rem', { lineHeight: '1rem', fontWeight: '400' }],
    },
  },
}
```

### 1.3 Typography 컴포넌트 작성

**src/components/ui/typography.tsx**
```typescript
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface TypographyProps {
  children: ReactNode;
  className?: string;
}

export const H1 = ({ children, className }: TypographyProps) => (
  <h1 className={cn('text-h1 text-foreground', className)}>{children}</h1>
);

export const H2 = ({ children, className }: TypographyProps) => (
  <h2 className={cn('text-h2 text-foreground', className)}>{children}</h2>
);

export const Body = ({ children, className }: TypographyProps) => (
  <p className={cn('text-body text-foreground', className)}>{children}</p>
);

export const Caption = ({ children, className }: TypographyProps) => (
  <span className={cn('text-caption text-muted-foreground', className)}>{children}</span>
);

export const Code = ({ children, className }: TypographyProps) => (
  <code className={cn('font-mono text-body-sm bg-muted px-1.5 py-0.5 rounded', className)}>
    {children}
  </code>
);
```

**typography.stories.tsx** (Storybook)
```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { H1, H2, H3, H4, Body, Caption, Code } from './typography';

const meta: Meta = {
  title: 'Design System/Typography',
  tags: ['autodocs'],
};

export default meta;

export const AllTypography: StoryObj = {
  render: () => (
    <div className="space-y-4">
      <H1>Heading 1 - Display Large</H1>
      <H2>Heading 2 - Display</H2>
      <Body>Body text - Regular paragraph content</Body>
      <Caption>Caption - Small descriptive text</Caption>
      <Code>const code = 'example';</Code>
    </div>
  ),
};
```

---

## 🎨 Phase 2: 기본 UI 컴포넌트 라이브러리 구축

### 2.1 핵심 컴포넌트 목록

**Tier 1 (필수, 우선 작성):**
- ✅ Command (이미 완료)
- Button
- Input
- Card
- Badge
- Separator

**Tier 2 (자주 사용):**
- Select
- Checkbox
- Switch
- Tooltip
- Dialog
- Dropdown Menu

**Tier 3 (특수 목적):**
- Tabs
- Accordion
- Progress
- Skeleton
- Alert

### 2.2 컴포넌트 작성 패턴

**예시: Button.tsx**
```typescript
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { ButtonHTMLAttributes, forwardRef } from 'react';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
```

**Button.stories.tsx**
```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'ghost', 'link'],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: {
    children: 'Button',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button variant="default">Default</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};
```

### 2.3 컴포넌트 작성 순서

**Week 1: 기본 인터랙션**
- [ ] Button
- [ ] Input
- [ ] Badge

**Week 2: 레이아웃 & 컨테이너**
- [ ] Card
- [ ] Separator
- [ ] Container (레이아웃 래퍼)

**Week 3: 폼 요소**
- [ ] Select
- [ ] Checkbox
- [ ] Switch

**Week 4: 피드백 & 오버레이**
- [ ] Tooltip
- [ ] Dialog
- [ ] Alert

---

## 🔄 Phase 3: 기존 컴포넌트 리팩토링

### 3.1 리팩토링 우선순위

**Level 1: 순수 UI 추출 (쉬움)**
- Header.tsx → 버튼/아이콘 버튼 추출
- Footer.tsx → 레이아웃 패턴 추출

**Level 2: 로직 분리 (보통)**
- NoteSummarizer.tsx → UI/로직 분리
- TemplatePickerDropdown.tsx → Dropdown 컴포넌트 재사용

**Level 3: 복잡한 컴포넌트 (어려움)**
- Panel 컴포넌트들 → 재사용 가능한 패턴 도출
- AI 컴포넌트 → 로딩/에러/성공 상태 컴포넌트 분리

### 3.2 리팩토링 예시: Header의 IconButton 추출

**현재 (Header.tsx):**
```tsx
<button onClick={hideOverlayWindow} className="...">
  <X size={16} />
</button>
```

**리팩토링 후:**
```tsx
// IconButton.tsx (새 컴포넌트)
export const IconButton = ({ icon: Icon, onClick, variant, size }) => (
  <button className={cn(iconButtonVariants({ variant, size }))} onClick={onClick}>
    <Icon size={size === 'sm' ? 16 : 20} />
  </button>
);

// Header.tsx (사용)
<IconButton icon={X} onClick={hideOverlayWindow} variant="ghost" size="sm" />
```

---

## 🎨 Phase 4: Storybook 고급 설정

### 4.1 테마 스위처 추가

**.storybook/preview.tsx 업데이트:**
```typescript
import { Preview } from '@storybook/react';
import '../src/styles/index.css';

const preview: Preview = {
  parameters: {
    // ... 기존 설정
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#f8fafc' },
        { name: 'dark', value: '#1e293b' },
      ],
    },
  },
  decorators: [
    (Story) => (
      <div className="p-4">
        <Story />
      </div>
    ),
  ],
  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        icon: 'circlehollow',
        items: ['light', 'dark'],
        dynamicTitle: true,
      },
    },
  },
};

export default preview;
```

### 4.2 디자인 토큰 문서화

**colors.stories.mdx**
```mdx
import { Meta, ColorPalette, ColorItem } from '@storybook/blocks';

<Meta title="Design System/Colors" />

# Color Palette

Hoego의 색상 시스템은 Tailwind CSS 변수를 기반으로 합니다.

<ColorPalette>
  <ColorItem
    title="Primary"
    subtitle="주요 색상"
    colors={{ Primary: 'hsl(242 70% 55%)' }}
  />
  <ColorItem
    title="Secondary"
    subtitle="보조 색상"
    colors={{ Secondary: 'hsl(215 19% 65%)' }}
  />
</ColorPalette>
```

### 4.3 Addon 설정

**설치할 추가 Addon:**
```bash
npm install --save-dev @storybook/addon-themes @storybook/addon-viewport
```

**.storybook/main.ts 업데이트:**
```typescript
addons: [
  '@chromatic-com/storybook',
  '@storybook/addon-docs',
  '@storybook/addon-a11y',
  '@storybook/addon-vitest',
  '@storybook/addon-themes',    // 테마 스위처
  '@storybook/addon-viewport',  // 반응형 테스트
],
```

---

## 📋 실행 체크리스트

### Phase 1: Font & Typography ✅
- [ ] Pretendard Variable 폰트 추가 (CDN 또는 로컬)
- [ ] JetBrains Mono 폰트 추가
- [ ] tailwind.config.ts fontFamily 설정
- [ ] tailwind.config.ts fontSize scale 추가
- [ ] Typography 컴포넌트 작성 (H1, H2, Body, Caption, Code)
- [ ] typography.stories.tsx 작성
- [ ] Storybook에서 폰트 확인

### Phase 2: UI 컴포넌트 (Tier 1) 🎯
- [ ] Button 컴포넌트 + 스토리
- [ ] Input 컴포넌트 + 스토리
- [ ] Card 컴포넌트 + 스토리
- [ ] Badge 컴포넌트 + 스토리
- [ ] Separator 컴포넌트 + 스토리

### Phase 3: 리팩토링 🔄
- [ ] Header IconButton 패턴 추출
- [ ] Footer 레이아웃 패턴 정리
- [ ] 중복 스타일 제거

### Phase 4: Storybook 고급 설정 🎨
- [ ] 테마 스위처 추가
- [ ] 반응형 뷰포트 설정
- [ ] Colors 문서화 (MDX)
- [ ] Spacing 문서화 (MDX)
- [ ] Typography 문서화 (MDX)

---

## 🎯 다음 단계

**바로 시작할 수 있는 것:**
1. **Font 설정** (20분) - Pretendard CDN 추가 및 Tailwind 설정
2. **Button 컴포넌트** (30분) - 가장 자주 사용되는 기본 컴포넌트
3. **Typography 컴포넌트** (20분) - 텍스트 일관성 확보

**우선순위 제안:**
```
Day 1: Font + Typography
Day 2: Button + Input
Day 3: Card + Badge
Day 4: 기존 컴포넌트 리팩토링 시작
```

---

## 💡 참고 자료

- [shadcn/ui Components](https://ui.shadcn.com/docs/components)
- [Tailwind Typography](https://tailwindcss.com/docs/typography-plugin)
- [Pretendard Font](https://github.com/orioncactus/pretendard)
- [Storybook Docs](https://storybook.js.org/docs)

---

**질문:**
1. Font는 CDN으로 빠르게 시작할까요, 아니면 로컬 파일로 할까요?
2. 어떤 컴포넌트부터 시작하고 싶으신가요? (Button 추천)
3. 기존 Panel 컴포넌트들도 리팩토링 범위에 포함할까요?
