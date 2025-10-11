import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, vi } from 'vitest';

// Add JSDOM polyfills for missing methods
beforeAll(() => {
  // Polyfill for matchMedia (required by useThemeEffect hook)
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Polyfill for hasPointerCapture (required by Radix UI)
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = function () {
      return false;
    };
  }

  // Polyfill for setPointerCapture (required by Radix UI)
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = function () {
      // No-op
    };
  }

  // Polyfill for releasePointerCapture (required by Radix UI)
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = function () {
      // No-op
    };
  }

  // Polyfill for scrollIntoView (required by Radix UI Select)
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = function () {
      // No-op
    };
  }

  // Suppress console errors in tests (they're often expected)
  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    // Suppress expected test errors
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Not implemented: HTMLFormElement.prototype.requestSubmit') ||
        args[0].includes('Not implemented'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

// Cleanup after each test
afterEach(() => {
  cleanup();
});
