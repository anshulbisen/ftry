import { describe, it, expect } from 'vitest';
import type { Prettify, DeepPartial, DeepRequired, PickByType, OmitByType } from './mapped';

describe('Mapped type utilities', () => {
  describe('Prettify', () => {
    it('should flatten intersection types for better IntelliSense', () => {
      interface User {
        id: string;
        name: string;
      }

      interface Timestamps {
        createdAt: Date;
        updatedAt: Date;
      }

      type UserWithTimestamps = Prettify<Timestamps & User>;

      const user: UserWithTimestamps = {
        id: '123',
        name: 'Test',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('name');
      expect(user).toHaveProperty('createdAt');
      expect(user).toHaveProperty('updatedAt');
    });
  });

  describe('DeepPartial', () => {
    it('should make all properties optional recursively', () => {
      interface NestedData {
        user: {
          profile: {
            name: string;
            age: number;
          };
          settings: {
            theme: string;
            notifications: boolean;
          };
        };
      }

      type PartialData = DeepPartial<NestedData>;

      // All these should be valid
      const data1: PartialData = {};
      const data2: PartialData = { user: {} };
      const data3: PartialData = { user: { profile: {} } };
      const data4: PartialData = { user: { profile: { name: 'Test' } } };

      expect(data1).toEqual({});
      expect(data2).toEqual({ user: {} });
      expect(data3).toEqual({ user: { profile: {} } });
      expect(data4).toEqual({ user: { profile: { name: 'Test' } } });
    });

    it('should preserve array types', () => {
      interface DataWithArray {
        items: Array<{ id: string; name: string }>;
      }

      type PartialDataWithArray = DeepPartial<DataWithArray>;

      const data: PartialDataWithArray = {
        items: [{ id: '1' }], // name is optional due to DeepPartial
      };

      expect(data.items).toHaveLength(1);
      expect(data.items![0]).toHaveProperty('id');
    });
  });

  describe('DeepRequired', () => {
    it('should make all properties required recursively', () => {
      interface PartialData {
        user?: {
          profile?: {
            name?: string;
            age?: number;
          };
        };
      }

      type RequiredData = DeepRequired<PartialData>;

      const data: RequiredData = {
        user: {
          profile: {
            name: 'Test',
            age: 25,
          },
        },
      };

      expect(data.user.profile.name).toBe('Test');
      expect(data.user.profile.age).toBe(25);
    });
  });

  describe('PickByType', () => {
    it('should pick properties by their type', () => {
      interface MixedData {
        id: string;
        name: string;
        age: number;
        count: number;
        active: boolean;
      }

      type StringProps = PickByType<MixedData, string>;
      type NumberProps = PickByType<MixedData, number>;

      const stringData: StringProps = {
        id: '123',
        name: 'Test',
      };

      const numberData: NumberProps = {
        age: 25,
        count: 10,
      };

      expect(Object.keys(stringData)).toEqual(['id', 'name']);
      expect(Object.keys(numberData)).toEqual(['age', 'count']);
    });

    it('should work with Date types', () => {
      interface TimestampedData {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        version: number;
      }

      type DateProps = PickByType<TimestampedData, Date>;

      const dates: DateProps = {
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(dates).toHaveProperty('createdAt');
      expect(dates).toHaveProperty('updatedAt');
      expect(dates.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('OmitByType', () => {
    it('should omit properties by their type', () => {
      interface User {
        id: string;
        name: string;
        age: number;
        createdAt: Date;
        updatedAt: Date;
      }

      type WithoutDates = OmitByType<User, Date>;

      const user: WithoutDates = {
        id: '123',
        name: 'Test',
        age: 25,
      };

      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('name');
      expect(user).toHaveProperty('age');
      expect(user).not.toHaveProperty('createdAt');
      expect(user).not.toHaveProperty('updatedAt');
    });

    it('should work with multiple types', () => {
      interface MixedData {
        id: string;
        name: string;
        count: number;
        active: boolean;
        metadata: object;
      }

      type WithoutStringsAndBools = OmitByType<MixedData, boolean | string>;

      const data: WithoutStringsAndBools = {
        count: 10,
        metadata: {},
      };

      expect(data).toHaveProperty('count');
      expect(data).toHaveProperty('metadata');
      expect(data).not.toHaveProperty('id');
      expect(data).not.toHaveProperty('name');
      expect(data).not.toHaveProperty('active');
    });
  });

  describe('Complex type transformations', () => {
    it('should combine multiple mapped types', () => {
      interface BaseUser {
        id: string;
        email: string;
        password: string;
        createdAt: Date;
        profile?: {
          firstName?: string;
          lastName?: string;
        };
      }

      // Remove password and dates, make profile required
      type SafeUser = Prettify<DeepRequired<Omit<OmitByType<BaseUser, Date>, 'password'>>>;

      const safeUser: SafeUser = {
        id: '123',
        email: 'test@example.com',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
        },
      };

      expect(safeUser).not.toHaveProperty('password');
      expect(safeUser).not.toHaveProperty('createdAt');
      expect(safeUser.profile.firstName).toBe('John');
    });
  });
});
