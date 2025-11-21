# Phase 4: 폼 관리 & 검증 📝

**우선순위**: 🟡 MEDIUM
**예상 소요**: 2-3 시간
**상태**: ⏳ 대기 중

---

## 📋 목표

React Hook Form + Zod를 통합하여:
- 타입 안전한 폼 검증
- 사용자 친화적 에러 메시지
- 자동 저장 기능
- 성능 최적화 (불필요한 리렌더링 방지)

---

## 📊 진행률

**전체**: 0% (0/8)

---

## 📋 4.1 Zod 스키마 정의 (0/4)

### 작업 목록

- [ ] **일지 폼 스키마**
- [ ] **설정 폼 스키마**
- [ ] **회고 템플릿 스키마**
- [ ] **공통 검증 규칙**

### 구현 예시

```typescript
// lib/schemas/dump.ts
import { z } from 'zod';

export const dumpSchema = z.object({
  content: z
    .string()
    .min(1, '내용을 입력해주세요')
    .max(10000, '내용이 너무 깁니다 (최대 10,000자)'),
  tags: z
    .array(z.string())
    .max(10, '태그는 최대 10개까지 가능합니다')
    .optional(),
  timestamp: z.string().datetime(),
});

export type DumpFormData = z.infer<typeof dumpSchema>;

// lib/schemas/settings.ts
export const settingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  language: z.enum(['ko', 'en']),
  autoSave: z.boolean(),
  llm: z.object({
    provider: z.enum(['openai', 'claude', 'local']),
    model: z.string(),
    temperature: z.number().min(0).max(2),
    maxTokens: z.number().min(1).max(32000),
  }),
});

export type SettingsFormData = z.infer<typeof settingsSchema>;
```

---

## 🎯 4.2 폼 컴포넌트 구현 (0/4)

### 작업 목록

- [ ] **React Hook Form 통합**
- [ ] **검증 에러 표시**
- [ ] **폼 상태 관리**
- [ ] **자동 저장 기능**

### Dump 폼 예시

```typescript
// components/panels/DumpPanel.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { dumpSchema, type DumpFormData } from '@/lib/schemas/dump';
import { useAutoSave } from '@/hooks/useAutoSave';

export function DumpPanel() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
  } = useForm<DumpFormData>({
    resolver: zodResolver(dumpSchema),
    defaultValues: {
      content: '',
      tags: [],
      timestamp: new Date().toISOString(),
    },
  });

  // 자동 저장
  useAutoSave({
    data: watch(),
    onSave: async (data) => {
      await invoke('save_dump', data);
    },
    enabled: isDirty,
    debounce: 2000,
  });

  const onSubmit = async (data: DumpFormData) => {
    await invoke('save_dump', data);
    toast.success('저장 완료');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="dump-panel">
      <textarea
        {...register('content')}
        placeholder="오늘의 일지를 작성해주세요"
      />
      {errors.content && (
        <p className="error">{errors.content.message}</p>
      )}

      <button type="submit" disabled={!isDirty}>
        저장
      </button>
    </form>
  );
}
```

### 자동 저장 Hook

```typescript
// hooks/useAutoSave.ts
import { useEffect, useRef } from 'react';
import { debounce } from '@/lib/utils';

interface UseAutoSaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void>;
  enabled?: boolean;
  debounce?: number;
}

export function useAutoSave<T>({
  data,
  onSave,
  enabled = true,
  debounce: debounceMs = 2000,
}: UseAutoSaveOptions<T>) {
  const debouncedSave = useRef(
    debounce(async (data: T) => {
      try {
        await onSave(data);
        console.log('자동 저장 완료');
      } catch (error) {
        console.error('자동 저장 실패:', error);
      }
    }, debounceMs)
  ).current;

  useEffect(() => {
    if (enabled) {
      debouncedSave(data);
    }
  }, [data, enabled, debouncedSave]);
}
```

---

## ✅ 완료 체크리스트

- [ ] 모든 폼에 Zod 스키마가 정의되었는가?
- [ ] React Hook Form이 통합되었는가?
- [ ] 에러 메시지가 사용자 친화적인가?
- [ ] 자동 저장이 작동하는가?
- [ ] 검증이 클라이언트와 서버 양쪽에서 이루어지는가?

---

**이전 Phase**: [Phase 3: IPC & 타입 안전성](./phase-3-ipc-type-safety.md)
**다음 Phase**: [Phase 5: 상태 관리 최적화](./phase-5-state-management.md)
