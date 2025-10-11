import { describe, it, expect } from 'vitest';
import { Result, Option } from './result';

describe('Result type utilities', () => {
  describe('Result.ok', () => {
    it('should create a successful result', () => {
      const result = Result.ok(42);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(42);
      }
    });

    it('should create a result with complex data', () => {
      const data = { id: '123', name: 'Test User' };
      const result = Result.ok(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(data);
      }
    });
  });

  describe('Result.err', () => {
    it('should create an error result', () => {
      const result = Result.err('Something went wrong');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Something went wrong');
      }
    });

    it('should create a result with error object', () => {
      const error = new Error('Test error');
      const result = Result.err(error);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(error);
      }
    });
  });

  describe('Result.isOk', () => {
    it('should return true for successful results', () => {
      const result = Result.ok(123);
      expect(Result.isOk(result)).toBe(true);
    });

    it('should return false for error results', () => {
      const result = Result.err('failure');
      expect(Result.isOk(result)).toBe(false);
    });
  });

  describe('Result.isErr', () => {
    it('should return true for error results', () => {
      const result = Result.err('failure');
      expect(Result.isErr(result)).toBe(true);
    });

    it('should return false for successful results', () => {
      const result = Result.ok(123);
      expect(Result.isErr(result)).toBe(false);
    });
  });

  describe('Result.map', () => {
    it('should transform successful result data', () => {
      const result = Result.ok(10);
      const mapped = Result.map(result, (x) => x * 2);

      expect(mapped.success).toBe(true);
      if (mapped.success) {
        expect(mapped.data).toBe(20);
      }
    });

    it('should pass through error results unchanged', () => {
      const result = Result.err('error');
      const mapped = Result.map(result, (x) => x * 2);

      expect(mapped.success).toBe(false);
      if (!mapped.success) {
        expect(mapped.error).toBe('error');
      }
    });
  });

  describe('Result.mapErr', () => {
    it('should transform error result', () => {
      const result = Result.err('original error');
      const mapped = Result.mapErr(result, (err) => `Transformed: ${err}`);

      expect(mapped.success).toBe(false);
      if (!mapped.success) {
        expect(mapped.error).toBe('Transformed: original error');
      }
    });

    it('should pass through successful results unchanged', () => {
      const result = Result.ok(42);
      const mapped = Result.mapErr(result, (err) => `Changed: ${err}`);

      expect(mapped.success).toBe(true);
      if (mapped.success) {
        expect(mapped.data).toBe(42);
      }
    });
  });

  describe('Result.unwrap', () => {
    it('should return data from successful result', () => {
      const result = Result.ok(42);
      expect(Result.unwrap(result)).toBe(42);
    });

    it('should throw error from failed result', () => {
      const error = new Error('Test error');
      const result = Result.err(error);

      expect(() => Result.unwrap(result)).toThrow(error);
    });
  });

  describe('Result.unwrapOr', () => {
    it('should return data from successful result', () => {
      const result = Result.ok(42);
      expect(Result.unwrapOr(result, 0)).toBe(42);
    });

    it('should return default value for failed result', () => {
      const result = Result.err('error');
      expect(Result.unwrapOr(result, 0)).toBe(0);
    });
  });

  describe('Result.fromPromise', () => {
    it('should convert successful promise to ok result', async () => {
      const promise = Promise.resolve(42);
      const result = await Result.fromPromise(promise);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(42);
      }
    });

    it('should convert rejected promise to error result', async () => {
      const error = new Error('Test error');
      const promise = Promise.reject(error);
      const result = await Result.fromPromise(promise);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(error);
      }
    });
  });

  describe('Result.all', () => {
    it('should collect all successful results', () => {
      const results = [Result.ok(1), Result.ok(2), Result.ok(3)];
      const combined = Result.all(results);

      expect(combined.success).toBe(true);
      if (combined.success) {
        expect(combined.data).toEqual([1, 2, 3]);
      }
    });

    it('should return first error if any result fails', () => {
      const results = [Result.ok(1), Result.err('error'), Result.ok(3)];
      const combined = Result.all(results);

      expect(combined.success).toBe(false);
      if (!combined.success) {
        expect(combined.error).toBe('error');
      }
    });
  });
});

describe('Option type utilities', () => {
  describe('Option.some', () => {
    it('should create an Option with a value', () => {
      const option = Option.some(42);

      expect(option.some).toBe(true);
      if (option.some) {
        expect(option.value).toBe(42);
      }
    });
  });

  describe('Option.none', () => {
    it('should create an empty Option', () => {
      const option = Option.none();

      expect(option.some).toBe(false);
    });
  });

  describe('Option.isSome', () => {
    it('should return true for Some variant', () => {
      const option = Option.some(42);
      expect(Option.isSome(option)).toBe(true);
    });

    it('should return false for None variant', () => {
      const option = Option.none();
      expect(Option.isSome(option)).toBe(false);
    });
  });

  describe('Option.isNone', () => {
    it('should return true for None variant', () => {
      const option = Option.none();
      expect(Option.isNone(option)).toBe(true);
    });

    it('should return false for Some variant', () => {
      const option = Option.some(42);
      expect(Option.isNone(option)).toBe(false);
    });
  });

  describe('Option.fromNullable', () => {
    it('should convert non-null value to Some', () => {
      const option = Option.fromNullable(42);

      expect(option.some).toBe(true);
      if (option.some) {
        expect(option.value).toBe(42);
      }
    });

    it('should convert null to None', () => {
      const option = Option.fromNullable(null);
      expect(option.some).toBe(false);
    });

    it('should convert undefined to None', () => {
      const option = Option.fromNullable(undefined);
      expect(option.some).toBe(false);
    });
  });

  describe('Option.unwrapOr', () => {
    it('should return value from Some variant', () => {
      const option = Option.some(42);
      expect(Option.unwrapOr(option, 0)).toBe(42);
    });

    it('should return default value for None variant', () => {
      const option = Option.none();
      expect(Option.unwrapOr(option, 0)).toBe(0);
    });
  });
});
