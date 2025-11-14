/**
 * useTheme Hook Tests
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { useTheme } from './useTheme';

import { useAppStore } from '@/store';

// Mock Zustand store
vi.mock('@/store', () => ({
  useAppStore: vi.fn(),
}));

describe('useTheme', () => {
  let mockStore: {
    themeMode: 'light' | 'dark' | 'system';
    isDarkMode: boolean;
    setThemeMode: ReturnType<typeof vi.fn>;
    setIsDarkMode: ReturnType<typeof vi.fn>;
    toggleTheme: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    // Reset mock store state
    mockStore = {
      themeMode: 'system',
      isDarkMode: false,
      setThemeMode: vi.fn((mode) => {
        mockStore.themeMode = mode;
      }),
      setIsDarkMode: vi.fn((value) => {
        mockStore.isDarkMode = value;
      }),
      toggleTheme: vi.fn(() => {
        if (mockStore.themeMode === 'light') mockStore.themeMode = 'dark';
        else if (mockStore.themeMode === 'dark') mockStore.themeMode = 'system';
        else mockStore.themeMode = 'light';
      }),
    };

    // Setup Zustand store mock to return values from mockStore
    (useAppStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector) => {
        return selector(mockStore);
      }
    );

    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should initialize with system theme mode by default', () => {
    const { result } = renderHook(() => useTheme());

    expect(result.current.themeMode).toBe('system');
    expect(result.current.isDarkMode).toBe(false);
  });

  it('should initialize with stored theme mode', () => {
    mockStore.themeMode = 'dark';
    mockStore.isDarkMode = true;

    const { result } = renderHook(() => useTheme());

    expect(result.current.themeMode).toBe('dark');
    expect(result.current.isDarkMode).toBe(true);
  });

  it('should toggle theme mode correctly', () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.toggleTheme();
    });

    expect(mockStore.toggleTheme).toHaveBeenCalled();
  });

  it('should handle storage events from other windows', () => {
    renderHook(() => useTheme());

    act(() => {
      const storageData = {
        state: { themeMode: 'dark' },
      };
      const event = new StorageEvent('storage', {
        key: 'hoego-storage',
        newValue: JSON.stringify(storageData),
      });
      window.dispatchEvent(event);
    });

    expect(mockStore.setThemeMode).toHaveBeenCalledWith('dark');
  });

  it('should correctly handle light theme', () => {
    mockStore.themeMode = 'light';
    mockStore.isDarkMode = false;

    const { result } = renderHook(() => useTheme());

    expect(result.current.themeMode).toBe('light');
    expect(result.current.isDarkMode).toBe(false);
  });

  it('should correctly handle dark theme', () => {
    mockStore.themeMode = 'dark';
    mockStore.isDarkMode = true;

    const { result } = renderHook(() => useTheme());

    expect(result.current.themeMode).toBe('dark');
    expect(result.current.isDarkMode).toBe(true);
  });

  it('should handle system theme preference', () => {
    mockStore.themeMode = 'system';

    const { result } = renderHook(() => useTheme());

    expect(result.current.themeMode).toBe('system');
  });

  it('should provide all required properties', () => {
    const { result } = renderHook(() => useTheme());

    expect(result.current).toHaveProperty('themeMode');
    expect(result.current).toHaveProperty('isDarkMode');
    expect(result.current).toHaveProperty('toggleTheme');

    expect(typeof result.current.themeMode).toBe('string');
    expect(typeof result.current.isDarkMode).toBe('boolean');
    expect(typeof result.current.toggleTheme).toBe('function');
  });

  it('should ignore invalid storage event data', () => {
    renderHook(() => useTheme());

    act(() => {
      const event = new StorageEvent('storage', {
        key: 'hoego-storage',
        newValue: 'invalid-json',
      });
      window.dispatchEvent(event);
    });

    // Should not call setThemeMode for invalid data
    expect(mockStore.setThemeMode).not.toHaveBeenCalled();
  });
});
