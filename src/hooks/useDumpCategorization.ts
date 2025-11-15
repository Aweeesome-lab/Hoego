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
        temperature: 0.1, // Very low for consistent formatting
        max_tokens: 3000, // More tokens for detailed analysis
        system_prompt: 'You are an expert time analyst specializing in personal productivity. Analyze daily activity dumps with precision, calculate time spent per category, and present data in professional markdown tables.',
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
 * AI 카테고리화 프롬프트 생성 (Few-shot learning)
 * @param content 원본 마크다운 내용
 * @returns 카테고리화 프롬프트
 */
function buildCategorizationPrompt(content: string): string {
  return `당신은 하루 dump 내용을 분석하는 전문 시간 분석가입니다. 사용자의 dump를 분석하여 카테고리별 시간 사용 현황을 정리해주세요.

**분석 원칙:**
1. 타임스탬프 (HH:MM:SS)를 활용해 각 활동의 소요 시간 계산
2. 비슷한 활동을 카테고리로 묶어서 시간 집계
3. 마크다운 표 형식으로 카테고리별 시간과 비율 표시
4. 각 카테고리별 세부 활동 목록 작성

---

**예시 입력:**

- 오전 9시 기상 (09:00:00)
- 아침 먹고 샤워 (09:30:00)
- 러닝 3km, 발목 통증 (10:00:00)
- 업무 시작 - MVP 개발 (10:45:00)
- 점심 식사 (12:30:00)
- 업무 재개 - API 작업 (13:30:00)
- 유튜브 시청 (16:00:00)

**예시 출력:**

## 📋 카테고리별 시간 사용 분석

| 카테고리 | 총 시간 | 비율 |
|---------|---------|------|
| 작업 (개발/업무/빌드) | 4시간 15분 | 60.7% |
| 개인 루틴 (식사/샤워/정리 등) | 1시간 30분 | 21.4% |
| 운동 | 45분 | 10.7% |
| 오락/취미 | 30분 | 7.2% |

### 작업 (개발/업무/빌드) - 4시간 15분
- 업무 시작 - MVP 개발
- 업무 재개 - API 작업

### 개인 루틴 (식사/샤워/정리 등) - 1시간 30분
- 오전 9시 기상
- 아침 먹고 샤워
- 점심 식사

### 운동 - 45분
- 러닝 3km, 발목 통증

### 오락/취미 - 30분
- 유튜브 시청

---

**이제 다음 dump를 동일한 형식으로 분석해주세요:**

${content}

**분석 결과:**`;
}
