import { describe, it, expect } from 'vitest';
import {
  isDefined,
  isNonEmptyString,
  isValidNumber,
  isPositiveNumber,
  isValidDate,
  isArray,
  isNonEmptyArray,
  isObject,
  hasProperty,
  hasProperties,
  hasDiscriminator,
  isOneOf,
  isPromise,
  isError,
  isErrorWithCode,
  isApiResponse,
  isPaginationMeta,
  isPaginatedResponse,
  createObjectGuard,
  createArrayGuard,
  assertIs,
  assertNever,
} from './guards';

describe('Type guard utilities', () => {
  describe('isDefined', () => {
    it('should return true for defined values', () => {
      expect(isDefined(0)).toBe(true);
      expect(isDefined('')).toBe(true);
      expect(isDefined(false)).toBe(true);
    });

    it('should return false for null and undefined', () => {
      expect(isDefined(null)).toBe(false);
      expect(isDefined(undefined)).toBe(false);
    });
  });

  describe('isNonEmptyString', () => {
    it('should return true for non-empty strings', () => {
      expect(isNonEmptyString('hello')).toBe(true);
      expect(isNonEmptyString('  test  ')).toBe(true);
    });

    it('should return false for empty or whitespace strings', () => {
      expect(isNonEmptyString('')).toBe(false);
      expect(isNonEmptyString('   ')).toBe(false);
      expect(isNonEmptyString(123)).toBe(false);
    });
  });

  describe('isValidNumber', () => {
    it('should return true for valid numbers', () => {
      expect(isValidNumber(123)).toBe(true);
      expect(isValidNumber(0)).toBe(true);
      expect(isValidNumber(-42)).toBe(true);
      expect(isValidNumber(3.14)).toBe(true);
    });

    it('should return false for invalid numbers', () => {
      expect(isValidNumber(NaN)).toBe(false);
      expect(isValidNumber(Infinity)).toBe(false);
      expect(isValidNumber('123')).toBe(false);
    });
  });

  describe('isPositiveNumber', () => {
    it('should return true for positive numbers', () => {
      expect(isPositiveNumber(1)).toBe(true);
      expect(isPositiveNumber(42)).toBe(true);
      expect(isPositiveNumber(0.1)).toBe(true);
    });

    it('should return false for zero and negative numbers', () => {
      expect(isPositiveNumber(0)).toBe(false);
      expect(isPositiveNumber(-1)).toBe(false);
    });
  });

  describe('isValidDate', () => {
    it('should return true for valid dates', () => {
      expect(isValidDate(new Date())).toBe(true);
      expect(isValidDate(new Date('2024-01-15'))).toBe(true);
    });

    it('should return false for invalid dates', () => {
      expect(isValidDate(new Date('invalid'))).toBe(false);
      expect(isValidDate('2024-01-15')).toBe(false);
    });
  });

  describe('isArray', () => {
    it('should return true for arrays', () => {
      expect(isArray([])).toBe(true);
      expect(isArray([1, 2, 3])).toBe(true);
    });

    it('should return false for non-arrays', () => {
      expect(isArray({})).toBe(false);
      expect(isArray('array')).toBe(false);
    });
  });

  describe('isNonEmptyArray', () => {
    it('should return true for non-empty arrays', () => {
      expect(isNonEmptyArray([1])).toBe(true);
      expect(isNonEmptyArray([1, 2, 3])).toBe(true);
    });

    it('should return false for empty arrays', () => {
      expect(isNonEmptyArray([])).toBe(false);
      expect(isNonEmptyArray({})).toBe(false);
    });
  });

  describe('isObject', () => {
    it('should return true for plain objects', () => {
      expect(isObject({})).toBe(true);
      expect(isObject({ key: 'value' })).toBe(true);
    });

    it('should return false for arrays, dates, and null', () => {
      expect(isObject([])).toBe(false);
      expect(isObject(new Date())).toBe(false);
      expect(isObject(null)).toBe(false);
      expect(isObject('string')).toBe(false);
    });
  });

  describe('hasProperty', () => {
    it('should return true if object has property', () => {
      expect(hasProperty({ name: 'test' }, 'name')).toBe(true);
    });

    it('should return false if property is missing', () => {
      expect(hasProperty({}, 'name')).toBe(false);
      expect(hasProperty('string', 'name')).toBe(false);
    });
  });

  describe('hasProperties', () => {
    it('should return true if object has all properties', () => {
      const obj = { id: '1', name: 'test', age: 25 };
      expect(hasProperties(obj, ['id', 'name'])).toBe(true);
    });

    it('should return false if any property is missing', () => {
      const obj = { id: '1' };
      expect(hasProperties(obj, ['id', 'name'])).toBe(false);
    });
  });

  describe('hasDiscriminator', () => {
    it('should return true if discriminator matches', () => {
      const obj = { type: 'user', name: 'test' };
      expect(hasDiscriminator(obj, 'type', 'user')).toBe(true);
    });

    it('should return false if discriminator does not match', () => {
      const obj = { type: 'admin' };
      expect(hasDiscriminator(obj, 'type', 'user')).toBe(false);
    });
  });

  describe('isOneOf', () => {
    it('should return true if value is in allowed list', () => {
      const statuses = ['pending', 'active', 'inactive'] as const;
      expect(isOneOf('active', statuses)).toBe(true);
    });

    it('should return false if value is not in allowed list', () => {
      const statuses = ['pending', 'active', 'inactive'] as const;
      expect(isOneOf('deleted', statuses)).toBe(false);
    });
  });

  describe('isPromise', () => {
    it('should return true for promises', () => {
      expect(isPromise(Promise.resolve(42))).toBe(true);
      expect(isPromise(new Promise(() => {}))).toBe(true);
    });

    it('should return false for non-promises', () => {
      expect(isPromise({})).toBe(false);
      expect(isPromise({ then: 'not a function' })).toBe(false);
    });
  });

  describe('isError', () => {
    it('should return true for Error instances', () => {
      expect(isError(new Error('test'))).toBe(true);
      expect(isError(new TypeError('test'))).toBe(true);
    });

    it('should return false for non-errors', () => {
      expect(isError('error')).toBe(false);
      expect(isError({ message: 'error' })).toBe(false);
    });
  });

  describe('isErrorWithCode', () => {
    it('should return true for errors with code property', () => {
      const error = new Error('test');
      (error as any).code = 'ERR_TEST';
      expect(isErrorWithCode(error)).toBe(true);
    });

    it('should return false for errors without code', () => {
      expect(isErrorWithCode(new Error('test'))).toBe(false);
    });
  });

  describe('isApiResponse', () => {
    it('should return true for valid success responses', () => {
      expect(isApiResponse({ success: true, data: { id: '1' } })).toBe(true);
    });

    it('should return true for valid error responses', () => {
      expect(isApiResponse({ success: false, error: 'Failed' })).toBe(true);
      expect(isApiResponse({ success: false, message: 'Failed' })).toBe(true);
    });

    it('should return false for invalid responses', () => {
      expect(isApiResponse({ data: {} })).toBe(false);
      expect(isApiResponse('response')).toBe(false);
    });
  });

  describe('isPaginationMeta', () => {
    it('should return true for valid pagination metadata', () => {
      expect(
        isPaginationMeta({
          page: 1,
          limit: 10,
          total: 100,
          totalPages: 10,
        }),
      ).toBe(true);
    });

    it('should return false for invalid metadata', () => {
      expect(
        isPaginationMeta({
          page: 1,
          limit: 10,
        }),
      ).toBe(false);
    });
  });

  describe('isPaginatedResponse', () => {
    it('should return true for valid paginated responses', () => {
      expect(
        isPaginatedResponse({
          data: [{ id: '1' }, { id: '2' }],
          meta: { page: 1, limit: 10, total: 100, totalPages: 10 },
        }),
      ).toBe(true);
    });

    it('should validate items with custom guard', () => {
      const isUser = (value: unknown): value is { id: string } => {
        return isObject(value) && typeof value.id === 'string';
      };

      expect(
        isPaginatedResponse(
          {
            data: [{ id: '1' }, { id: '2' }],
            meta: { page: 1, limit: 10, total: 100, totalPages: 10 },
          },
          isUser,
        ),
      ).toBe(true);

      expect(
        isPaginatedResponse(
          {
            data: [{ name: 'test' }],
            meta: { page: 1, limit: 10, total: 100, totalPages: 10 },
          },
          isUser,
        ),
      ).toBe(false);
    });
  });

  describe('createObjectGuard', () => {
    it('should create a type guard for object shapes', () => {
      const isUser = createObjectGuard({
        id: isNonEmptyString,
        email: isNonEmptyString,
        age: isPositiveNumber,
      });

      expect(isUser({ id: '1', email: 'test@example.com', age: 25 })).toBe(true);
      expect(isUser({ id: '1', email: 'test@example.com' })).toBe(false);
      expect(isUser({ id: '', email: 'test@example.com', age: 25 })).toBe(false);
    });
  });

  describe('createArrayGuard', () => {
    it('should create a type guard for arrays of specific types', () => {
      const isStringArray = createArrayGuard(isNonEmptyString);

      expect(isStringArray(['a', 'b', 'c'])).toBe(true);
      expect(isStringArray(['a', '', 'c'])).toBe(false);
      expect(isStringArray([1, 2, 3])).toBe(false);
    });
  });

  describe('assertIs', () => {
    it('should not throw for valid values', () => {
      expect(() => assertIs('test', isNonEmptyString)).not.toThrow();
    });

    it('should throw for invalid values', () => {
      expect(() => assertIs('', isNonEmptyString)).toThrow(TypeError);
      expect(() => assertIs('', isNonEmptyString, 'Custom error')).toThrow('Custom error');
    });
  });

  describe('assertNever', () => {
    it('should throw with the unexpected value', () => {
      const value = 'unexpected' as never;
      expect(() => assertNever(value)).toThrow('Unexpected value: unexpected');
    });
  });
});
