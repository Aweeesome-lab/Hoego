import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';

import { CloudLLMClient } from '@/lib/cloud-llm';

/**
 * Dump 카테고리화 Hook
 * AI를 사용하여 dump 내용을 카테고리별로 분류하고 마크다운에 추가
 */
export function useDumpCategorization() {
  const [isCategorizingDump, setIsCategorizingDump] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Dump 내용을 AI로 카테고리화
   * @param content 현재 마크다운 내용
   * @returns 카테고리화된 섹션이 추가된 마크다운
   */
  const categorizeDump = useCallback(async (content: string): Promise<string> => {
    // Empty content check
    if (!content || content.trim().length === 0) {
      toast.error('카테고리화할 내용이 없습니다.');
      return content;
    }

    // Minimum content check (at least 50 characters)
    if (content.trim().length < 50) {
      toast.error('내용이 너무 짧습니다. 최소 50자 이상 작성해주세요.');
      return content;
    }

    setIsCategorizingDump(true);
    setError(null);

    try {
      // Check if API key exists
      const hasKey = await CloudLLMClient.hasApiKey('openai');
      if (!hasKey) {
        toast.error('OpenAI API 키가 설정되지 않았습니다. 설정에서 API 키를 등록해주세요.');
        return content;
      }

      // Call AI categorization
      const response = await CloudLLMClient.complete({
        messages: [
          {
            role: 'user',
            content: buildCategorizationPrompt(content),
          },
        ],
        model: 'gpt-4o-mini', // Fast and cost-effective
        temperature: 0.3, // Lower temperature for more consistent categorization
        max_tokens: 2000,
      });

      const categorizedSection = response.content.trim();

      // Validate response
      if (!categorizedSection || categorizedSection.length === 0) {
        toast.error('카테고리화 결과가 비어있습니다. 다시 시도해주세요.');
        return content;
      }

      // Append categorized section to markdown
      const separator = '\n\n---\n\n';
      const updatedContent = content + separator + categorizedSection;

      toast.success('카테고리화가 완료되었습니다!');
      return updatedContent;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (import.meta.env.DEV) {
        console.error('[hoego] Dump 카테고리화 실패:', err);
      }

      setError(errorMessage);

      // User-friendly error messages
      if (errorMessage.includes('API key')) {
        toast.error('API 키 오류입니다. 설정을 확인해주세요.');
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        toast.error('네트워크 오류입니다. 인터넷 연결을 확인해주세요.');
      } else if (errorMessage.includes('rate limit')) {
        toast.error('API 호출 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
      } else {
        toast.error(`카테고리화에 실패했습니다: ${errorMessage}`);
      }

      return content; // Return original content on error
    } finally {
      setIsCategorizingDump(false);
    }
  }, []);

  return {
    isCategorizingDump,
    categorizeDump,
    error,
  };
}

/**
 * AI 카테고리화 프롬프트 생성
 * @param content 원본 마크다운 내용
 * @returns 카테고리화 프롬프트
 */
function buildCategorizationPrompt(content: string): string {
  return `다음은 사용자가 하루 동안 작성한 dump 내용입니다. 이 내용을 분석하여 카테고리별로 정리해주세요.

**요구사항:**
1. 다음 기본 카테고리를 사용하세요: 업무(Work), 개인(Personal), 건강(Health), 사회활동(Social), 학습(Learning), 여가(Entertainment)
2. 필요하다면 추가 카테고리를 만들어도 좋습니다
3. 비슷한 주제나 맥락의 항목들을 같은 카테고리로 묶어주세요
4. 각 항목은 bullet point (-)로 표시하되, 원본 내용을 간결하게 요약해주세요
5. 타임스탬프 (HH:MM:SS)는 포함하지 마세요
6. 마크다운 형식으로 출력하되, 깔끔하고 읽기 쉽게 작성해주세요

**출력 형식:**
## 📋 카테고리별 정리

### 업무
- 항목1
- 항목2

### 개인
- 항목1
- 항목2

(기타 카테고리...)

**원본 내용:**
${content}

**카테고리별 정리:**`;
}
