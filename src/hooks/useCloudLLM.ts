import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

import type {
  CompletionRequest,
  CompletionResponse,
  CloudProvider,
} from '@/types/cloud-llm';

import { CloudLLMClient, generateText } from '@/lib/cloud-llm';

export interface UseCloudLLMReturn {
  // State
  loading: boolean;
  error: string | null;
  response: CompletionResponse | null;

  // Actions
  complete: (request: CompletionRequest) => Promise<CompletionResponse | null>;
  generate: (prompt: string, model?: string) => Promise<string | null>;
  testApiKey: (provider: CloudProvider, apiKey: string) => Promise<boolean>;
  setApiKey: (provider: CloudProvider, apiKey: string) => Promise<boolean>;
  hasApiKey: (provider: CloudProvider) => Promise<boolean>;
  deleteApiKey: (provider: CloudProvider) => Promise<void>;

  // Utils
  clearError: () => void;
  clearResponse: () => void;
}

/**
 * Cloud LLM Hook
 * OpenAI, Claude, Gemini 등 클라우드 LLM 사용을 위한 hook
 */
export function useCloudLLM(): UseCloudLLMReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<CompletionResponse | null>(null);

  /**
   * 텍스트 완성 요청
   */
  const complete = useCallback(
    async (request: CompletionRequest): Promise<CompletionResponse | null> => {
      setLoading(true);
      setError(null);
      setResponse(null);

      try {
        const result = await CloudLLMClient.complete(request);
        setResponse(result);
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);

        if (import.meta.env.DEV) {
          console.error('[Cloud LLM] Complete failed:', err);
        }

        toast.error(`LLM 요청 실패: ${errorMessage}`);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * 간단한 텍스트 생성
   */
  const generate = useCallback(
    async (prompt: string, model = 'gpt-4-turbo'): Promise<string | null> => {
      setLoading(true);
      setError(null);

      try {
        const text = await generateText(prompt, model);
        return text;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);

        if (import.meta.env.DEV) {
          console.error('[Cloud LLM] Generate failed:', err);
        }

        toast.error(`텍스트 생성 실패: ${errorMessage}`);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * API 키 테스트
   */
  const testApiKey = useCallback(
    async (provider: CloudProvider, apiKey: string): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const isValid = await CloudLLMClient.testApiKey(provider, apiKey);
        if (isValid) {
          toast.success(`${provider} API 키가 유효합니다`);
        } else {
          toast.error(`${provider} API 키가 유효하지 않습니다`);
        }
        return isValid;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);

        if (import.meta.env.DEV) {
          console.error('[Cloud LLM] Test API key failed:', err);
        }

        toast.error(`API 키 테스트 실패: ${errorMessage}`);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * API 키 설정 및 저장
   */
  const setApiKey = useCallback(
    async (provider: CloudProvider, apiKey: string): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        await CloudLLMClient.setApiKey(provider, apiKey);
        toast.success(`${provider} API 키가 저장되었습니다`);
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);

        if (import.meta.env.DEV) {
          console.error('[Cloud LLM] Set API key failed:', err);
        }

        toast.error(`API 키 저장 실패: ${errorMessage}`);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * API 키 존재 여부 확인
   */
  const hasApiKey = useCallback(
    async (provider: CloudProvider): Promise<boolean> => {
      try {
        return await CloudLLMClient.hasApiKey(provider);
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('[Cloud LLM] Check API key failed:', err);
        }
        return false;
      }
    },
    []
  );

  /**
   * API 키 삭제
   */
  const deleteApiKey = useCallback(
    async (provider: CloudProvider): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        await CloudLLMClient.deleteApiKey(provider);
        toast.success(`${provider} API 키가 삭제되었습니다`);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);

        if (import.meta.env.DEV) {
          console.error('[Cloud LLM] Delete API key failed:', err);
        }

        toast.error(`API 키 삭제 실패: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * 에러 초기화
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * 응답 초기화
   */
  const clearResponse = useCallback(() => {
    setResponse(null);
  }, []);

  return {
    loading,
    error,
    response,
    complete,
    generate,
    testApiKey,
    setApiKey,
    hasApiKey,
    deleteApiKey,
    clearError,
    clearResponse,
  };
}
