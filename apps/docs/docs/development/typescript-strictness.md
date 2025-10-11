---
id: typescript-strictness
title: TypeScript Strictness Workflow
sidebar_label: TypeScript Strictness
---

# TypeScript Strictness Workflow

This guide documents our zero-tolerance approach to TypeScript type safety, ensuring clean code that follows SOLID and DRY principles.

## Core Philosophy

**Zero `any` Policy**: We treat `any` types as technical debt. Every piece of code must have proper types, using generics, discriminated unions, or type guards instead of `any`.

## Quick Start

### Running Type Audits

```bash
# Check entire codebase
/strict-types

# Check current file only
/strict-types current

# Check type coverage
/type-coverage --detail

# Generate types from JSON
/generate-types json data.json --name MyType
```

### Using the TypeScript Guardian Agent

The TypeScript Guardian agent proactively reviews your code:

```bash
# Use the guardian for comprehensive review
/use-agent typescript-guardian

# Or invoke it directly in complex tasks
/implement-feature user-profile fullstack
# The guardian will automatically be invoked
```

## Type Utilities Library

We provide a comprehensive type utility library at `@ftry/util-types`:

```typescript
import {
  Result,
  Option,
  BrandedTypes,
  createObjectGuard,
  DeepPartial,
  RequireAtLeastOne,
} from '@ftry/util-types';
```

### Result Type Pattern

Replace error-prone try-catch blocks with type-safe Result types:

```typescript
import { Result } from '@ftry/util-types';

// ❌ BAD: Using try-catch with any
try {
  const data: any = JSON.parse(jsonString);
  return data;
} catch (error: any) {
  console.error(error.message);
  return null;
}

// ✅ GOOD: Using Result type
function parseJson<T>(jsonString: string): Result<T, Error> {
  try {
    const data = JSON.parse(jsonString) as T;
    return Result.ok(data);
  } catch (error) {
    return Result.err(new Error(`Failed to parse JSON: ${error}`));
  }
}

// Usage with proper type narrowing
const result = parseJson<User>(jsonString);
if (result.success) {
  // TypeScript knows result.data exists and is of type User
  console.log(result.data.name);
} else {
  // TypeScript knows result.error exists
  console.error(result.error.message);
}
```

### Branded Types for Domain Safety

Prevent mixing up different ID types at compile time:

```typescript
import { BrandedTypes, UserId, ClientId, TenantId } from '@ftry/util-types';

// ❌ BAD: Using plain strings for IDs
function assignClientToUser(userId: string, clientId: string) {
  // Easy to mix up the parameters
}

// ✅ GOOD: Using branded types
function assignClientToUser(userId: UserId, clientId: ClientId) {
  // Type-safe, cannot mix up parameters
}

// Creating branded values
const userId = BrandedTypes.userId('usr_123');
const clientId = BrandedTypes.clientId('cli_456');

// This will cause a compile-time error:
// assignClientToUser(clientId, userId); // Error: Type 'ClientId' is not assignable to type 'UserId'

// This is correct:
assignClientToUser(userId, clientId);
```

### Type Guards for Runtime Safety

Convert unknown values to known types safely:

```typescript
import { createObjectGuard, isNonEmptyString, isPositiveNumber } from '@ftry/util-types';

// ❌ BAD: Using type assertions
const user = response as User; // Dangerous assumption

// ✅ GOOD: Using type guards
const isUser = createObjectGuard({
  id: isNonEmptyString,
  name: isNonEmptyString,
  age: isPositiveNumber,
  email: (value): value is string => {
    return typeof value === 'string' && value.includes('@');
  },
});

// Safe runtime validation
if (isUser(response)) {
  // TypeScript knows response is User
  console.log(response.name);
} else {
  // Handle invalid data
  throw new Error('Invalid user data received');
}
```

### Advanced Mapped Types

Use mapped types for DRY type transformations:

```typescript
import {
  DeepPartial,
  CreateDTO,
  UpdateDTO,
  RequireAtLeastOne,
  ReadonlyExcept,
} from '@ftry/util-types';

interface User {
  id: string;
  name: string;
  email: string;
  age: number;
  createdAt: Date;
  updatedAt: Date;
}

// Automatic DTO generation
type CreateUserDTO = CreateDTO<User>;
// Result: { name: string; email: string; age: number; }

type UpdateUserDTO = UpdateDTO<User>;
// Result: { name?: string; email?: string; age?: number; }

// Require at least one search parameter
type UserSearch = RequireAtLeastOne<{
  name?: string;
  email?: string;
  phone?: string;
}>;
// At least one property must be provided

// Make everything readonly except specific fields
type UserForm = ReadonlyExcept<User, 'name' | 'email'>;
// Only name and email are editable
```

## ESLint Configuration

Our strict TypeScript ESLint rules are automatically enforced:

```javascript
// eslint.typescript-strict.mjs
export const typescriptStrictRules = {
  '@typescript-eslint/no-explicit-any': 'error',
  '@typescript-eslint/explicit-function-return-type': 'error',
  '@typescript-eslint/no-unsafe-assignment': 'error',
  '@typescript-eslint/strict-boolean-expressions': 'error',
  // ... and many more
};
```

## Pre-commit Validation

Our pre-commit hook (`validate-typescript-types.py`) blocks commits with:

- Any usage of `any` type without justification
- Missing return types on exported functions
- Type assertions without type guards
- Large interfaces violating ISP (Interface Segregation Principle)
- Repeated type patterns violating DRY

## Common Patterns

### Discriminated Unions Over Broad Types

```typescript
// ❌ BAD: Broad optional properties
interface Response {
  data?: any;
  error?: string;
  loading?: boolean;
}

// ✅ GOOD: Discriminated union
type Response<T> =
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

// Usage with exhaustive checks
function handleResponse<T>(response: Response<T>) {
  switch (response.status) {
    case 'loading':
      return 'Loading...';
    case 'success':
      return response.data; // TypeScript knows data exists
    case 'error':
      return response.error.message; // TypeScript knows error exists
    // No default needed - TypeScript ensures exhaustiveness
  }
}
```

### Generic Functions Over Any

```typescript
// ❌ BAD: Using any
function processData(data: any): any {
  return transform(data);
}

// ✅ GOOD: Using generics
function processData<T>(data: T): T {
  return transform(data);
}

// With constraints
function processEntity<T extends { id: string }>(entity: T): T {
  console.log(entity.id); // TypeScript knows id exists
  return entity;
}
```

### Type Predicates Over Type Assertions

```typescript
// ❌ BAD: Type assertion
const userList = data as User[];

// ✅ GOOD: Type predicate
function isUserArray(data: unknown): data is User[] {
  return (
    Array.isArray(data) &&
    data.every(
      (item) => typeof item === 'object' && item !== null && 'id' in item && 'name' in item,
    )
  );
}

if (isUserArray(data)) {
  // Safe to use as User[]
  data.forEach((user) => console.log(user.name));
}
```

## Integration with CI/CD

### GitHub Actions Integration

```yaml
name: Type Safety Check

on: [push, pull_request]

jobs:
  type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: bun install

      - name: Type check
        run: bun run typecheck

      - name: Check type coverage
        run: |
          coverage=$(bunx type-coverage --json | jq '.percentage')
          if (( $(echo "$coverage < 95" | bc -l) )); then
            echo "Type coverage below 95%: $coverage"
            exit 1
          fi

      - name: Run strict type validation
        run: python .claude/hooks/validate-typescript-types.py
```

## Troubleshooting

### Common Issues and Solutions

#### "Cannot use 'any' type"

**Solution**: Use generics, unknown with type guards, or proper interfaces:

```typescript
// Instead of: function process(data: any)
function process<T>(data: T);
// Or: function process(data: unknown) with type guards
```

#### "Missing return type annotation"

**Solution**: Add explicit return types to all exported functions:

```typescript
// Instead of: export function calculate(a: number, b: number)
export function calculate(a: number, b: number): number;
```

#### "Type assertion detected"

**Solution**: Replace with type guards:

```typescript
// Instead of: const user = data as User
if (isUser(data)) {
  /* use data as User */
}
```

## Best Practices

1. **Start with `unknown`, not `any`**: When dealing with truly unknown types, use `unknown` and narrow with type guards
2. **Use branded types for domain entities**: Prevent ID mix-ups at compile time
3. **Prefer discriminated unions**: For state management and API responses
4. **Extract common patterns**: Create reusable type utilities
5. **Document type decisions**: Use JSDoc comments for complex types
6. **Test type safety**: Write tests that verify type guards work correctly

## Tools and Commands Summary

| Command                          | Purpose                            |
| -------------------------------- | ---------------------------------- |
| `/strict-types`                  | Comprehensive type audit and fixes |
| `/type-coverage`                 | Check type coverage percentage     |
| `/generate-types`                | Generate types from JSON/API       |
| `/use-agent typescript-guardian` | Invoke type safety specialist      |
| `bun run typecheck`              | Run TypeScript compiler check      |
| `bunx type-coverage`             | Check type coverage metrics        |

## Further Reading

- [TypeScript Handbook - Type Guards](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [TypeScript Deep Dive - Advanced Types](https://basarat.gitbook.io/typescript/)
- [SOLID Principles in TypeScript](./solid-principles.md)
- [Clean Code with TypeScript](./clean-code.md)
