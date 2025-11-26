/**
 * Markdown Viewer Demo
 *
 * 마크다운 뷰어의 모든 기능을 테스트하는 데모 페이지
 * - 체크박스 인터랙션 (상태 관리 포함)
 * - 코드 하이라이팅
 * - 테이블, 리스트, 인용문 등
 */

import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

import { MarkdownViewer } from '@/components/markdown/MarkdownViewer';
import '@/styles/index.css';

const initialContent = `# Markdown Viewer Demo

이 페이지는 **Hoego** 마크다운 뷰어의 기능을 테스트합니다.

---

## 체크박스 (Task List)

체크박스를 클릭하면 상태가 토글됩니다:

- [ ] 미완료 작업 1
- [ ] 미완료 작업 2
- [x] 완료된 작업
- [ ] 미완료 작업 3

### 중첩된 체크박스

- [ ] 상위 작업
  - [ ] 하위 작업 1
  - [x] 하위 작업 2 (완료)
  - [ ] 하위 작업 3

---

## 코드 블록

### TypeScript

\`\`\`typescript
interface User {
  id: string;
  name: string;
  email: string;
}

function greet(user: User): string {
  return \`Hello, \${user.name}!\`;
}
\`\`\`

### Python

\`\`\`python
def fibonacci(n: int) -> int:
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

print(fibonacci(10))  # 55
\`\`\`

### 인라인 코드

\`npm install\` 명령어로 패키지를 설치하세요.

---

## 테이블

| 기능 | 지원 | 비고 |
| :--- | :---: | ---: |
| 체크박스 | ✅ | 인터랙티브 |
| 코드 하이라이팅 | ✅ | PrismJS |
| 테이블 | ✅ | GFM |
| ~~취소선~~ | ✅ | - |

---

## 리스트

**순서 없는 리스트:**
- 항목 1
- 항목 2
  - 중첩 항목 A
  - 중첩 항목 B
- 항목 3

**순서 있는 리스트:**
1. 첫 번째
2. 두 번째
3. 세 번째

---

## 혼합 리스트 (체크박스 + 일반 bullet)

**일반 bullet과 체크박스 혼합:**
- 일반 불릿 1
- 일반 불릿 2
  - [ ] 중첩 체크박스 1
  - 일반 중첩 불릿
  - [x] 중첩 체크박스 2 (완료)
- 일반 불릿 3

**번호 리스트 내 체크박스:**
1. 첫 번째 항목
   - [ ] 서브 체크박스
   - 일반 서브 불릿
2. 두 번째 항목
3. 세 번째 항목

---

## 인용문

> 이것은 인용문입니다.
> 여러 줄에 걸쳐 작성할 수 있습니다.

---

## 링크

[Hoego GitHub](https://github.com/hoego)를 방문하세요.

---

*이탤릭*, **볼드**, ~~취소선~~, __밑줄__
`;

function DemoApp() {
  const [content, setContent] = useState(initialContent);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // 다크모드 토글
  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  // 체크박스 토글 핸들러
  const handleContentChange = (newContent: string) => {
    setContent(newContent);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="max-w-4xl mx-auto p-8">
        {/* 헤더 */}
        <header className="flex justify-between items-center mb-8 pb-4 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h1 className="text-2xl font-bold">Markdown Viewer Demo</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              체크박스를 클릭해서 상태 변경을 테스트하세요
            </p>
          </div>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            {isDarkMode ? '☀️ Light' : '🌙 Dark'}
          </button>
        </header>

        {/* 마크다운 뷰어 */}
        <main className="rounded-lg border border-slate-200 dark:border-slate-700 p-6 bg-white dark:bg-slate-800/50">
          <MarkdownViewer
            content={content}
            isDarkMode={isDarkMode}
            onContentChange={handleContentChange}
          />
        </main>

        {/* 푸터 */}
        <footer className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-700 text-center text-sm text-slate-500">
          <p>
            Tech Stack: react-markdown + remark-gfm + PrismJS + Tailwind
            Typography
          </p>
        </footer>
      </div>
    </div>
  );
}

// 렌더링
const container = document.getElementById('demo-root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <DemoApp />
    </React.StrictMode>
  );
}
