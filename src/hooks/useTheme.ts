import { useEffect } from 'react';

import { useAppStore } from '@/store';

/**
 * 테마 관리 커스텀 훅
 *
 * Zustand 스토어를 사용하여 테마 상태를 관리합니다.
 * - themeMode: localStorage에 자동 저장
 * - isDarkMode: 시스템 테마 감지 및 자동 업데이트
 * - toggleTheme: light → dark → system 순환
 *
 * @example
 * ```tsx
 * const { themeMode, isDarkMode, toggleTheme } = useTheme();
 *
 * // 다크모드 여부에 따라 스타일 적용
 * <div className={isDarkMode ? "dark-mode" : "light-mode"}>
 *   <button onClick={toggleTheme}>테마 전환</button>
 * </div>
 * ```
 */
export function useTheme() {
  const themeMode = useAppStore((state) => state.themeMode);
  const isDarkMode = useAppStore((state) => state.isDarkMode);
  const setThemeMode = useAppStore((state) => state.setThemeMode);
  const setIsDarkMode = useAppStore((state) => state.setIsDarkMode);
  const toggleTheme = useAppStore((state) => state.toggleTheme);

  // 다크모드 테마 적용 (document.documentElement에 클래스 추가/제거)
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
    }
  }, [isDarkMode]);

  // System theme detection and update
  // themeMode가 "system"일 때만 시스템 테마 변경 감지
  useEffect(() => {
    if (themeMode !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsDarkMode(e.matches);
    };

    // Initial check
    handleChange(mediaQuery);

    // Listen for changes
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themeMode, setIsDarkMode]);

  // Update isDarkMode based on themeMode changes
  useEffect(() => {
    if (themeMode === 'light') {
      setIsDarkMode(false);
    } else if (themeMode === 'dark') {
      setIsDarkMode(true);
    }
    // For 'system', the effect above handles it
  }, [themeMode, setIsDarkMode]);

  // Cross-window theme synchronization
  // Zustand persist middleware handles this automatically via localStorage sync
  // This effect is kept for compatibility with external localStorage changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'hoego-storage' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed?.state?.themeMode) {
            const newMode = parsed.state.themeMode;
            if (
              newMode === 'light' ||
              newMode === 'dark' ||
              newMode === 'system'
            ) {
              setThemeMode(newMode);
            }
          }
        } catch (error) {
          if (import.meta.env.DEV) {
            console.error('[hoego] Failed to parse storage event:', error);
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [setThemeMode]);

  return {
    /**
     * 현재 테마 모드
     * @type {"light" | "dark" | "system"}
     */
    themeMode,

    /**
     * 다크모드 활성화 여부 (계산된 값)
     * themeMode가 "system"일 때는 시스템 설정을 따름
     * @type {boolean}
     */
    isDarkMode,

    /**
     * 테마 모드 전환 (light → dark → system → light)
     * @function
     */
    toggleTheme,
  };
}
