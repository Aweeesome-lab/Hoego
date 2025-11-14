// Cloud LLM Client - Tauri command wrapper

import { invoke } from '@tauri-apps/api/tauri';
import type {
  CompletionRequest,
  CompletionResponse,
  CloudProvider,
} from '@/types/cloud-llm';

/**
 * Cloud LLM API Client
 * OpenAI, Claude, Gemini 등 클라우드 LLM과 통신하는 클라이언트
 */
export class CloudLLMClient {
  /**
   * API 키 설정 및 검증
   * @param provider Provider 이름 ('openai', 'claude', 'gemini')
   * @param apiKey API 키
   * @returns 성공 메시지
   */
  static async setApiKey(
    provider: CloudProvider,
    apiKey: string,
  ): Promise<string> {
    return invoke('set_cloud_api_key', {
      providerName: provider,
      apiKey,
    });
  }

  /**
   * API 키 테스트 (연결 확인)
   * @param provider Provider 이름
   * @param apiKey API 키
   * @returns 유효성 여부
   */
  static async testApiKey(
    provider: CloudProvider,
    apiKey: string,
  ): Promise<boolean> {
    return invoke('test_cloud_api_key', {
      providerName: provider,
      apiKey,
    });
  }

  /**
   * 텍스트 완성 요청
   * @param request 완성 요청 파라미터
   * @returns 완성 응답
   */
  static async complete(
    request: CompletionRequest,
  ): Promise<CompletionResponse> {
    return invoke('cloud_llm_complete', { request });
  }

  /**
   * API 키 존재 여부 확인
   * @param provider Provider 이름
   * @returns API 키가 저장되어 있는지 여부
   */
  static async hasApiKey(provider: CloudProvider): Promise<boolean> {
    return invoke('has_cloud_api_key', { providerName: provider });
  }

  /**
   * API 키 삭제
   * @param provider Provider 이름
   */
  static async deleteApiKey(provider: CloudProvider): Promise<void> {
    return invoke('delete_cloud_api_key', { providerName: provider });
  }

  /**
   * 지원하는 provider 목록 조회
   * @returns Provider 이름 배열
   */
  static async getSupportedProviders(): Promise<string[]> {
    return invoke('get_supported_providers');
  }

  /**
   * Provider의 지원 모델 목록 조회
   * @param provider Provider 이름
   * @returns 모델 이름 배열
   */
  static async getProviderModels(provider: CloudProvider): Promise<string[]> {
    return invoke('get_provider_models', { providerName: provider });
  }

  /**
   * Provider 초기화 (앱 시작 시 호출)
   * 저장된 API 키로 provider를 자동 초기화
   * @param provider Provider 이름
   */
  static async initializeProvider(provider: CloudProvider): Promise<void> {
    return invoke('initialize_cloud_provider', { providerName: provider });
  }
}

/**
 * 간단한 텍스트 완성 헬퍼 함수
 * @param prompt 사용자 프롬프트
 * @param model 사용할 모델 (기본: gpt-4-turbo)
 * @param options 추가 옵션
 * @returns 생성된 텍스트
 */
export async function generateText(
  prompt: string,
  model = 'gpt-4-turbo',
  options?: {
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
  },
): Promise<string> {
  const response = await CloudLLMClient.complete({
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    model,
    system_prompt: options?.systemPrompt,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens,
  });

  return response.content;
}
