import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useThemeEffect } from './useThemeEffect';
import { useUIStore } from '@/store';

// Mock the UI store
vi.mock('@/store', () => ({
  useUIStore: vi.fn(),
}));

describe('useThemeEffect', () => {
  let mockMediaQuery: {
    matches: boolean;
    addEventListener: ReturnType<typeof vi.fn>;
    removeEventListener: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    // Reset DOM
    document.documentElement.className = '';

    // Mock matchMedia
    mockMediaQuery = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    window.matchMedia = vi.fn(() => mockMediaQuery as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('light theme', () => {
    it('should apply light class to document root', () => {
      vi.mocked(useUIStore).mockReturnValue({ theme: 'light' } as any);

      renderHook(() => useThemeEffect());

      expect(document.documentElement.classList.contains('light')).toBe(true);
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });

  describe('dark theme', () => {
    it('should apply dark class to document root', () => {
      vi.mocked(useUIStore).mockReturnValue({ theme: 'dark' } as any);

      renderHook(() => useThemeEffect());

      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(document.documentElement.classList.contains('light')).toBe(false);
    });
  });

  describe('system theme', () => {
    it('should apply light class when system prefers light', () => {
      vi.mocked(useUIStore).mockReturnValue({ theme: 'system' } as any);
      mockMediaQuery.matches = false; // System prefers light

      renderHook(() => useThemeEffect());

      expect(document.documentElement.classList.contains('light')).toBe(true);
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('should apply dark class when system prefers dark', () => {
      vi.mocked(useUIStore).mockReturnValue({ theme: 'system' } as any);
      mockMediaQuery.matches = true; // System prefers dark

      renderHook(() => useThemeEffect());

      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(document.documentElement.classList.contains('light')).toBe(false);
    });

    it('should listen for system theme changes', () => {
      vi.mocked(useUIStore).mockReturnValue({ theme: 'system' } as any);

      renderHook(() => useThemeEffect());

      expect(mockMediaQuery.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('should cleanup event listener on unmount', () => {
      vi.mocked(useUIStore).mockReturnValue({ theme: 'system' } as any);

      const { unmount } = renderHook(() => useThemeEffect());
      unmount();

      expect(mockMediaQuery.removeEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function),
      );
    });

    it('should update theme when system preference changes', () => {
      vi.mocked(useUIStore).mockReturnValue({ theme: 'system' } as any);
      mockMediaQuery.matches = false;

      renderHook(() => useThemeEffect());

      // Initial state - light
      expect(document.documentElement.classList.contains('light')).toBe(true);

      // Simulate system theme change to dark
      mockMediaQuery.matches = true;
      const changeHandler = mockMediaQuery.addEventListener.mock.calls[0][1];
      changeHandler();

      // Should now be dark
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(document.documentElement.classList.contains('light')).toBe(false);
    });
  });

  describe('theme switching', () => {
    it('should remove old class when theme changes', () => {
      const { rerender } = renderHook(
        ({ theme }) => {
          vi.mocked(useUIStore).mockReturnValue({ theme } as any);
          useThemeEffect();
        },
        { initialProps: { theme: 'light' as const } },
      );

      expect(document.documentElement.classList.contains('light')).toBe(true);

      rerender({ theme: 'dark' as const });

      expect(document.documentElement.classList.contains('light')).toBe(false);
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should cleanup system listener when switching to explicit theme', () => {
      const { rerender } = renderHook(
        ({ theme }) => {
          vi.mocked(useUIStore).mockReturnValue({ theme } as any);
          useThemeEffect();
        },
        { initialProps: { theme: 'system' as const } },
      );

      expect(mockMediaQuery.addEventListener).toHaveBeenCalled();

      rerender({ theme: 'light' as const });

      expect(mockMediaQuery.removeEventListener).toHaveBeenCalled();
    });
  });
});
