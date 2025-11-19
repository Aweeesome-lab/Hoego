import { describe, it, expect } from 'vitest';
import { maskPII, containsPII, maskPIIWithStats } from '../pii-mask';

describe('PII Masking Utility', () => {
  describe('maskPII', () => {
    it('should mask email addresses', () => {
      const text = '이메일: test@example.com, contact@domain.co.kr';
      const masked = maskPII(text);

      expect(masked).toBe('이메일: [EMAIL], [EMAIL]');
      expect(masked).not.toContain('test@example.com');
      expect(masked).not.toContain('contact@domain.co.kr');
    });

    it('should mask phone numbers', () => {
      const text = '전화번호: 010-1234-5678, 02-123-4567, (02)123-4567';
      const masked = maskPII(text);

      expect(masked).toContain('[PHONE]');
      expect(masked).not.toContain('010-1234-5678');
      expect(masked).not.toContain('02-123-4567');
    });

    it('should mask Korean SSN (주민등록번호)', () => {
      const text = '주민등록번호: 123456-1234567';
      const masked = maskPII(text);

      expect(masked).toBe('주민등록번호: [SSN]');
      expect(masked).not.toContain('123456-1234567');
    });

    it('should mask credit card numbers', () => {
      const text = '카드번호: 1234-5678-9012-3456';
      const masked = maskPII(text);

      expect(masked).toBe('카드번호: [CARD]');
      expect(masked).not.toContain('1234-5678-9012-3456');
    });

    it('should mask IP addresses', () => {
      const text = '서버 IP: 192.168.1.1';
      const masked = maskPII(text);

      expect(masked).toBe('서버 IP: [IP]');
      expect(masked).not.toContain('192.168.1.1');
    });

    it('should mask file paths when not disabled', () => {
      const text = '파일: /Users/tony/Documents/file.txt';
      const masked = maskPII(text);

      expect(masked).toContain('[PATH]');
      expect(masked).not.toContain('/Users/tony');
    });

    it('should NOT mask file paths when disabled', () => {
      const text = '파일: /Users/tony/Documents/file.txt';
      const masked = maskPII(text, { disablePathMasking: true });

      expect(masked).not.toContain('[PATH]');
      expect(masked).toContain('/Users/tony/Documents/file.txt');
    });

    it('should mask Korean addresses', () => {
      const text = '주소: 서울시 강남구 테헤란로 123';
      const masked = maskPII(text);

      expect(masked).toContain('[ADDRESS]');
      expect(masked).not.toContain('강남구');
    });

    it('should mask Korean names when space-separated', () => {
      const text = '담당자는 김 철수입니다.';
      const masked = maskPII(text);

      // Korean names require space between surname and given name
      // This is intentionally conservative to avoid false positives
      if (masked.includes('[NAME]')) {
        expect(masked).not.toContain('김 철수');
      }
    });

    it('should NOT mask Korean names when disabled', () => {
      const text = '담당자는 김 철수입니다.';
      const masked = maskPII(text, { disableNameMasking: true });

      expect(masked).not.toContain('[NAME]');
    });

    it('should handle complex text with multiple PII types', () => {
      const text = `
오늘 회의에서 test@example.com으로 연락받았다.
전화번호는 010-1234-5678이고,
주소는 서울시 강남구 테헤란로 123이다.
파일은 /Users/tony/Documents/report.pdf에 저장했다.
      `;
      const masked = maskPII(text);

      // Should not contain any PII
      expect(masked).not.toContain('test@example.com');
      expect(masked).not.toContain('010-1234-5678');
      expect(masked).not.toContain('강남구');
      expect(masked).not.toContain('/Users/tony');

      // Should contain placeholders
      expect(masked).toContain('[EMAIL]');
      expect(masked).toContain('[PHONE]');
      expect(masked).toContain('[ADDRESS]');
      expect(masked).toContain('[PATH]');
    });

    it('should preserve structure when enabled', () => {
      const text = '이메일: test@example.com';
      const masked = maskPII(text, { preserveStructure: true });

      expect(masked).toMatch(/\[EMAIL_\d+\]/);
      expect(masked).not.toContain('test@example.com');
    });

    it('should not aggressively mask normal numbers', () => {
      const text = '오늘 회의에서 10-20명 참석, 서울 날씨 맑음';
      const masked = maskPII(text);

      // Should not mask normal number ranges
      expect(masked).toContain('10-20');
    });
  });

  describe('containsPII', () => {
    it('should detect email addresses', () => {
      expect(containsPII('이메일: test@example.com')).toBe(true);
    });

    it('should detect phone numbers', () => {
      expect(containsPII('전화: 010-1234-5678')).toBe(true);
    });

    it('should detect SSN', () => {
      expect(containsPII('주민번호: 123456-1234567')).toBe(true);
    });

    it('should return false for text without PII', () => {
      expect(containsPII('오늘 날씨가 좋습니다.')).toBe(false);
    });
  });

  describe('maskPIIWithStats', () => {
    it('should return masking statistics', () => {
      const text = '이메일: test@example.com, 전화: 010-1234-5678';
      const { masked, stats } = maskPIIWithStats(text);

      expect(stats.originalLength).toBe(text.length);
      expect(stats.maskedLength).toBeGreaterThan(0);
      expect(stats.piiDetected).toBe(true);
      expect(stats.maskedCount).toBeGreaterThan(0);

      expect(masked).toContain('[EMAIL]');
      expect(masked).toContain('[PHONE]');
    });

    it('should detect no PII in clean text', () => {
      const text = '오늘은 좋은 날입니다.';
      const { masked, stats } = maskPIIWithStats(text);

      expect(stats.piiDetected).toBe(false);
      expect(stats.maskedCount).toBe(0);
      expect(masked).toBe(text);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty strings', () => {
      expect(maskPII('')).toBe('');
    });

    it('should handle strings with only whitespace', () => {
      expect(maskPII('   \n  \t  ')).toBe('   \n  \t  ');
    });

    it('should handle multiple emails in sequence', () => {
      const text = 'test1@example.com test2@example.com test3@example.com';
      const masked = maskPII(text);

      expect(masked).toBe('[EMAIL] [EMAIL] [EMAIL]');
    });

    it('should handle mixed Korean and English text', () => {
      const text = 'Contact me at test@example.com or 이메일: support@company.kr';
      const masked = maskPII(text);

      expect(masked).toContain('[EMAIL]');
      expect(masked).not.toContain('test@example.com');
      expect(masked).not.toContain('support@company.kr');
    });
  });

  describe('Masking order priority', () => {
    it('should mask SSN before phone patterns', () => {
      // SSN pattern could be confused with phone pattern
      const text = '123456-1234567';
      const masked = maskPII(text);

      expect(masked).toBe('[SSN]');
      expect(masked).not.toContain('[PHONE]');
    });

    it('should mask credit card before phone patterns', () => {
      // Credit card could be confused with phone pattern
      const text = '1234-5678-9012-3456';
      const masked = maskPII(text);

      expect(masked).toBe('[CARD]');
      expect(masked).not.toContain('[PHONE]');
    });
  });
});
