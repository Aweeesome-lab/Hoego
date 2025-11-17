/**
 * AI 관련 타입 정의
 */

/**
 * 구조화된 피드백 인터페이스
 *
 * AI가 생성하는 5가지 섹션으로 구성된 피드백 구조
 */
export interface StructuredFeedback {
  /**
   * 즉시 실행 가능한 행동 목록
   * 체크박스 형태로 표시됨
   */
  todos: string[];

  /**
   * 사용자가 놓친 맥락이나 패턴
   * 1-2문장으로 된 인사이트
   */
  insights: string;

  /**
   * 최근 데이터 기반 반복 패턴
   * 지난 3-7일 덤프와 비교한 반복 패턴 (선택적)
   */
  patterns?: string;

  /**
   * 중기적 개선 방향
   * 1주일 단위 실천 가능한 제안
   */
  improvements: string;

  /**
   * 넛지형 피드백
   * 격려 또는 질문 (1문장)
   */
  suggestions: string;
}

/**
 * AI 파이프라인 단계
 */
export type PipelineStage = 'idle' | 'analyzing' | 'done' | 'error';
