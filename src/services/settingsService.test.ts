/**
 * settingsService Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

import {
  getStoredThemeMode,
  saveThemeMode,
  getNextThemeMode,
  isDarkModeActive,
  getSystemDarkMode,
  isWindowSizeTooSmall,
  constrainWindowSize,
  type ThemeMode,
  type WindowSize,
} from './settingsService';

describe('settingsService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Theme Management', () => {
    it("should return 'system' as default theme mode", () => {
      const mode = getStoredThemeMode();
      expect(mode).toBe('system');
    });

    it('should return stored theme mode when valid value exists', () => {
      // Note: Zustand store uses "hoego-storage" key, not "hoego_theme_mode"
      // This test verifies the settingsService functions work independently
      localStorage.setItem('hoego_theme_mode', 'dark');
      const mode = getStoredThemeMode();
      // getStoredThemeMode reads from localStorage.getItem("hoego_theme_mode")
      // Our mock localStorage will return "dark"
      expect(mode).toBe('dark');
    });

    it('should save theme mode to localStorage', () => {
      saveThemeMode('dark');
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'hoego_theme_mode',
        'dark'
      );
    });

    it('should cycle through theme modes correctly', () => {
      expect(getNextThemeMode('light')).toBe('dark');
      expect(getNextThemeMode('dark')).toBe('system');
      expect(getNextThemeMode('system')).toBe('light');
    });

    it('should return system for invalid theme mode', () => {
      expect(getNextThemeMode('invalid' as ThemeMode)).toBe('system');
    });

    it('should correctly determine dark mode for light theme', () => {
      expect(isDarkModeActive('light')).toBe(false);
    });

    it('should correctly determine dark mode for dark theme', () => {
      expect(isDarkModeActive('dark')).toBe(true);
    });

    it('should use system preference for system theme', () => {
      const systemDark = getSystemDarkMode();
      expect(isDarkModeActive('system')).toBe(systemDark);
    });
  });

  describe('Window Size Constraints', () => {
    it('should detect window size too small - width', () => {
      const size: WindowSize = { width: 300, height: 500 };
      expect(isWindowSizeTooSmall(size)).toBe(true);
    });

    it('should detect window size too small - height', () => {
      const size: WindowSize = { width: 500, height: 150 };
      expect(isWindowSizeTooSmall(size)).toBe(true);
    });

    it('should detect window size too small - both', () => {
      const size: WindowSize = { width: 300, height: 150 };
      expect(isWindowSizeTooSmall(size)).toBe(true);
    });

    it('should detect window size is acceptable', () => {
      const size: WindowSize = { width: 400, height: 300 };
      expect(isWindowSizeTooSmall(size)).toBe(false);
    });

    it('should constrain window width to minimum', () => {
      const size: WindowSize = { width: 100, height: 500 };
      const constrained = constrainWindowSize(size);

      expect(constrained.width).toBeGreaterThanOrEqual(320);
      expect(constrained.height).toBe(500);
    });

    it('should constrain window height to minimum', () => {
      const size: WindowSize = { width: 500, height: 100 };
      const constrained = constrainWindowSize(size);

      expect(constrained.width).toBe(500);
      expect(constrained.height).toBeGreaterThanOrEqual(200);
    });

    it('should constrain both dimensions to minimum', () => {
      const size: WindowSize = { width: 100, height: 100 };
      const constrained = constrainWindowSize(size);

      expect(constrained.width).toBeGreaterThanOrEqual(320);
      expect(constrained.height).toBeGreaterThanOrEqual(200);
    });

    it('should not modify acceptable window size', () => {
      const size: WindowSize = { width: 800, height: 600 };
      const constrained = constrainWindowSize(size);

      expect(constrained.width).toBe(800);
      expect(constrained.height).toBe(600);
    });
  });
});
