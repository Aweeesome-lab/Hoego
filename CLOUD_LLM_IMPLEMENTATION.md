# Cloud LLM 통합 구현 가이드

> OpenAI, Claude, Gemini 등 클라우드 LLM을 Hoego에 통합하는 가이드입니다.

## 📋 구현 현황

### ✅ 완료된 작업 (Backend)

1. **Core Architecture**
   - ✅ `src-tauri/src/llm/traits.rs` - CloudLLMProvider trait 정의
   - ✅ `src-tauri/src/llm/types.rs` - 공통 타입 정의
   - ✅ `src-tauri/src/llm/security.rs` - API 키 보안 저장 (OS Keychain)

2. **Provider 구현**
   - ✅ `src-tauri/src/llm/providers/openai.rs` - OpenAI 구현
   - ⏳ Claude (Phase 2)
   - ⏳ Gemini (Phase 2)

3. **Tauri Commands**
   - ✅ `src-tauri/src/llm/commands.rs` - 모든 commands 구현
   - ✅ `src-tauri/src/main.rs` - Commands 등록 완료

4. **Dependencies**
   - ✅ `async-trait` - async trait 지원
   - ✅ `keyring` - OS keychain 접근
   - ✅ `thiserror` - 에러 타입 정의
   - ✅ `reqwest` - HTTP client (이미 있음)

---

## 🚀 빠른 시작 (Frontend)

### 1. TypeScript 타입 정의

`src/lib/types/cloud-llm.ts` 파일 생성:

\`\`\`typescript
// Cloud LLM Types

export interface CompletionRequest {
  messages: Message[];
  model: string;
  temperature?: number;
  max_tokens?: number;
  system_prompt?: string;
  metadata?: Record<string, string>;
}

export interface CompletionResponse {
  content: string;
  finish_reason: FinishReason;
  usage: TokenUsage;
  model: string;
  provider: string;
}

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export type FinishReason = 'stop' | 'length' | 'content_filter' | 'tool_calls';

export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ProviderConfig {
  name: string;
  enabled: boolean;
  default_model: string;
}

export type LLMBackend =
  | { type: 'local' }
  | { type: 'cloud'; provider: string };
\`\`\`

### 2. Tauri Client Wrapper

`src/lib/tauri/cloud-llm-client.ts` 파일 생성:

\`\`\`typescript
import { invoke } from '@tauri-apps/api/tauri';
import type { CompletionRequest, CompletionResponse } from '@/lib/types/cloud-llm';

export class CloudLLMClient {
  /**
   * API 키 설정 및 검증
   */
  static async setApiKey(provider: string, apiKey: string): Promise<string> {
    return invoke('set_cloud_api_key', {
      providerName: provider,
      apiKey,
    });
  }

  /**
   * API 키 테스트
   */
  static async testApiKey(provider: string, apiKey: string): Promise<boolean> {
    return invoke('test_cloud_api_key', {
      providerName: provider,
      apiKey,
    });
  }

  /**
   * 텍스트 완성 요청
   */
  static async complete(request: CompletionRequest): Promise<CompletionResponse> {
    return invoke('cloud_llm_complete', { request });
  }

  /**
   * API 키 존재 여부 확인
   */
  static async hasApiKey(provider: string): Promise<boolean> {
    return invoke('has_cloud_api_key', { providerName: provider });
  }

  /**
   * API 키 삭제
   */
  static async deleteApiKey(provider: string): Promise<void> {
    return invoke('delete_cloud_api_key', { providerName: provider });
  }

  /**
   * 지원하는 provider 목록
   */
  static async getSupportedProviders(): Promise<string[]> {
    return invoke('get_supported_providers');
  }

  /**
   * Provider의 지원 모델 목록
   */
  static async getProviderModels(provider: string): Promise<string[]> {
    return invoke('get_provider_models', { providerName: provider });
  }

  /**
   * Provider 초기화 (앱 시작 시)
   */
  static async initializeProvider(provider: string): Promise<void> {
    return invoke('initialize_cloud_provider', { providerName: provider });
  }
}
\`\`\`

### 3. React Hook 예시

`src/hooks/useCloudLLM.ts` 파일 생성:

\`\`\`typescript
import { useState } from 'react';
import { CloudLLMClient } from '@/lib/tauri/cloud-llm-client';
import type { CompletionRequest, CompletionResponse } from '@/lib/types/cloud-llm';

export function useCloudLLM() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const complete = async (request: CompletionRequest): Promise<CompletionResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await CloudLLMClient.complete(request);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    complete,
    loading,
    error,
  };
}
\`\`\`

### 4. 간단한 사용 예시

\`\`\`typescript
import { useCloudLLM } from '@/hooks/useCloudLLM';

export function ExampleComponent() {
  const { complete, loading, error } = useCloudLLM();

  const handleGenerate = async () => {
    const response = await complete({
      messages: [
        {
          role: 'user',
          content: 'Hello, how are you?',
        },
      ],
      model: 'gpt-4-turbo',
      temperature: 0.7,
    });

    if (response) {
      console.log('Response:', response.content);
      console.log('Tokens used:', response.usage.total_tokens);
    }
  };

  return (
    <div>
      <button onClick={handleGenerate} disabled={loading}>
        {loading ? 'Generating...' : 'Generate'}
      </button>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
\`\`\`

---

## 🔧 설정 UI 구현 가이드

### OpenAI 설정 화면 예시

\`\`\`typescript
import { useState, useEffect } from 'react';
import { CloudLLMClient } from '@/lib/tauri/cloud-llm-client';

export function OpenAISettings() {
  const [apiKey, setApiKey] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    // 앱 시작 시 API 키 존재 여부 확인
    CloudLLMClient.hasApiKey('openai').then(setHasKey);
  }, []);

  const handleTest = async () => {
    if (!apiKey) return;

    setTesting(true);
    setTestResult(null);

    try {
      const valid = await CloudLLMClient.testApiKey('openai', apiKey);
      if (valid) {
        setTestResult('✅ API 키가 유효합니다!');
      } else {
        setTestResult('❌ API 키가 유효하지 않습니다.');
      }
    } catch (error) {
      setTestResult(\`❌ 오류: \${error}\`);
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!apiKey) return;

    try {
      const message = await CloudLLMClient.setApiKey('openai', apiKey);
      alert(message);
      setHasKey(true);
      setApiKey(''); // 보안을 위해 입력 필드 초기화
    } catch (error) {
      alert(\`저장 실패: \${error}\`);
    }
  };

  const handleDelete = async () => {
    if (!confirm('정말로 API 키를 삭제하시겠습니까?')) return;

    try {
      await CloudLLMClient.deleteApiKey('openai');
      setHasKey(false);
      alert('API 키가 삭제되었습니다.');
    } catch (error) {
      alert(\`삭제 실패: \${error}\`);
    }
  };

  return (
    <div className="settings-panel">
      <h2>OpenAI 설정</h2>

      {hasKey ? (
        <div>
          <p>✅ API 키가 등록되어 있습니다.</p>
          <button onClick={handleDelete}>API 키 삭제</button>
        </div>
      ) : (
        <div>
          <h3>API 키 등록</h3>
          <ol>
            <li>
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
              >
                OpenAI Platform
              </a>
              에서 API 키 발급
            </li>
            <li>아래에 API 키를 입력하세요</li>
          </ol>

          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-proj-..."
            className="api-key-input"
          />

          <div className="button-group">
            <button onClick={handleTest} disabled={!apiKey || testing}>
              {testing ? '테스트 중...' : '연결 테스트'}
            </button>
            <button onClick={handleSave} disabled={!apiKey}>
              저장
            </button>
          </div>

          {testResult && <p>{testResult}</p>}
        </div>
      )}
    </div>
  );
}
\`\`\`

---

## 🧪 테스트

### Rust 테스트 실행

\`\`\`bash
cd src-tauri
cargo test
\`\`\`

### 수동 테스트 체크리스트

1. **API 키 저장**
   - [ ] OpenAI API 키 입력 및 저장
   - [ ] OS Keychain에 저장 확인 (macOS: Keychain Access 앱)

2. **API 키 검증**
   - [ ] 유효한 키로 테스트 성공
   - [ ] 잘못된 키로 테스트 실패

3. **LLM 완성 요청**
   - [ ] 간단한 프롬프트 전송
   - [ ] 응답 수신 및 토큰 사용량 확인

4. **에러 처리**
   - [ ] 네트워크 오류 처리
   - [ ] Rate limit 에러 처리
   - [ ] 잘못된 요청 에러 처리

---

## 📊 다음 단계

### Phase 2 (1-2주)

- [ ] Claude provider 구현
- [ ] Gemini provider 구현
- [ ] 스트리밍 응답 지원
- [ ] 비용 추적 기능

### Phase 3 (2-4주)

- [ ] 캐싱 시스템
- [ ] Rate limiting
- [ ] 사용량 분석 대시보드

---

## 🔒 보안 주의사항

1. **API 키 노출 방지**
   - ✅ API 키는 OS Keychain에만 저장
   - ✅ 로그에 API 키 출력 금지
   - ✅ Git에 API 키 커밋 금지

2. **데이터 최소화**
   - 필요한 데이터만 클라우드로 전송
   - 민감한 정보는 sanitization 후 전송 (Phase 2)

3. **에러 메시지**
   - 사용자에게 친화적인 메시지 표시
   - 기술적 세부사항은 로그에만 기록

---

## 💡 FAQ

### Q: API 키는 어디에 저장되나요?
A: OS의 보안 키체인에 암호화되어 저장됩니다.
- macOS: Keychain
- Windows: Credential Manager
- Linux: Secret Service

### Q: 로컬 모델과 클라우드 모델을 동시에 사용할 수 있나요?
A: 네, 가능합니다. 기본적으로 로컬 모델이 활성화되어 있고, 클라우드 모델은 선택적으로 설정할 수 있습니다.

### Q: 여러 provider를 동시에 설정할 수 있나요?
A: 네, OpenAI, Claude, Gemini를 모두 설정하고 상황에 맞게 선택할 수 있습니다.

---

## 📞 문의

구현 중 문제가 발생하면:
1. Rust 빌드 에러: `cargo clean && cargo build` 실행
2. TypeScript 타입 에러: 위 타입 정의 파일 참조
3. API 키 저장 실패: OS keychain 권한 확인
