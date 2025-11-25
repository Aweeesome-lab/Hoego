# Markdown Viewer

> Hoego의 마크다운 뷰어 컴포넌트 가이드

---

## 기술 스택

| 라이브러리 | 버전 | 용도 |
|-----------|------|------|
| react-markdown | ^9.0.0 | 마크다운 → React 컴포넌트 변환 |
| remark-gfm | ^4.0.0 | GitHub Flavored Markdown 지원 |
| prismjs | ^1.30.0 | 코드 구문 강조 |
| @tailwindcss/typography | ^0.5.19 | 프로즈 스타일링 |
| lucide-react | ^0.360.0 | 체크박스 아이콘 |

---

## 컴포넌트 구조

```
src/components/markdown/
├── MarkdownViewer.tsx    # 메인 마크다운 렌더러
└── TaskCheckbox.tsx      # 커스텀 체크박스 컴포넌트

src/styles/
└── index.css             # 추가 스타일 (선택사항)

src/apps/demo/
├── index.html            # 데모 페이지
└── demo.tsx              # 데모 앱
```

---

## 사용법

### 기본 사용

```tsx
import { MarkdownViewer } from '@/components/markdown/MarkdownViewer';

function MyComponent() {
  return (
    <MarkdownViewer
      content="# Hello World"
      isDarkMode={false}
    />
  );
}
```

### 체크박스 인터랙션 (상태 관리)

```tsx
import { useState } from 'react';
import { MarkdownViewer } from '@/components/markdown/MarkdownViewer';

function MyComponent() {
  const [content, setContent] = useState(`
- [ ] 미완료 작업
- [x] 완료된 작업
  `);

  return (
    <MarkdownViewer
      content={content}
      onContentChange={setContent}  // 체크박스 토글 시 콘텐츠 업데이트
    />
  );
}
```

### 릴리즈 노트 / 피처 페이지 적용

```tsx
import { MarkdownViewer } from '@/components/markdown/MarkdownViewer';

function ReleaseNotesPage() {
  const releaseNotes = `
# v1.2.0 Release Notes

## New Features

- [x] 커스텀 체크박스 컴포넌트
- [x] 애니메이션 효과 (체크마크 draw)
- [x] react-markdown 기반 렌더링

## Bug Fixes

- [x] 일반 불릿과 체크박스 혼합 시 스타일 이슈
- [ ] 다크모드 테마 개선 (예정)

## Breaking Changes

- react-showdown → react-markdown 마이그레이션
  `;

  return (
    <div className="max-w-3xl mx-auto p-8">
      <MarkdownViewer content={releaseNotes} isDarkMode={false} />
    </div>
  );
}
```

---

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `content` | `string` | Yes | - | 렌더링할 마크다운 문자열 |
| `className` | `string` | - | `''` | 추가 CSS 클래스 |
| `isDarkMode` | `boolean` | - | `false` | 다크 모드 활성화 |
| `onContentChange` | `(content: string) => void` | - | - | 체크박스 토글 콜백 |

---

## 지원 기능

### react-markdown + remark-gfm

```typescript
// 자동으로 지원되는 GFM 기능
- tables: true        // GFM 테이블
- tasklists: true     // 체크박스 리스트
- strikethrough: true // ~~취소선~~
- autolink: true      // URL 자동 링크
```

### 지원 언어 (코드 하이라이팅)

- bash
- css
- javascript / jsx
- json
- markdown
- python
- typescript / tsx

---

## 체크박스 구현

### 컴포넌트 교체 방식

react-markdown의 `components` prop을 사용하여 `<input type="checkbox">`를
커스텀 `TaskCheckbox` 컴포넌트로 교체합니다.

```tsx
<Markdown
  remarkPlugins={[remarkGfm]}
  components={{
    input: (props) => {
      if (props.type === 'checkbox') {
        return <TaskCheckbox checked={props.checked} />;
      }
      return <input {...props} />;
    }
  }}
>
  {content}
</Markdown>
```

### TaskCheckbox 컴포넌트

```tsx
import { TaskCheckbox } from '@/components/markdown/TaskCheckbox';

// Props
interface TaskCheckboxProps {
  checked?: boolean;      // 체크 상태
  index?: number;         // 체크박스 인덱스 (토글 식별용)
  disabled?: boolean;     // 읽기 전용 모드
  onChange?: (index: number, checked: boolean) => void;
  className?: string;
}
```

### 애니메이션

체크박스 애니메이션은 `tailwind.config.ts`에 정의됨:

```typescript
keyframes: {
  'checkbox-check': {
    '0%': { transform: 'scale(0.5)', opacity: '0' },
    '50%': { transform: 'scale(1.1)' },
    '100%': { transform: 'scale(1)', opacity: '1' },
  },
},
animation: {
  'checkbox-check': 'checkbox-check 0.2s ease-out forwards',
},
```

---

## 데모 실행

```bash
npm run dev:demo
```

브라우저에서 `http://localhost:5173/src/apps/demo/index.html`로 접속

---

## 스타일 커스터마이징

### Tailwind Typography 클래스

`PROSE_CLASSES` 상수를 수정하여 스타일 변경:

```typescript
const PROSE_CLASSES = [
  'prose prose-slate max-w-none',
  'prose-headings:font-semibold',
  'prose-h1:text-2xl prose-h1:border-b',
  // ...
].join(' ');
```

### 다크 모드

`isDarkMode={true}`를 전달하면 `prose-invert` 클래스가 적용됨.

### TaskCheckbox 스타일 커스터마이징

```tsx
// 기본 스타일 변경
<TaskCheckbox
  checked={true}
  className="!w-6 !h-6 !rounded-full"  // 원형 체크박스
/>
```

---

## 마이그레이션 가이드

### react-showdown → react-markdown

**변경 사항:**

1. 라이브러리 교체
   ```bash
   npm uninstall react-showdown showdown
   npm install react-markdown remark-gfm
   ```

2. 컴포넌트 교체 방식 사용
   - DOM manipulation 제거
   - React 컴포넌트로 체크박스 직접 렌더링

3. 애니메이션 추가
   - CSS transitions → Tailwind keyframes
   - Lucide 아이콘 사용

**호환성:**
- 기존 Props 인터페이스 동일 (`content`, `className`, `isDarkMode`, `onContentChange`)
- 마크다운 문법 호환성 유지

---

## 테스트 체크리스트

- [x] 체크박스 클릭 시 토글 작동
- [x] 체크 상태가 마크다운에 반영
- [x] 중첩 체크박스 정상 작동
- [x] 코드 블록 구문 강조 적용
- [x] 테이블 렌더링 정상
- [x] 다크 모드 스타일 적용
- [x] 포커스 상태 접근성
- [x] 체크마크 애니메이션

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|----------|
| 2025-11-25 | 3.0 | react-markdown + 컴포넌트 교체 방식으로 마이그레이션 |
| 2025-11-25 | 2.0 | react-showdown 기반으로 완전 재작성 |
