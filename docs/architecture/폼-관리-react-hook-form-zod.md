# 폼 관리 (React Hook Form + Zod)

## 기본 패턴

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Zod 스키마 정의
const dumpSchema = z.object({
  content: z.string().min(1, '내용을 입력해주세요'),
  tags: z.array(z.string()).optional(),
});

type DumpFormData = z.infer<typeof dumpSchema>;

export function DumpForm() {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<DumpFormData>({
    resolver: zodResolver(dumpSchema),
  });

  const onSubmit = (data: DumpFormData) => {
    tauriAPI.saveDump(data.content);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <textarea {...register('content')} />
      {errors.content && <span>{errors.content.message}</span>}

      <button type="submit">저장</button>
    </form>
  );
}
```

---
