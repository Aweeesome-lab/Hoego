# Phase 7: 코드 품질 & 문서화 ✨

**우선순위**: 🟢 LOW
**예상 소요**: 4-5 시간
**상태**: ⏳ 대기 중

---

## 📋 목표

코드 품질 향상 및 문서화:
- JSDoc 주석 작성
- Rust 문서화
- 테스트 작성
- Linting & Formatting 설정

---

## 📊 진행률

**전체**: 0% (0/12)

---

## 📝 7.1 JSDoc 주석 (0/3)

### 작업 목록

- [ ] export 컴포넌트 주석
- [ ] 커스텀 훅 주석
- [ ] 서비스 함수 주석

### JSDoc 예시

```typescript
/**
 * 일지 작성 패널 - 사용자가 일일 일지를 작성하는 컴포넌트
 *
 * @param props - 컴포넌트 props
 * @param props.initialContent - 초기 일지 내용 (선택)
 * @param props.onSave - 저장 시 호출되는 비동기 함수
 * @returns 일지 작성 패널 JSX
 *
 * @example
 * ```tsx
 * <DumpPanel
 *   initialContent="오늘의 일지"
 *   onSave={async (data) => await saveDump(data)}
 * />
 * ```
 */
export function DumpPanel({ initialContent, onSave }: DumpPanelProps) {
  // ...
}
```

---

## 🦀 7.2 Rust 문서화 (0/3)

### 작업 목록

- [ ] public 함수 doc comments
- [ ] 모듈 레벨 문서
- [ ] 예제 코드 추가

### Rust Doc 예시

```rust
//! 일지 서비스 모듈
//!
//! 일지 데이터의 저장, 로드, 관리를 담당합니다.
//!
//! # Examples
//!
//! ```
//! use hoego::services::dump_service;
//!
//! let dump = DumpData::new("오늘의 일지");
//! dump_service::save(dump).await?;
//! ```

/// 일지를 저장합니다
///
/// # Arguments
///
/// * `data` - 저장할 일지 데이터
///
/// # Returns
///
/// 성공 시 `Ok(())`, 실패 시 `AppError`
///
/// # Errors
///
/// - 파일 시스템 접근 실패
/// - 직렬화 실패
pub async fn save(data: DumpData) -> Result<(), AppError> {
    // ...
}
```

---

## 🧪 7.3 테스팅 (0/3)

### 작업 목록

- [ ] Frontend 테스트 (Vitest)
- [ ] Backend 테스트 (Rust)
- [ ] E2E 테스트 (선택)

### Vitest 예시

```typescript
// components/DumpPanel.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { DumpPanel } from './DumpPanel';

describe('DumpPanel', () => {
  it('renders correctly', () => {
    render(<DumpPanel onSave={jest.fn()} />);
    expect(screen.getByPlaceholderText(/일지를 작성/)).toBeInTheDocument();
  });

  it('calls onSave when save button is clicked', async () => {
    const onSave = jest.fn();
    render(<DumpPanel onSave={onSave} />);

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '테스트 내용' },
    });
    fireEvent.click(screen.getByText('저장'));

    expect(onSave).toHaveBeenCalled();
  });
});
```

### Rust 테스트 예시

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_save_dump() {
        let data = DumpData::new("테스트".to_string());
        let result = save(data).await;
        assert!(result.is_ok());
    }
}
```

---

## 🔧 7.4 Linting & Formatting (0/3)

### 작업 목록

- [ ] ESLint 규칙 정리
- [ ] Prettier 설정 통일
- [ ] Pre-commit hooks 설정

### Pre-commit Hook

```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Frontend
npm run lint
npm run format:check

# Backend
cd src-tauri
cargo fmt --check
cargo clippy -- -D warnings
```

---

## ✅ 완료 체크리스트

- [ ] 모든 public API에 문서가 작성되었는가?
- [ ] 주요 컴포넌트/함수에 테스트가 작성되었는가?
- [ ] Linter가 에러 없이 통과하는가?
- [ ] Pre-commit hook이 설정되었는가?

---

**이전 Phase**: [Phase 6: 날짜/시간 처리 통일](./phase-6-datetime-handling.md)
**다음 Phase**: [Phase 8: 성능 최적화](./phase-8-performance.md)
