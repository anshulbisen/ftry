/**
 * Mapped Type Utilities
 *
 * Advanced TypeScript utility types for transforming and manipulating types.
 * These utilities help maintain DRY principles and create reusable type patterns.
 */

/**
 * Make all properties of T optional recursively
 */
export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

/**
 * Make all properties of T required recursively
 */
export type DeepRequired<T> = T extends object
  ? {
      [P in keyof T]-?: DeepRequired<T[P]>;
    }
  : T;

/**
 * Make all properties of T readonly recursively
 */
export type DeepReadonly<T> = T extends object
  ? {
      readonly [P in keyof T]: DeepReadonly<T[P]>;
    }
  : T;

/**
 * Remove readonly from all properties recursively
 */
export type DeepMutable<T> = T extends object
  ? {
      -readonly [P in keyof T]: DeepMutable<T[P]>;
    }
  : T;

/**
 * Make specified keys required, rest remain optional
 */
export type RequireKeys<T, K extends keyof T> = Required<Pick<T, K>> & T;

/**
 * Make specified keys optional, rest remain required
 */
export type PartialKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Make all properties nullable (can be null)
 */
export type Nullable<T> = {
  [P in keyof T]: T[P] | null;
};

/**
 * Remove null and undefined from all properties
 */
export type NonNullableProps<T> = {
  [P in keyof T]-?: NonNullable<T[P]>;
};

/**
 * Extract only the keys of T that have string values
 */
export type StringKeys<T> = {
  [K in keyof T]: T[K] extends string ? K : never;
}[keyof T];

/**
 * Extract only the keys of T that have number values
 */
export type NumberKeys<T> = {
  [K in keyof T]: T[K] extends number ? K : never;
}[keyof T];

/**
 * Extract only the keys of T that have boolean values
 */
export type BooleanKeys<T> = {
  [K in keyof T]: T[K] extends boolean ? K : never;
}[keyof T];

/**
 * Extract only the keys of T that have function values
 */
export type FunctionKeys<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never;
}[keyof T];

/**
 * Exclude function properties from T
 */
export type ExcludeFunctions<T> = Omit<T, FunctionKeys<T>>;

/**
 * Pick only function properties from T
 */
export type PickFunctions<T> = Pick<T, FunctionKeys<T>>;

/**
 * Convert union type to intersection type
 */
export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I,
) => void
  ? I
  : never;

/**
 * Get the type of a Promise
 */
export type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

/**
 * Get the type of an array
 */
export type UnwrapArray<T> = T extends Array<infer U> ? U : T;

/**
 * Convert object values to union type
 */
export type ValueOf<T> = T[keyof T];

/**
 * Create a type with a subset of keys from T
 */
export type Subset<T, K extends keyof T = keyof T> = {
  [P in K]: T[P];
};

/**
 * Ensure at least one property is present
 */
export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = {
  [K in Keys]-?: Partial<Pick<T, Exclude<Keys, K>>> & Required<Pick<T, K>>;
}[Keys] &
  Pick<T, Exclude<keyof T, Keys>>;

/**
 * Ensure exactly one property is present
 */
export type RequireExactlyOne<T, Keys extends keyof T = keyof T> = {
  [K in Keys]-?: Partial<Record<Exclude<Keys, K>, undefined>> & Required<Pick<T, K>>;
}[Keys] &
  Pick<T, Exclude<keyof T, Keys>>;

/**
 * Create a discriminated union from an object
 */
export type DiscriminatedUnion<T extends Record<string, any>, K extends keyof T> = {
  [P in T[K]]: Record<K, P> & T;
}[T[K]];

/**
 * Merge two types, with properties from B overriding A
 */
export type Merge<A, B> = B & Omit<A, keyof B>;

/**
 * Create a type that represents the diff between two types
 */
export type Diff<T, U> = T extends U ? never : T;

/**
 * Create DTO types from entities (common pattern in NestJS)
 */
export type CreateDTO<T> = Omit<T, 'createdAt' | 'id' | 'updatedAt'>;
export type UpdateDTO<T> = Partial<CreateDTO<T>>;
export type ResponseDTO<T> = T & { id: string };

/**
 * Async function type
 */
export type AsyncFunction<T = void> = () => Promise<T>;
export type AsyncFunctionWithArgs<TArgs extends any[], TReturn = void> = (
  ...args: TArgs
) => Promise<TReturn>;

/**
 * Extract parameter types from a function
 */
export type Parameters<T extends (...args: any) => any> = T extends (...args: infer P) => any
  ? P
  : never;

/**
 * Extract return type from a function
 */
export type ReturnType<T extends (...args: any) => any> = T extends (...args: any) => infer R
  ? R
  : any;

/**
 * Create a type-safe event emitter type
 */
export interface TypedEventEmitter<TEvents extends Record<string, any>> {
  on<K extends keyof TEvents>(event: K, handler: (payload: TEvents[K]) => void): void;
  off<K extends keyof TEvents>(event: K, handler: (payload: TEvents[K]) => void): void;
  emit<K extends keyof TEvents>(event: K, payload: TEvents[K]): void;
}

/**
 * Path types for nested object access
 */
export type Path<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? K | `${K}.${Path<T[K]>}`
          : K
        : never;
    }[keyof T]
  : never;

/**
 * Get type at a specific path in an object
 */
export type PathValue<T, P extends Path<T>> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? Rest extends Path<T[K]>
      ? PathValue<T[K], Rest>
      : never
    : never
  : P extends keyof T
    ? T[P]
    : never;

/**
 * Strict Omit that ensures keys exist
 */
export type StrictOmit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

/**
 * Strict Extract that ensures keys exist
 */
export type StrictExtract<T, U extends T> = Extract<T, U>;

/**
 * Create a readonly version with specific keys mutable
 */
export type ReadonlyExcept<T, K extends keyof T> = Readonly<T> & {
  -readonly [P in K]: T[P];
};

/**
 * Example usage:
 *
 * ```typescript
 * interface User {
 *   id: string;
 *   name: string;
 *   email: string;
 *   age: number;
 *   createdAt: Date;
 *   updatedAt: Date;
 * }
 *
 * // DTO types
 * type CreateUserDTO = CreateDTO<User>;
 * // Result: { name: string; email: string; age: number; }
 *
 * type UpdateUserDTO = UpdateDTO<User>;
 * // Result: { name?: string; email?: string; age?: number; }
 *
 * // Require at least one field for search
 * type UserSearch = RequireAtLeastOne<{
 *   name?: string;
 *   email?: string;
 *   phone?: string;
 * }>;
 *
 * // Deep partial for nested updates
 * interface Profile {
 *   user: User;
 *   settings: {
 *     theme: string;
 *     notifications: {
 *       email: boolean;
 *       sms: boolean;
 *     };
 *   };
 * }
 *
 * type PartialProfile = DeepPartial<Profile>;
 * // All nested properties become optional
 *
 * // Path types for type-safe property access
 * type ProfilePaths = Path<Profile>;
 * // "user" | "user.id" | "user.name" | "settings" | "settings.theme" | ...
 *
 * type ThemeType = PathValue<Profile, "settings.theme">;
 * // string
 * ```
 */
