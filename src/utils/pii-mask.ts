/**
 * PII (Personally Identifiable Information) Masking Utility
 *
 * AI 피드백 전송 전에 개인정보를 마스킹 처리합니다.
 * 이메일, 전화번호, 주민등록번호, 신용카드, IP, 파일 경로 등을 보호합니다.
 */

/**
 * 이메일 마스킹 패턴
 * example@domain.com → [EMAIL]
 */
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;

/**
 * 전화번호 마스킹 패턴 (한국)
 * 010-1234-5678, 02-123-4567, (02)123-4567, 01012345678 → [PHONE]
 */
const PHONE_REGEX = /(\d{2,3}[-\s]?\d{3,4}[-\s]?\d{4}|\(\d{2,3}\)\s?\d{3,4}[-\s]?\d{4})/g;

/**
 * 주민등록번호 마스킹 패턴
 * 123456-1234567 or 1234561234567 → [SSN]
 */
const SSN_REGEX = /\b\d{6}[-]?\d{7}\b/g;

/**
 * 신용카드 번호 마스킹 패턴
 * 1234-5678-9012-3456 or 1234567890123456 → [CARD]
 */
const CARD_REGEX = /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g;

/**
 * IPv4 주소 마스킹 패턴
 * 192.168.1.1 → [IP]
 */
const IP_REGEX = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;

/**
 * 파일 경로 마스킹 패턴
 * /Users/username/..., C:\Users\..., ~/Documents/... → [PATH]
 */
const PATH_REGEX = /(?:[A-Za-z]:\\|\/|~\/)[\w\-./\\]+/g;

/**
 * 한국 주소 마스킹 패턴
 * 서울시 강남구 테헤란로 123 → [ADDRESS]
 */
const ADDRESS_REGEX =
  /[가-힣]+(?:시|도|군|구)\s+[가-힣]+(?:시|군|구|동|읍|면)\s*[\d가-힣\s-]*/g;

/**
 * 한국 이름 마스킹 패턴 (휴리스틱)
 * 김 철수, 박 영희 → [NAME]
 * Note: 공백이 필수이며, false positive를 줄이기 위해 보수적으로 설정
 */
const KOREAN_NAME_REGEX = /\b[가-힣]{1,2}\s[가-힣]{2,3}\b/g;

/**
 * PII 마스킹 옵션
 */
export interface MaskOptions {
  /**
   * true일 경우 마스킹된 내용의 길이 정보를 포함합니다.
   * 예: [EMAIL_20] 대신 [EMAIL]
   */
  preserveStructure?: boolean;

  /**
   * true일 경우 한국 이름 패턴 마스킹을 비활성화합니다.
   * (false positive 방지)
   */
  disableNameMasking?: boolean;

  /**
   * true일 경우 파일 경로 마스킹을 비활성화합니다.
   */
  disablePathMasking?: boolean;
}

/**
 * PII를 마스킹합니다
 *
 * @param text - 마스킹할 텍스트
 * @param options - 마스킹 옵션
 * @returns 마스킹된 텍스트
 */
/**
 * PII 마스킹 함수
 *
 * 마스킹 순서 (구체적인 것부터 일반적인 것 순):
 * 1. Korean SSN (주민등록번호) - 가장 구체적인 패턴
 * 2. Credit card numbers - 4-4-4-4 특정 패턴
 * 3. Phone numbers - 더 일반적인 패턴
 * 4. Emails
 * 5. IP addresses
 * 6. File paths (optional)
 * 7. Korean addresses
 * 8. Korean names (optional) - 가장 보수적, false positive 방지를 위해 마지막
 */
export function maskPII(text: string, options: MaskOptions = {}): string {
  const { preserveStructure = false, disableNameMasking = false, disablePathMasking = false } = options;

  let result = text;

  // Helper function to create mask placeholder
  const createMask = (type: string, originalLength: number): string => {
    return preserveStructure ? `[${type}_${originalLength}]` : `[${type}]`;
  };

  // 1. Mask Korean SSN (주민등록번호) - FIRST to avoid conflicts with phone patterns
  result = result.replace(SSN_REGEX, (match) => createMask('SSN', match.length));

  // 2. Mask credit card numbers - SECOND to avoid conflicts with phone patterns
  result = result.replace(CARD_REGEX, (match) => createMask('CARD', match.length));

  // 3. Mask phone numbers
  result = result.replace(PHONE_REGEX, (match) => createMask('PHONE', match.length));

  // 4. Mask emails
  result = result.replace(EMAIL_REGEX, (match) => createMask('EMAIL', match.length));

  // 5. Mask IP addresses
  result = result.replace(IP_REGEX, (match) => createMask('IP', match.length));

  // 6. Mask file paths (optional)
  if (!disablePathMasking) {
    result = result.replace(PATH_REGEX, (match) => createMask('PATH', match.length));
  }

  // 7. Mask Korean addresses
  result = result.replace(ADDRESS_REGEX, (match) => createMask('ADDRESS', match.length));

  // 8. Mask Korean names (optional, most conservative - do last to avoid false positives)
  if (!disableNameMasking) {
    result = result.replace(KOREAN_NAME_REGEX, (match) => createMask('NAME', match.length));
  }

  return result;
}

/**
 * 텍스트에 PII가 포함되어 있는지 확인합니다
 *
 * @param text - 확인할 텍스트
 * @returns PII 포함 여부
 */
export function containsPII(text: string): boolean {
  return (
    EMAIL_REGEX.test(text) ||
    PHONE_REGEX.test(text) ||
    SSN_REGEX.test(text) ||
    CARD_REGEX.test(text) ||
    IP_REGEX.test(text) ||
    ADDRESS_REGEX.test(text) ||
    KOREAN_NAME_REGEX.test(text)
  );
}

/**
 * 마스킹 통계 정보
 */
export interface MaskingStats {
  /** 원본 텍스트 길이 */
  originalLength: number;
  /** 마스킹된 텍스트 길이 */
  maskedLength: number;
  /** PII 감지 여부 */
  piiDetected: boolean;
  /** 마스킹된 항목 수 */
  maskedCount: number;
}

/**
 * 마스킹 통계를 포함하여 PII를 마스킹합니다
 *
 * @param text - 마스킹할 텍스트
 * @param options - 마스킹 옵션
 * @returns 마스킹된 텍스트와 통계 정보
 */
export function maskPIIWithStats(
  text: string,
  options: MaskOptions = {}
): { masked: string; stats: MaskingStats } {
  const original = text;
  const masked = maskPII(text, options);

  // Count number of masked items by comparing differences
  const maskedCount = (masked.match(/\[(EMAIL|PHONE|SSN|CARD|IP|PATH|ADDRESS|NAME)(_\d+)?\]/g) || []).length;

  return {
    masked,
    stats: {
      originalLength: original.length,
      maskedLength: masked.length,
      piiDetected: original !== masked,
      maskedCount,
    },
  };
}

/**
 * 개발 환경에서 마스킹 전후 비교를 로깅합니다
 *
 * @param text - 원본 텍스트
 * @param options - 마스킹 옵션
 */
export function logMaskingComparison(text: string, options: MaskOptions = {}): void {
  if (import.meta.env.DEV) {
    const { masked, stats } = maskPIIWithStats(text, options);

    console.group('[PII Masking]');
    console.log('Original length:', stats.originalLength, 'chars');
    console.log('Masked length:', stats.maskedLength, 'chars');
    console.log('PII detected:', stats.piiDetected);
    console.log('Masked items:', stats.maskedCount);

    if (stats.piiDetected) {
      console.warn('⚠️ PII detected and masked');
      console.log('First 200 chars (original):', text.slice(0, 200));
      console.log('First 200 chars (masked):', masked.slice(0, 200));
    } else {
      console.log('✅ No PII detected');
    }

    console.groupEnd();
  }
}
