# Path Alias

## 설정

**vite.config.ts:**
```typescript
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

## 사용

```typescript
// ✅ 절대 경로 (권장)
import { Button } from '@/components/ui/button';
import { useHistory } from '@/hooks/useHistory';
import { AI_PROMPTS } from '@/constants';
import { historyService } from '@/services/historyService';
import type { DumpData } from '@/types/dump';

// ❌ 상대 경로 (지양)
import { Button } from '../../../components/ui/button';
```

---
