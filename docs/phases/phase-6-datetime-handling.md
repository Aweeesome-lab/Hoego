# Phase 6: 날짜/시간 처리 통일 📅

**우선순위**: 🟢 LOW
**예상 소요**: 2 시간
**상태**: ⏳ 대기 중

---

## 📋 목표

Rust-TypeScript 간 날짜/시간 처리 일관성:
- ISO 8601 포맷 표준화
- UTC 타임존 통일
- 날짜 파싱/포맷팅 유틸리티

---

## 📊 진행률

**전체**: 0% (0/6)

---

## 🦀 6.1 Rust 구현 (0/3)

### 작업 목록

- [ ] chrono 사용 표준화
- [ ] ISO 8601 포맷 강제
- [ ] 타임존 처리 (UTC)

### Rust 구현

```rust
// utils/datetime.rs
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

pub fn now() -> DateTime<Utc> {
    Utc::now()
}

pub fn format_iso8601(dt: &DateTime<Utc>) -> String {
    dt.to_rfc3339()
}

pub fn format_filename(dt: &DateTime<Utc>) -> String {
    dt.format("%Y-%m-%d_%H-%M-%S").to_string()
}
```

---

## ⚛️ 6.2 TypeScript 구현 (0/3)

### 작업 목록

- [ ] 날짜 라이브러리 선택 (date-fns or dayjs)
- [ ] 날짜 파싱/포맷팅 유틸
- [ ] 타임존 변환 헬퍼

### TypeScript 구현

```typescript
// utils/datetime.ts
import { parseISO, format } from 'date-fns';

export function parseISOString(s: string): Date {
  return parseISO(s);
}

export function formatDate(date: Date, fmt: string = 'yyyy-MM-dd'): string {
  return format(date, fmt);
}

export function formatFilename(date: Date): string {
  return format(date, 'yyyy-MM-dd_HH-mm-ss');
}
```

---

## ✅ 완료 체크리스트

- [ ] Rust와 TypeScript가 동일한 포맷을 사용하는가?
- [ ] 모든 날짜가 UTC로 저장되는가?
- [ ] 파싱/포맷팅이 일관적인가?

---

**이전 Phase**: [Phase 5: 상태 관리 최적화](./phase-5-state-management.md)
**다음 Phase**: [Phase 7: 코드 품질 & 문서화](./phase-7-quality-docs.md)
