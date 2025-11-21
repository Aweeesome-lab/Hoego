# Phase 8: 성능 최적화 ⚡

**우선순위**: 🟢 LOW
**예상 소요**: 3-4 시간
**상태**: ⏳ 대기 중

---

## 📋 목표

앱 성능 개선:
- React 최적화 (메모이제이션, 코드 스플리팅)
- Rust 최적화 (클론 제거, 병렬화)
- 번들 크기 최적화
- 메모리 프로파일링

---

## 📊 진행률

**전체**: 0% (0/8)

---

## ⚛️ 8.1 React 최적화 (0/4)

### 작업 목록

- [ ] React.memo 적용
- [ ] useMemo / useCallback 최적화
- [ ] 코드 스플리팅 (React.lazy)
- [ ] 번들 크기 분석

### React.memo 예시

```typescript
// Before
export function FileItem({ file, onClick }: Props) {
  return <div onClick={onClick}>{file.name}</div>;
}

// After
import { memo } from 'react';

export const FileItem = memo(function FileItem({ file, onClick }: Props) {
  return <div onClick={onClick}>{file.name}</div>;
});
```

### 코드 스플리팅

```typescript
// App.tsx
import { lazy, Suspense } from 'react';

const Settings = lazy(() => import('./apps/settings/settings'));
const History = lazy(() => import('./apps/history/history'));

export function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Settings />
      <History />
    </Suspense>
  );
}
```

---

## 🦀 8.2 Rust 최적화 (0/4)

### 작업 목표

- [ ] 불필요한 클론 제거
- [ ] 비동기 작업 병렬화
- [ ] 파일 I/O 최적화
- [ ] 메모리 프로파일링

### Rust 최적화 예시

```rust
// Before - 불필요한 clone
pub fn process(data: String) -> String {
    let cloned = data.clone(); // 불필요
    cloned.to_uppercase()
}

// After - 참조 사용
pub fn process(data: &str) -> String {
    data.to_uppercase()
}

// 병렬 처리
use tokio::task;

pub async fn process_files(files: Vec<PathBuf>) -> Vec<Result<(), AppError>> {
    let tasks: Vec<_> = files
        .into_iter()
        .map(|file| task::spawn(async move { process_file(file).await }))
        .collect();

    futures::future::join_all(tasks).await
}
```

---

## ✅ 완료 체크리스트

- [ ] React 컴포넌트가 불필요하게 리렌더링되지 않는가?
- [ ] 번들 크기가 최적화되었는가?
- [ ] Rust 코드의 불필요한 클론이 제거되었는가?
- [ ] 병렬 처리가 적용되었는가?

---

**이전 Phase**: [Phase 7: 코드 품질 & 문서화](./phase-7-quality-docs.md)
**다음 Phase**: [Phase 9: 보안 & 프라이버시](./phase-9-security-privacy.md)
