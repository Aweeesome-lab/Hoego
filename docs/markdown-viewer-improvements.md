# Hoego 마크다운 뷰어 개선 제안서

> **작성일**: 2025-01-22
> **버전**: 1.0
> **대상**: 마크다운 프리뷰/뷰어 시스템
> **목적**: 사용자 경험 향상 및 성능 최적화

---

## 목차

1. [현재 상태 분석](#1-현재-상태-분석)
2. [강점](#2-강점-strengths)
3. [개선 필요 영역](#3-개선-필요-영역-areas-for-improvement)
4. [우선순위별 개선 과제](#4-우선순위별-개선-과제)
5. [구현 로드맵](#5-구현-로드맵)
6. [기술적 세부사항](#6-기술적-세부사항)
7. [결론 및 권장사항](#7-결론-및-권장사항)

---

## 1. 현재 상태 분석

### 1.1 아키텍처 개요

Hoego의 마크다운 시스템은 명확한 관심사 분리를 통해 잘 구조화되어 있습니다:

```
MarkdownPreview (wrapper)
  └─ MarkdownRenderer (core)
      ├─ react-markdown (parsing)
      ├─ useMarkdownComponents (renderers)
      └─ Plugins (remark/rehype)
```

**주요 컴포넌트**:
- **MarkdownPreview**: 스크롤 컨테이너 제공
- **MarkdownRenderer**: 핵심 렌더링 로직
- **useMarkdownComponents**: 모든 커스텀 렌더러 중앙 관리
- **Renderers**: 각 마크다운 요소별 전문 컴포넌트 (10+ 파일, ~994줄)
- **Config**: 플러그인 설정

### 1.2 기술 스택

| 라이브러리 | 버전 | 용도 | 번들 사이즈 |
|----------|------|-----|-----------|
| react-markdown | v9.1.0 | 마크다운 파싱 | ~100KB |
| react-syntax-highlighter | v16.1.0 | 코드 하이라이팅 | 8.7MB |
| Mermaid | v11.12.1 | 다이어그램 | 65MB |
| KaTeX | v0.16.25 | 수식 렌더링 | ~2MB |
| remark-gfm | v4.0.1 | GitHub Flavored Markdown | ~50KB |
| rehype-sanitize | v6.0.0 | XSS 방지 | ~30KB |

**총 마크다운 관련 의존성**: ~75MB

### 1.3 지원 기능 목록

#### ✅ 완전히 구현된 기능

**텍스트 포매팅**:
- Bold, Italic, Strikethrough
- Headings (h1-h6)
- Horizontal rules
- Blockquotes

**리스트**:
- Ordered lists (숫자)
- Unordered lists (불릿)
- Task lists (체크박스)
  - 인터랙티브 토글 지원
  - Radix UI 기반
  - 위치 기반 업데이트

**코드**:
- Inline code
- Code blocks (120+ 언어 지원)
- Syntax highlighting (Prism 테마)
- Copy to clipboard 기능
- Language badge

**고급 기능**:
- Tables (커스텀 스타일링)
- Footnotes (참조, 정의, 역참조)
- Math equations (KaTeX)
  - Inline: `$...$`
  - Block: `$$...$$`
- Mermaid diagrams
  - Flowchart, Sequence, Class, State
  - ER, Gantt, Pie, Git graph
  - Lazy loading with Suspense
- Links
  - 외부 링크 프리뷰 카드
  - 메타데이터 자동 fetch
  - 캐싱 지원
- Images
  - Lazy loading
  - 커스텀 스타일링

**특수 기능**:
- GitHub-style callouts
  - NOTE, TIP, WARNING, IMPORTANT
  - 아이콘 포함
- Dark mode 완전 지원
- Accessibility (ARIA labels)
- Sanitization (XSS 방지)

---

## 2. 강점 (Strengths)

### 2.1 아키텍처 품질

**우수한 컴포넌트 분리**:
- 각 렌더러가 독립적이고 집중적
- 단일 책임 원칙 준수
- 재사용 가능한 설계

**성능 중심 설계**:
```tsx
// Mermaid lazy loading
<Suspense fallback={<LoadingIndicator />}>
  <MermaidRenderer />
</Suspense>

// React.memo on all renderers
export const CodeRenderer = React.memo(function CodeRenderer(...) {
  // ...
});

// useMemo for plugins
const remarkPlugins = useMemo(() => [...], []);
```

**타입 안전성**:
- 모든 props에 대한 TypeScript 타입
- 명확한 인터페이스 정의
- 타입 추론 최대 활용

### 2.2 접근성 우선 (Accessibility-First)

**ARIA 레이블**:
```tsx
<input
  type="checkbox"
  aria-label={checked ? '완료된 작업' : '미완료 작업'}
  disabled={disabled}
/>
```

**시맨틱 HTML**:
- 적절한 HTML5 태그 사용
- 테이블 구조 준수
- 리스트 마크업 표준 준수

**키보드 내비게이션**:
- Focus-visible 스타일
- Tab navigation 지원
- 키보드로 모든 기능 접근 가능

### 2.3 프로덕션 준비 기능

**작업 토글 시스템**:
- 위치 기반 업데이트 (line/column 정보 활용)
- 낙관적 업데이트 미지원 (개선 필요)
- 에러 처리

**클립보드 기능**:
```tsx
const handleCopy = async () => {
  await navigator.clipboard.writeText(code);
  toast.success('코드가 복사되었습니다');
};
```

**링크 프리뷰**:
- 자동 메타데이터 fetch (OpenGraph)
- 캐싱으로 중복 요청 방지
- 로딩/에러 상태 처리

**다크 모드**:
- 모든 렌더러에 통합
- 일관된 색상 시스템
- TailwindCSS 기반

### 2.4 코드 품질

**일관된 스타일링**:
- TailwindCSS 디자인 시스템
- 색상 토큰 사용 (`emerald-*`, `slate-*`)
- 반응형 디자인 (sm:, md:, lg: breakpoints)

**깔끔한 플러그인 시스템**:
```tsx
const remarkPlugins: PluggableList = [
  remarkGfm,
  remarkMath,
  remarkBreaks,
];

const rehypePlugins: PluggableList = [
  [rehypeRaw, { passThrough: ['element'] }],
  [rehypeSanitize, schema],
  [rehypeKatex, { output: 'html' }],
];
```

**문서화**:
- 한국어 주석으로 명확한 설명
- JSDoc 스타일 주석
- 컴포넌트 용도 설명

---

## 3. 개선 필요 영역 (Areas for Improvement)

### 3.1 성능 병목 (Performance Bottlenecks)

#### 🔴 긴급: 번들 사이즈 이슈

**현재 상태**:
```
Mermaid:                   65MB  (다이어그램)
react-syntax-highlighter:  8.7MB (코드 하이라이팅)
KaTeX:                     ~2MB  (수식)
────────────────────────────────
Total:                     ~75MB
```

**영향**:
- 초기 로딩 느림 (특히 저속 네트워크)
- 메모리 사용량 증가
- 모바일 환경 성능 저하

**해결 방안**:
1. **Mermaid 대체**:
   - Option A: `mermaid-slim` (경량 버전, ~5MB)
   - Option B: Kroki API (서버 렌더링)
   - Option C: 사용 빈도 분석 후 제거 고려

2. **Syntax Highlighter 최적화**:
   - 언어별 동적 import
   - 실제 사용되는 언어만 로드
   - Prism Lite 고려

3. **KaTeX Lazy Loading**:
   - 수식이 있을 때만 로드
   - 조건부 import

**예상 효과**: 40-50MB 감소 (45-67% 개선)

#### 🟡 중요: 플러그인 초기화

**현재 문제**:
```tsx
const remarkPlugins: PluggableList = useMemo(
  () => [remarkGfm, remarkMath, remarkBreaks],
  [] // 의존성 없음 - 모듈 레벨로 이동 가능
);
```

**개선 방안**:
```tsx
// 모듈 레벨 상수로 이동
const REMARK_PLUGINS: PluggableList = [
  remarkGfm,
  remarkMath,
  remarkBreaks,
];

// 컴포넌트에서 직접 사용
<ReactMarkdown remarkPlugins={REMARK_PLUGINS}>
```

**예상 효과**: 불필요한 메모이제이션 제거, 미미한 성능 향상

#### 🟡 중요: 컴포넌트 재생성

**현재 문제**:
```tsx
const components = useMarkdownComponents({
  isDarkMode,      // 자주 변경
  isSaving,        // 저장 시마다 변경
  onTaskToggle,    // 함수 참조 변경 가능
});
```

매 렌더마다 새로운 컴포넌트 인스턴스 생성:
```tsx
h1: ({ children }) => (
  <HeadingRenderer level={1} isDarkMode={isDarkMode}>
    {children}
  </HeadingRenderer>
),
// h2, h3, h4, h5, h6... (6개 중복)
```

**개선 방안**:
```tsx
// 컴포넌트 팩토리 패턴
const createHeadingRenderer = (level: 1 | 2 | 3 | 4 | 5 | 6) =>
  ({ children }: { children: React.ReactNode }) => (
    <HeadingRenderer level={level} isDarkMode={isDarkMode}>
      {children}
    </HeadingRenderer>
  );

// 한 번만 생성
const h1 = createHeadingRenderer(1);
```

### 3.2 누락된 기능 (Missing Features)

#### P0 - 높은 우선순위 (High Impact)

**1. 목차 (Table of Contents)**
- **필요성**: 긴 문서 탐색
- **구현**:
  - 헤딩 자동 추출
  - 스티키 사이드바
  - 스크롤 시 현재 위치 하이라이트
- **복잡도**: 중간
- **예상 시간**: 2-3일

**2. 헤딩 앵커 링크**
- **필요성**: 섹션 직접 링크
- **구현**:
  - 헤딩에 ID 자동 생성 (`#heading-text`)
  - 링크 복사 버튼
  - 스크롤 시 URL 업데이트
- **복잡도**: 낮음
- **예상 시간**: 1-2일

**3. 검색/하이라이트**
- **필요성**: 문서 내 텍스트 찾기
- **구현**:
  - Cmd/Ctrl+F 단축키
  - 검색 UI (검색바)
  - 매칭 텍스트 하이라이트
  - 이전/다음 이동
- **복잡도**: 중간
- **예상 시간**: 2-3일

**4. 내보내기 (Export)**
- **필요성**: 문서 공유/보관
- **구현**:
  - PDF 내보내기 (`html2pdf`)
  - HTML 내보내기
  - 마크다운 복사 (변환 포함)
- **복잡도**: 중간
- **예상 시간**: 3-4일

**5. 접을 수 있는 섹션 (Collapsible)**
- **필요성**: 큰 문서 개요 파악
- **구현**:
  - 헤딩 클릭으로 하위 내용 접기/펼치기
  - 상태 저장 (localStorage)
  - 딥 링크 지원 (앵커 + 자동 펼침)
- **복잡도**: 중간
- **예상 시간**: 2일

#### P1 - 중간 우선순위 (Medium Impact)

**6. 코드 Diff 하이라이팅**
- **필요성**: 변경 사항 추적
- **구현**: `react-diff-viewer` 또는 커스텀
- **예상 시간**: 2-3일

**7. 문법 하이라이팅 테마 선택**
- **필요성**: 사용자 선호도
- **구현**: 테마 전환 UI, 설정 저장
- **예상 시간**: 1-2일

**8. 커스텀 마크다운 확장**
- **필요성**: 도메인 특화 문법
- **구현**: Remark 플러그인 시스템
- **예상 시간**: 3-4일

**9. 임베드 지원**
- **필요성**: 멀티미디어 콘텐츠
- **지원 대상**: YouTube, Twitter, CodePen, JSFiddle
- **예상 시간**: 2-3일

**10. 인쇄 스타일시트**
- **필요성**: 문서 인쇄 최적화
- **구현**: @media print 스타일
- **예상 시간**: 1일

#### P2 - 낮은 우선순위 (Nice to Have)

**11. 이모지 지원** (`:emoji:` 문법)
**12. 다이어그램 내보내기** (SVG/PNG)
**13. 코드 블록 줄 번호 토글**
**14. 개별 라인 복사**
**15. 문서 통계** (단어 수, 읽기 시간)

### 3.3 UX/UI 개선 기회

#### 시각적 디자인

**1. 일관성 없는 여백**
```tsx
// 현재: 혼재된 방식
<div className="my-4">      // TailwindCSS
<div style={{ margin: '1.5rem 0' }}>  // Inline style
```

**개선**:
- TailwindCSS로 통일
- 디자인 토큰 사용

**2. 코드 블록 패딩 과다**
```tsx
// 현재
<pre className="relative rounded-lg p-4 pt-8">
```
- `pt-8` (2rem)는 badge와 함께 사용 시 과함
- 개선: `pt-6` (1.5rem)로 조정

**3. 테이블 오버플로 표시**
- 현재: 스크롤 가능하지만 시각적 단서 없음
- 개선: 스크롤 그림자 또는 화살표 표시

**4. 링크 프리뷰 Z-index**
```tsx
<div className="absolute left-0 top-full z-50">
```
- `z-50`이 다른 UI와 충돌 가능
- 개선: z-index 스케일 정의

**5. 헤딩 계층 구별**
- h4-h6의 시각적 차이 미미
- 개선: 글자 크기, 굵기, 색상으로 명확히 구분

#### 인터랙션

**1. 복사 버튼 가시성**
```tsx
<button className="opacity-0 group-hover:opacity-100">
  Copy
</button>
```
- **문제**: 터치 디바이스에서 호버 불가
- **개선**:
  - 터치 디바이스에서 항상 표시
  - 또는 탭 시 표시 유지

**2. 링크 프리뷰 트리거**
- **문제**: 호버 전용, 모바일 지원 없음
- **개선**:
  - 롱 프레스 지원
  - 클릭 시 모달/바텀시트 표시

**3. 로딩 상태 미흡**
- 링크 메타데이터 fetch 시 로딩 표시 없음
- **개선**: 스켈레톤 UI 또는 스피너

**4. 코드 블록 액션 부족**
- 현재: 복사만 가능
- **개선**:
  - 전체 화면 모드
  - 줄 번호 토글
  - 언어 전환 (다중 언어 코드 블록)

**5. 작업 체크박스 피드백**
```tsx
void onToggle(); // Promise 무시
```
- **문제**: 낙관적 업데이트 없음, 저장 대기
- **개선**:
  - 즉시 UI 업데이트
  - 백그라운드 저장
  - 실패 시 롤백

#### 반응형 디자인

**1. 테이블 스크롤**
- **현재**: 작동하지만 터치 어포던스 부족
- **개선**: 드래그 가능 표시, 스와이프 힌트

**2. 코드 블록 오버플로**
```tsx
<code style={{ fontSize: '12px' }}>
```
- **문제**: 좁은 화면에서 넘칠 수 있음
- **개선**: 반응형 폰트 크기 (`text-xs md:text-sm`)

**3. 링크 프리뷰 카드**
```tsx
<div className="flex flex-col sm:flex-row">
```
- 양호하지만 추가 최적화 가능

**4. Mermaid 다이어그램**
- **문제**: 반응형 크기 조절 없음, 오버플로 가능
- **개선**: `max-width: 100%`, `height: auto`

### 3.4 접근성 격차 (Accessibility Gaps)

#### WCAG 2.1 Level A

**1. 링크 프리뷰 키보드 내비게이션**
- **현재**: 호버 전용
- **필수**: Tab + Enter/Space로 접근
- **해결**:
```tsx
<div
  onMouseEnter={() => setShowPreview(true)}
  onFocus={() => setShowPreview(true)}
  onMouseLeave={() => setShowPreview(false)}
  onBlur={() => setShowPreview(false)}
>
```

**2. 작업 토글 포커스 관리**
- **문제**: 체크박스 토글 후 포커스 손실
- **해결**: 포커스 유지 또는 다음 체크박스로 이동

#### WCAG 2.1 Level AA

**1. 색상 대비**
```tsx
<span className="text-slate-400">  // 4.5:1 미만일 수 있음
```
- **확인 필요**: WebAIM Contrast Checker
- **목표**: 최소 4.5:1 (일반 텍스트), 3:1 (큰 텍스트)

**2. 터치 타겟 크기**
```tsx
<button className="h-3.5 w-3.5">  // 14px = 44px 미만
```
- **WCAG 기준**: 최소 44×44px
- **해결**: 패딩으로 클릭 영역 확장

**3. 모션 선호도**
```tsx
// 체크박스 애니메이션
transition-transform
```
- **현재**: `prefers-reduced-motion` 일부 적용
- **필요**: 다이어그램, 링크 프리뷰 애니메이션도 적용

#### 추가 개선 사항

**1. 스크린 리더 공지**
- **문제**: 작업 토글 성공/실패 알림 없음
- **해결**: Live region (`role="status"`) 사용

**2. 이미지 대체 텍스트**
- **현재**: 필수이지만 유효성 검사 없음
- **개선**: 빈 alt 경고

**3. 링크 목적**
```tsx
<ExternalLink className="h-3 w-3" />  // 장식용
```
- **개선**: aria-label에 "외부 링크" 포함

**4. 테이블 헤더**
```tsx
<th>Header</th>  // scope 속성 누락
```
- **해결**: `<th scope="col">`

### 3.5 코드 품질 이슈

#### 마이너 이슈

**1. 타입 비일관성**
```tsx
// 방법 1: Pick/Omit
type Props = Pick<ParentProps, 'isDarkMode'>;

// 방법 2: Inline
interface Props {
  isDarkMode: boolean;
}
```
- **개선**: 일관된 패턴 선택

**2. Prop 확산 (Spreading)**
```tsx
<a {...props} href={href}>  // props 충돌 가능
```
- **개선**: 명시적 prop 전달 또는 spread 순서 조정

**3. 매직 넘버**
```tsx
minWidth: '3em'     // CodeRenderer line numbers
z-50, z-10          // Z-index 스케일 없음
2000                // Toast duration (여러 곳에 하드코딩)
```
- **개선**:
  - 상수로 추출
  - Design token으로 관리

**4. 컴포넌트 중복**
```tsx
h1: ({ children }) => <HeadingRenderer level={1}>{children}</HeadingRenderer>,
h2: ({ children }) => <HeadingRenderer level={2}>{children}</HeadingRenderer>,
h3: ({ children }) => <HeadingRenderer level={3}>{children}</HeadingRenderer>,
// ... h4, h5, h6
```
- **개선**: 팩토리 함수 또는 map 사용

**5. 에러 처리 격차**
```tsx
// 이미지 에러
onError={() => setImgError(true)}
{!imgError && <img />}  // 대체 컨텐츠 없음
```
- **개선**: 플레이스홀더 이미지 표시

```tsx
// Mermaid 에러
{error && <div>Error: {error.message}</div>}  // 기술 메시지 노출
```
- **개선**: 사용자 친화적 메시지

```tsx
// 링크 메타데이터 fetch 실패
catch (error) {
  // 조용히 실패 - 로그만
}
```
- **개선**: 사용자에게 알림 또는 재시도 옵션

#### 잠재적 버그

**1. 작업 토글 경쟁 조건**
```tsx
onClick={async () => {
  void onToggle();  // 대기하지 않음
}}
```
- **문제**: 빠른 연속 클릭 시 상태 불일치
- **해결**:
```tsx
const [isToggling, setIsToggling] = useState(false);

onClick={async () => {
  if (isToggling) return;
  setIsToggling(true);
  try {
    await onToggle();
  } finally {
    setIsToggling(false);
  }
}}
```

**2. Mermaid ID 불안정**
```tsx
const id = `mermaid-${Math.random().toString(36).slice(2, 11)}`;
```
- **문제**: 매 렌더마다 새 ID, 불필요한 재렌더
- **해결**: `useId()` hook 또는 안정적인 ID 생성

**3. 링크 프리뷰 메모리 누수**
```tsx
const cache = new Map<string, Metadata>();
// 캐시 무한 증가, 제거 정책 없음
```
- **해결**: LRU 캐시 구현 (예: `lru-cache`)

**4. 클립보드 권한**
```tsx
await navigator.clipboard.writeText(code);
// 권한 확인 없음
```
- **개선**:
```tsx
try {
  await navigator.clipboard.writeText(code);
} catch (error) {
  // Fallback: textarea + execCommand
}
```

---

## 4. 우선순위별 개선 과제

### P0 - 긴급 (Critical) 🔴

**즉시 실행 필요 - 사용자 경험에 직접적인 영향**

#### 1. 번들 사이즈 최적화

**문제**: 75MB의 마크다운 관련 의존성

**목표**: 40-50MB 감소 (45-67% 개선)

**구현 단계**:
1. Mermaid 대체 조사
   - `mermaid-slim` 테스트
   - Kroki API 통합 검토
   - 사용 빈도 분석 (Analytics)
2. Syntax highlighter 동적 import
   ```tsx
   const loadLanguage = async (lang: string) => {
     const module = await import(
       `react-syntax-highlighter/dist/esm/languages/prism/${lang}`
     );
     return module.default;
   };
   ```
3. KaTeX lazy loading
   ```tsx
   const KaTeX = lazy(() => import('katex'));
   ```

**예상 시간**: 2-3일
**난이도**: 중간
**영향도**: 매우 높음

#### 2. 작업 토글 에러 처리 개선

**문제**:
- 경쟁 조건 가능
- 에러 처리 부족
- 낙관적 업데이트 없음

**구현**:
```tsx
const [isToggling, setIsToggling] = useState(false);
const [optimisticChecked, setOptimisticChecked] = useState(checked);

const handleToggle = async () => {
  if (isToggling) return;

  setIsToggling(true);
  setOptimisticChecked(!optimisticChecked); // 즉시 UI 업데이트

  try {
    await onToggle();
  } catch (error) {
    setOptimisticChecked(checked); // 롤백
    toast.error('작업 상태 업데이트 실패');
  } finally {
    setIsToggling(false);
  }
};
```

**예상 시간**: 1일
**난이도**: 낮음
**영향도**: 높음

#### 3. 모바일 링크 프리뷰 지원

**문제**: 호버 기반으로 모바일에서 사용 불가

**구현**:
```tsx
const [showPreview, setShowPreview] = useState(false);
const isMobile = useMediaQuery('(max-width: 768px)');

// 모바일: 클릭으로 모달/바텀시트
// 데스크톱: 호버로 툴팁

{isMobile ? (
  <Dialog open={showPreview} onOpenChange={setShowPreview}>
    <LinkPreviewCard />
  </Dialog>
) : (
  <div onMouseEnter={() => setShowPreview(true)}>
    {showPreview && <LinkPreviewCard />}
  </div>
)}
```

**예상 시간**: 1-2일
**난이도**: 낮음
**영향도**: 높음 (모바일 사용자)

---

### P1 - 높음 (High) 🟠

**2주 내 실행 - 핵심 기능 향상**

#### 4. 목차 (ToC) 자동 생성

**필요성**: 긴 문서 탐색

**기능**:
- 헤딩 자동 추출
- 스티키 사이드바
- 현재 위치 하이라이트
- 부드러운 스크롤

**구현**:
```tsx
// 1. 헤딩 추출
const extractHeadings = (markdown: string) => {
  const headings = [];
  const lines = markdown.split('\n');

  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      headings.push({
        level: match[1].length,
        text: match[2],
        id: slugify(match[2]),
      });
    }
  }

  return headings;
};

// 2. ToC 컴포넌트
function TableOfContents({ headings }) {
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    const observer = new IntersectionObserver(/* ... */);
    // 헤딩 관찰
  }, []);

  return (
    <nav className="sticky top-0">
      {headings.map(h => (
        <a
          href={`#${h.id}`}
          className={activeId === h.id ? 'active' : ''}
          style={{ paddingLeft: `${h.level * 0.5}rem` }}
        >
          {h.text}
        </a>
      ))}
    </nav>
  );
}
```

**예상 시간**: 2-3일
**난이도**: 중간

#### 5. 성능 모니터링

**필요성**: 지속적인 성능 개선

**메트릭**:
- 번들 사이즈 추적
- 렌더링 시간
- 마크다운 파싱 시간
- 메모리 사용량

**구현**:
```tsx
// Performance observer
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log(`${entry.name}: ${entry.duration}ms`);
  }
});

observer.observe({ entryTypes: ['measure', 'navigation'] });

// 번들 사이즈 CI 체크
// package.json
{
  "scripts": {
    "build": "vite build",
    "size": "size-limit"
  },
  "size-limit": [
    {
      "path": "dist/assets/*.js",
      "limit": "500 KB"
    }
  ]
}
```

**예상 시간**: 1일
**난이도**: 낮음

#### 6. 헤딩 앵커 링크

**기능**:
- 헤딩 ID 자동 생성
- 링크 복사 버튼
- URL 업데이트

**구현**:
```tsx
function HeadingRenderer({ level, children }) {
  const text = children.toString();
  const id = slugify(text);

  return (
    <h1 id={id} className="group relative">
      {children}
      <button
        onClick={() => {
          const url = `${window.location.origin}${window.location.pathname}#${id}`;
          navigator.clipboard.writeText(url);
          toast.success('링크 복사됨');
        }}
        className="opacity-0 group-hover:opacity-100"
      >
        🔗
      </button>
    </h1>
  );
}
```

**예상 시간**: 1-2일
**난이도**: 낮음

#### 7. 접근성 감사 및 개선

**체크리스트**:
- [ ] 색상 대비 (WCAG AA: 4.5:1)
- [ ] 터치 타겟 크기 (44×44px)
- [ ] 키보드 내비게이션
- [ ] 스크린 리더 호환성
- [ ] Focus 관리
- [ ] ARIA 레이블
- [ ] `prefers-reduced-motion`

**도구**:
- axe DevTools
- Lighthouse
- WAVE

**예상 시간**: 2-3일
**난이도**: 중간

---

### P2 - 중간 (Medium) 🟡

**1개월 내 실행 - 향상된 UX**

#### 8. 컴포넌트 리팩토링

**목표**: 코드 중복 제거, 유지보수성 향상

**작업**:
1. HeadingRenderer 팩토리
2. 공통 로직 추출
3. useMarkdownComponents 크기 축소

**예시**:
```tsx
// Before (중복)
h1: ({ children }) => <HeadingRenderer level={1}>{children}</HeadingRenderer>,
h2: ({ children }) => <HeadingRenderer level={2}>{children}</HeadingRenderer>,
// ... x6

// After (DRY)
const headings = [1, 2, 3, 4, 5, 6].reduce((acc, level) => ({
  ...acc,
  [`h${level}`]: ({ children }) => (
    <HeadingRenderer level={level}>{children}</HeadingRenderer>
  ),
}), {});
```

**예상 시간**: 2일

#### 9. 내보내기 (Export) 기능

**기능**:
- PDF 내보내기
- HTML 내보내기
- 마크다운 복사

**구현**:
```tsx
import html2pdf from 'html2pdf.js';

function ExportButton() {
  const handleExportPDF = () => {
    const element = markdownRef.current;
    html2pdf()
      .from(element)
      .save('document.pdf');
  };

  return (
    <DropdownMenu>
      <DropdownMenuItem onClick={handleExportPDF}>
        PDF로 내보내기
      </DropdownMenuItem>
      <DropdownMenuItem onClick={handleExportHTML}>
        HTML로 내보내기
      </DropdownMenuItem>
    </DropdownMenu>
  );
}
```

**예상 시간**: 3-4일

#### 10. 검색/하이라이트

**기능**:
- Cmd/Ctrl+F 단축키
- 텍스트 검색
- 매칭 하이라이트
- 이전/다음 이동

**구현**:
```tsx
function SearchHighlight({ content, query }) {
  if (!query) return <>{content}</>;

  const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
  const parts = content.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-200">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}
```

**예상 시간**: 2-3일

#### 11. 코드 블록 향상

**기능**:
- 전체 화면 모드
- 줄 하이라이팅
- Diff 지원
- 테마 선택기

**예상 시간**: 3-4일

#### 12. 개선된 에러 상태

**개선**:
- 사용자 친화적 메시지
- 재시도 메커니즘
- 대체 컨텐츠

**예상 시간**: 1-2일

---

### P3 - 낮음 (Low) 🟢

**여유 있을 때 - Nice to Have**

#### 13. 접을 수 있는 섹션

**예상 시간**: 2일
**난이도**: 중간

#### 14. 통계 & 메타데이터

**예상 시간**: 1일
**난이도**: 낮음

#### 15. 임베드 지원

**예상 시간**: 2-3일
**난이도**: 중간

---

## 5. 구현 로드맵

### Phase 1: 긴급 수정 (Week 1-2) 🔴

**목표**: 성능 개선 및 모바일 지원

| 작업 | 시간 | 담당 | 상태 |
|------|------|------|------|
| 번들 사이즈 최적화 | 2-3일 | - | 계획 |
| 작업 토글 개선 | 1일 | - | 계획 |
| 모바일 링크 프리뷰 | 1-2일 | - | 계획 |

**완료 기준**:
- [ ] 번들 사이즈 50MB 이하
- [ ] 작업 토글 에러율 0%
- [ ] 모바일 링크 프리뷰 작동

---

### Phase 2: 핵심 기능 (Week 3-4) 🟠

**목표**: 탐색 및 접근성

| 작업 | 시간 | 담당 | 상태 |
|------|------|------|------|
| 목차 생성 | 2-3일 | - | 계획 |
| 헤딩 앵커 | 1-2일 | - | 계획 |
| 성능 모니터링 | 1일 | - | 계획 |
| 접근성 감사 | 2-3일 | - | 계획 |

**완료 기준**:
- [ ] ToC 자동 생성 작동
- [ ] 모든 헤딩에 앵커 링크
- [ ] 번들 사이즈 CI 체크
- [ ] WCAG AA 준수

---

### Phase 3: UX 향상 (Week 5-8) 🟡

**목표**: 고급 기능 추가

| 작업 | 시간 | 담당 | 상태 |
|------|------|------|------|
| 컴포넌트 리팩토링 | 2일 | - | 계획 |
| 내보내기 기능 | 3-4일 | - | 계획 |
| 검색/하이라이트 | 2-3일 | - | 계획 |
| 코드 블록 향상 | 3-4일 | - | 계획 |
| 에러 상태 개선 | 1-2일 | - | 계획 |

**완료 기준**:
- [ ] 코드 중복 50% 감소
- [ ] PDF/HTML 내보내기 작동
- [ ] 검색 기능 작동
- [ ] 코드 블록 전체 화면 모드

---

### Phase 4: 완성도 (Week 9-12) 🟢

**목표**: 추가 편의 기능

| 작업 | 시간 | 담당 | 상태 |
|------|------|------|------|
| 접을 수 있는 섹션 | 2일 | - | 계획 |
| 통계 & 메타데이터 | 1일 | - | 계획 |
| 임베드 지원 | 2-3일 | - | 계획 |

**완료 기준**:
- [ ] 섹션 접기/펼치기 작동
- [ ] 읽기 시간 표시
- [ ] YouTube/Twitter 임베드

---

## 6. 기술적 세부사항

### 6.1 번들 최적화 전략

#### 전략 1: Mermaid 대체

**옵션 A: Mermaid Slim**
```bash
npm install mermaid-slim  # ~5MB vs 65MB
```

**장점**:
- 88% 크기 감소
- API 호환성 유지
- 쉬운 마이그레이션

**단점**:
- 일부 다이어그램 타입 제외 가능
- 커뮤니티 지원 적음

**옵션 B: Kroki API**
```tsx
// 서버 렌더링
const DiagramRenderer = ({ code, type }) => {
  const [svg, setSvg] = useState('');

  useEffect(() => {
    const encoded = btoa(pako.deflate(code));
    fetch(`https://kroki.io/${type}/svg/${encoded}`)
      .then(res => res.text())
      .then(setSvg);
  }, [code, type]);

  return <div dangerouslySetInnerHTML={{ __html: svg }} />;
};
```

**장점**:
- 번들 사이즈 0MB
- 모든 다이어그램 타입 지원
- 서버 부하 분산

**단점**:
- 네트워크 의존성
- API 다운타임 위험
- 개인정보 우려 (자체 호스팅 필요)

**권장**: Mermaid Slim (오프라인 작동 중요)

#### 전략 2: 동적 Syntax Highlighter

**Before**:
```tsx
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// 모든 언어 번들에 포함 (8.7MB)
```

**After**:
```tsx
const loadLanguage = async (lang: string) => {
  try {
    const module = await import(
      `react-syntax-highlighter/dist/esm/languages/prism/${lang}`
    );
    SyntaxHighlighter.registerLanguage(lang, module.default);
  } catch {
    // 미지원 언어는 plaintext로
  }
};

// 사용 시점에 로드
useEffect(() => {
  if (language) {
    loadLanguage(language);
  }
}, [language]);
```

**효과**:
- 초기 번들: ~100KB
- 언어별 청크: ~10-50KB
- 90% 크기 감소

#### 전략 3: KaTeX Lazy Loading

```tsx
const KaTeXRenderer = lazy(() => import('./KaTeXRenderer'));

// 수식이 있을 때만 로드
{hasMath && (
  <Suspense fallback={<Skeleton />}>
    <KaTeXRenderer />
  </Suspense>
)}
```

**감지**:
```tsx
const hasMath = useMemo(() => {
  return /\$\$[\s\S]+?\$\$|\$[^\$]+?\$/.test(content);
}, [content]);
```

### 6.2 성능 개선 방안

#### 가상 스크롤 (Virtual Scrolling)

**대상**: 1000줄 이상 문서

**라이브러리**: `react-window` 또는 `@tanstack/react-virtual`

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualizedMarkdown({ lines }) {
  const parentRef = useRef();

  const virtualizer = useVirtualizer({
    count: lines.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 24, // 줄 높이 추정
  });

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map(item => (
          <div key={item.key} style={{ transform: `translateY(${item.start}px)` }}>
            <MarkdownLine content={lines[item.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

**효과**:
- 렌더링 시간 90% 감소
- 메모리 사용량 80% 감소

#### 플러그인 상수화

**Before**:
```tsx
const remarkPlugins = useMemo(() => [
  remarkGfm,
  remarkMath,
  remarkBreaks,
], []);
```

**After**:
```tsx
// 모듈 레벨
const REMARK_PLUGINS: PluggableList = [
  remarkGfm,
  remarkMath,
  remarkBreaks,
];

// 컴포넌트
<ReactMarkdown remarkPlugins={REMARK_PLUGINS} />
```

#### 링크 프리뷰 디바운싱

```tsx
const debouncedFetch = useMemo(
  () => debounce((url: string) => fetchMetadata(url), 300),
  []
);

onMouseEnter={() => {
  debouncedFetch(href);
}}
```

### 6.3 접근성 개선 가이드

#### 색상 대비 확인

**도구**: WebAIM Contrast Checker

**수정 예시**:
```tsx
// Before (대비 3.8:1 ❌)
<span className="text-slate-400">

// After (대비 4.6:1 ✅)
<span className="text-slate-500">
```

#### 터치 타겟 확장

```tsx
// Before
<button className="h-3.5 w-3.5">  // 14×14px

// After
<button className="h-3.5 w-3.5 p-3">  // 38×38px 클릭 영역
```

#### 키보드 트랩 방지

```tsx
<Dialog
  onOpenChange={setOpen}
  onEscapeKeyDown={() => setOpen(false)}
>
  <DialogContent
    onCloseAutoFocus={(e) => {
      // 포커스 복원
      e.preventDefault();
      triggerRef.current?.focus();
    }}
  >
```

#### 스크린 리더 지원

```tsx
// Live region
<div role="status" aria-live="polite" aria-atomic="true">
  {isSaving ? '저장 중...' : '저장 완료'}
</div>

// 진행 상황
<div role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
```

### 6.4 코드 리팩토링 제안

#### 헤딩 팩토리

```tsx
const createHeadingComponents = (isDarkMode: boolean) => {
  const levels = [1, 2, 3, 4, 5, 6] as const;

  return levels.reduce((acc, level) => ({
    ...acc,
    [`h${level}`]: ({ children }: { children: React.ReactNode }) => (
      <HeadingRenderer level={level} isDarkMode={isDarkMode}>
        {children}
      </HeadingRenderer>
    ),
  }), {});
};
```

#### 에러 바운더리

```tsx
class MarkdownErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('Markdown render error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 rounded">
          <h3>마크다운 렌더링 오류</h3>
          <p>문서를 표시하는 중 문제가 발생했습니다.</p>
          <button onClick={() => this.setState({ hasError: false })}>
            다시 시도
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

#### LRU 캐시

```tsx
import LRU from 'lru-cache';

const metadataCache = new LRU<string, Metadata>({
  max: 100,  // 최대 100개
  ttl: 1000 * 60 * 60,  // 1시간
});

async function fetchMetadata(url: string) {
  const cached = metadataCache.get(url);
  if (cached) return cached;

  const metadata = await fetch(`/api/metadata?url=${url}`).then(r => r.json());
  metadataCache.set(url, metadata);

  return metadata;
}
```

---

## 7. 결론 및 권장사항

### 7.1 현재 상태 평가

**Overall Grade: B+ (85/100)**

**강점** ⭐⭐⭐⭐⭐:
- 우수한 아키텍처 (분리, 재사용성)
- 포괄적인 기능 세트
- 타입 안전성
- 접근성 기초

**약점** ⚠️:
- 과도한 번들 사이즈 (75MB)
- 모바일 UX 미흡
- 누락된 탐색 기능 (ToC, 앵커)
- 일부 접근성 격차

### 7.2 즉시 실행 권장사항

**1주 내 (P0)**:
1. ✅ **번들 최적화** - 사용자 경험에 가장 큰 영향
2. ✅ **작업 토글 개선** - 데이터 무결성 보장
3. ✅ **모바일 링크 프리뷰** - 모바일 사용자 지원

**2주 내 (P1)**:
4. ✅ **목차 생성** - 긴 문서 탐색 개선
5. ✅ **성능 모니터링** - 지속적 개선 기반
6. ✅ **헤딩 앵커** - 섹션 공유 기능
7. ✅ **접근성 감사** - WCAG AA 준수

### 7.3 장기 비전

**목표**: 세계 최고 수준의 마크다운 뷰어

**핵심 가치**:
1. **성능**: 번들 <30MB, 렌더링 <100ms
2. **접근성**: WCAG AAA 준수
3. **기능**: GitHub/Notion 수준
4. **UX**: 직관적이고 즐거운 경험

**차별화 포인트**:
- 🇰🇷 한국어 최적화
- 🎨 아름다운 디자인
- ⚡ 최고 성능
- ♿ 완벽한 접근성

### 7.4 성공 지표

**Phase 1 (긴급 수정)**:
- [ ] 번들 사이즈 <50MB
- [ ] Lighthouse Performance >90
- [ ] 모바일 링크 프리뷰 사용률 >50%

**Phase 2 (핵심 기능)**:
- [ ] ToC 사용률 >30%
- [ ] 앵커 링크 공유 >100회/월
- [ ] Lighthouse Accessibility >95

**Phase 3 (UX 향상)**:
- [ ] 검색 기능 사용 >20%
- [ ] PDF 내보내기 >50회/월
- [ ] 코드 복사 >1000회/월

**Phase 4 (완성도)**:
- [ ] 사용자 만족도 >4.5/5
- [ ] 버그 리포트 <5개/월
- [ ] 성능 회귀 0건

### 7.5 최종 권장사항

**단기 (1-2개월)**:
- P0-P1 과제 완료
- 사용자 피드백 수집
- 성능 메트릭 확립

**중기 (3-6개월)**:
- P2 과제 완료
- 고급 기능 추가
- A/B 테스트 실시

**장기 (6-12개월)**:
- P3 과제 완료
- 커뮤니티 기여 활성화
- 플러그인 시스템 구축

---

## 부록

### A. 참고 자료

**성능 최적화**:
- [Web.dev - Code Splitting](https://web.dev/code-splitting/)
- [React - Lazy Loading](https://react.dev/reference/react/lazy)
- [Bundle Analyzer Guide](https://github.com/webpack-contrib/webpack-bundle-analyzer)

**접근성**:
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)
- [MDN - ARIA](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA)

**마크다운 라이브러리**:
- [react-markdown](https://github.com/remarkjs/react-markdown)
- [remark plugins](https://github.com/remarkjs/remark/blob/main/doc/plugins.md)
- [rehype plugins](https://github.com/rehypejs/rehype/blob/main/doc/plugins.md)

### B. 관련 이슈

- #123 - 번들 사이즈 최적화
- #124 - 모바일 링크 프리뷰
- #125 - 목차 기능 추가
- #126 - 접근성 개선

### C. 변경 이력

| 버전 | 날짜 | 변경 사항 | 작성자 |
|------|------|----------|--------|
| 1.0 | 2025-01-22 | 초안 작성 | - |

---

**문서 끝**