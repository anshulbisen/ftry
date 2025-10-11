import { describe, it, expect } from 'vitest';
import type { Brand } from './branded';

// Example branded types for testing
type UserId = Brand<string, 'UserId'>;
type TenantId = Brand<string, 'TenantId'>;
type Email = Brand<string, 'Email'>;
type PositiveNumber = Brand<number, 'PositiveNumber'>;

describe('Branded type utilities', () => {
  describe('Brand type', () => {
    it('should create distinct types from same base type', () => {
      // This test ensures type-level distinction (compile-time only)
      const userId: UserId = 'user-123' as UserId;
      const tenantId: TenantId = 'tenant-456' as TenantId;

      // Runtime values are just strings
      expect(typeof userId).toBe('string');
      expect(typeof tenantId).toBe('string');

      // But TypeScript prevents accidental mixing
      // This would be a compile error: const wrongId: UserId = tenantId;
    });

    it('should work with string brands', () => {
      const email: Email = 'test@example.com' as Email;

      expect(email).toBe('test@example.com');
      expect(typeof email).toBe('string');
    });

    it('should work with number brands', () => {
      const positiveNum: PositiveNumber = 42 as PositiveNumber;

      expect(positiveNum).toBe(42);
      expect(typeof positiveNum).toBe('number');
    });

    it('should preserve base type operations', () => {
      const userId: UserId = 'user-123' as UserId;

      // String operations still work
      expect(userId.toUpperCase()).toBe('USER-123');
      expect(userId.includes('user')).toBe(true);
    });
  });

  describe('Type safety at compile time', () => {
    it('should allow branded type assignment to base type', () => {
      const userId: UserId = 'user-123' as UserId;
      const str: string = userId; // This is allowed

      expect(str).toBe('user-123');
    });

    it('should demonstrate brand validation pattern', () => {
      // Pattern: Create validation functions that return branded types
      function createUserId(id: string): UserId {
        if (!id.startsWith('user-')) {
          throw new Error('Invalid user ID format');
        }
        return id as UserId;
      }

      const validId = createUserId('user-123');
      expect(validId).toBe('user-123');

      expect(() => createUserId('invalid')).toThrow('Invalid user ID format');
    });

    it('should work with complex validation', () => {
      function createEmail(email: string): Email {
        if (!email.includes('@')) {
          throw new Error('Invalid email format');
        }
        return email as Email;
      }

      const validEmail = createEmail('test@example.com');
      expect(validEmail).toBe('test@example.com');

      expect(() => createEmail('invalid')).toThrow('Invalid email format');
    });
  });

  describe('Branded types in data structures', () => {
    it('should work in arrays', () => {
      const userIds: UserId[] = ['user-1' as UserId, 'user-2' as UserId, 'user-3' as UserId];

      expect(userIds).toHaveLength(3);
      expect(userIds[0]).toBe('user-1');
    });

    it('should work in objects', () => {
      interface UserData {
        id: UserId;
        tenantId: TenantId;
        email: Email;
      }

      const user: UserData = {
        id: 'user-123' as UserId,
        tenantId: 'tenant-456' as TenantId,
        email: 'test@example.com' as Email,
      };

      expect(user.id).toBe('user-123');
      expect(user.tenantId).toBe('tenant-456');
      expect(user.email).toBe('test@example.com');
    });
  });
});
