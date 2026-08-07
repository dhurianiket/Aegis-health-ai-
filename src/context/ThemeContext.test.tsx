import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { ThemeProvider, useTheme } from './ThemeContext';

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
    vi.restoreAllMocks();
  });

  it('initializes with dark theme by default when localStorage is empty', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    );

    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('initializes with theme stored in localStorage', () => {
    localStorage.setItem('theme', 'light');

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    );

    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.theme).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('toggles theme using toggleTheme() and updates document.documentElement and localStorage', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    );

    const { result } = renderHook(() => useTheme(), { wrapper });

    // Initial is 'dark'
    expect(result.current.theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    // Toggle to 'light'
    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.theme).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('theme')).toBe('light');

    // Toggle back to 'dark'
    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('sets theme explicitly using setTheme()', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    );

    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => {
      result.current.setTheme('light');
    });

    expect(result.current.theme).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('theme')).toBe('light');

    act(() => {
      result.current.setTheme('dark');
    });

    expect(result.current.theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('synchronizes theme across multi-tab sessions via storage event listener', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    );

    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    // Simulate multi-tab storage event when another tab switches to 'light'
    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'theme',
          newValue: 'light',
          oldValue: 'dark',
        })
      );
    });

    expect(result.current.theme).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    // Simulate multi-tab storage event when another tab switches back to 'dark'
    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'theme',
          newValue: 'dark',
          oldValue: 'light',
        })
      );
    });

    expect(result.current.theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('ignores storage events with unrelated keys or invalid theme values', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    );

    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'other_key',
          newValue: 'light',
        })
      );
    });

    expect(result.current.theme).toBe('dark');

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'theme',
          newValue: 'invalid_theme',
        })
      );
    });

    expect(result.current.theme).toBe('dark');
  });

  it('provides safe fallback when useTheme is called outside ThemeProvider', () => {
    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe('dark');
    expect(() => {
      act(() => {
        result.current.toggleTheme();
        result.current.setTheme('light');
      });
    }).not.toThrow();
  });

  describe('Corrupt localStorage Values & Edge Cases Stress Testing', () => {
    const corruptValues = ['blue', '', 'null', 'undefined', 'invalid_theme', 'LIGHT', 'DARK', '123', '[object Object]'];

    corruptValues.forEach((corruptVal) => {
      it(`safely falls back to default 'dark' theme when localStorage has corrupt value: "${corruptVal}"`, () => {
        localStorage.setItem('theme', corruptVal);

        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <ThemeProvider>{children}</ThemeProvider>
        );

        const { result } = renderHook(() => useTheme(), { wrapper });

        expect(result.current.theme).toBe('dark');
        expect(document.documentElement.classList.contains('dark')).toBe(true);
      });
    });

    it('safely falls back to default "dark" theme when localStorage item is null (not set)', () => {
      localStorage.removeItem('theme');

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );

      const { result } = renderHook(() => useTheme(), { wrapper });

      expect(result.current.theme).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('handles synthetic StorageEvent multi-tab synchronization for "light" and "dark" newValues', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );

      const { result } = renderHook(() => useTheme(), { wrapper });
      expect(result.current.theme).toBe('dark');

      // Dispatch synthetic event to switch to 'light'
      act(() => {
        window.dispatchEvent(
          new StorageEvent('storage', { key: 'theme', newValue: 'light' })
        );
      });
      expect(result.current.theme).toBe('light');
      expect(document.documentElement.classList.contains('dark')).toBe(false);

      // Dispatch synthetic event to switch back to 'dark'
      act(() => {
        window.dispatchEvent(
          new StorageEvent('storage', { key: 'theme', newValue: 'dark' })
        );
      });
      expect(result.current.theme).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('ignores synthetic StorageEvents with corrupt or invalid newValues ("blue", "", null)', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );

      const { result } = renderHook(() => useTheme(), { wrapper });
      expect(result.current.theme).toBe('dark');

      const invalidStorageValues = ['blue', '', null, 'undefined', 'invalid', 'LIGHT'];

      invalidStorageValues.forEach((badValue) => {
        act(() => {
          window.dispatchEvent(
            new StorageEvent('storage', { key: 'theme', newValue: badValue })
          );
        });
        expect(result.current.theme).toBe('dark');
        expect(document.documentElement.classList.contains('dark')).toBe(true);
      });
    });

    it('handles rapid sequence of multi-tab StorageEvents correctly', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );

      const { result } = renderHook(() => useTheme(), { wrapper });

      const sequence = ['light', 'dark', 'light', 'dark', 'light'];
      sequence.forEach((mode) => {
        act(() => {
          window.dispatchEvent(
            new StorageEvent('storage', { key: 'theme', newValue: mode })
          );
        });
        expect(result.current.theme).toBe(mode);
        expect(document.documentElement.classList.contains('dark')).toBe(mode === 'dark');
      });
    });
  });

  describe('Empirical Stress & Boundary Tests', () => {
    it('handles 100+ rapid sequential toggle operations (with re-render per toggle)', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );

      const { result } = renderHook(() => useTheme(), { wrapper });

      let expectedTheme: 'dark' | 'light' = 'dark';
      expect(result.current.theme).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(localStorage.getItem('theme')).toBe('dark');

      for (let i = 1; i <= 100; i++) {
        expectedTheme = expectedTheme === 'dark' ? 'light' : 'dark';
        act(() => {
          result.current.toggleTheme();
        });

        // Assert 3-way consistency on every single toggle: React state, DOM classList, localStorage
        expect(result.current.theme).toBe(expectedTheme);
        expect(document.documentElement.classList.contains('dark')).toBe(expectedTheme === 'dark');
        expect(localStorage.getItem('theme')).toBe(expectedTheme);
      }
    });

    it('maintains 3-way state consistency during synchronous batch toggle operations in single handler context', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );

      const { result } = renderHook(() => useTheme(), { wrapper });

      // Call toggleTheme() 100 times synchronously in one act block
      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.toggleTheme();
        }
      });

      // Verify consistency between React state, DOM classList, and localStorage
      const themeState = result.current.theme;
      const hasDarkClass = document.documentElement.classList.contains('dark');
      const storageValue = localStorage.getItem('theme');

      expect(hasDarkClass).toBe(themeState === 'dark');
      expect(storageValue).toBe(themeState);
    });

    it('maintains state consistency across 500 interleaved toggleTheme and setTheme calls', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );

      const { result } = renderHook(() => useTheme(), { wrapper });

      for (let i = 0; i < 500; i++) {
        act(() => {
          if (i % 3 === 0) {
            result.current.setTheme('light');
          } else if (i % 3 === 1) {
            result.current.setTheme('dark');
          } else {
            result.current.toggleTheme();
          }
        });

        const currentTheme = result.current.theme;
        expect(document.documentElement.classList.contains('dark')).toBe(currentTheme === 'dark');
        expect(localStorage.getItem('theme')).toBe(currentTheme);
      }
    });

    it('handles localStorage throwing quota/security exception during theme update', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );

      const { result } = renderHook(() => useTheme(), { wrapper });

      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('QuotaExceededError', 'QuotaExceededError');
      });

      expect(() => {
        act(() => {
          result.current.toggleTheme();
        });
      }).not.toThrow();

      expect(result.current.theme).toBe('light');
      expect(document.documentElement.classList.contains('dark')).toBe(false);

      setItemSpy.mockRestore();
    });
  });
});

