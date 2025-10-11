# Generate TypeScript Types

Automatically generate TypeScript types from JSON, API responses, database schemas, or runtime values.

## Usage

```
/generate-types [source] [options]
```

Sources:

- `json [file/data]`: Generate from JSON file or inline data
- `api [endpoint]`: Generate from API response
- `prisma`: Generate from Prisma schema
- `runtime [variable]`: Generate from runtime value
- `graphql [schema]`: Generate from GraphQL schema

Options:

- `--name TypeName`: Name for generated type
- `--readonly`: Make all properties readonly
- `--optional`: Make all properties optional
- `--branded`: Create branded types for IDs
- `--discriminated`: Create discriminated unions
- `--zod`: Generate Zod schemas alongside types

## What This Command Does

1. **JSON to TypeScript**
   - Parse JSON and infer types
   - Handle nested objects and arrays
   - Detect patterns for union types
   - Generate interfaces with proper naming

2. **API Response Types**
   - Fetch actual API response
   - Analyze multiple responses for variations
   - Generate complete type hierarchy
   - Include error response types

3. **Database Schema Types**
   - Read Prisma schema
   - Generate DTOs for CRUD operations
   - Create validation schemas
   - Add computed fields types

4. **Runtime Type Generation**
   - Analyze runtime values
   - Infer most specific types
   - Handle edge cases and nulls
   - Generate type guards

5. **Smart Type Features**
   - Detect ID fields for branding
   - Create enums from string literals
   - Generate utility types
   - Add JSDoc comments

## Examples

### From JSON File

```typescript
// Command: /generate-types json data/user.json --name User

// Input: data/user.json
{
  "id": "123",
  "name": "John Doe",
  "email": "john@example.com",
  "roles": ["admin", "user"],
  "profile": {
    "age": 30,
    "city": "Pune"
  }
}

// Generated:
export interface User {
  id: string;
  name: string;
  email: string;
  roles: UserRole[];
  profile: UserProfile;
}

export type UserRole = "admin" | "user";

export interface UserProfile {
  age: number;
  city: string;
}

// With --branded option:
export type UserId = string & { readonly brand: unique symbol };

export interface User {
  id: UserId;
  // ... rest
}
```

### From API Response

```typescript
// Command: /generate-types api /api/users --name UserResponse

// Fetches actual response and generates:
export interface UserResponse {
  success: boolean;
  data: User[];
  pagination: Pagination;
}

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string; // ISO date string
  updatedAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
}
```

### From Prisma Schema

```typescript
// Command: /generate-types prisma User

// Generates from schema.prisma:
export interface User {
  id: string;
  email: string;
  name: string | null;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDto {
  email: string;
  name?: string;
  tenantId: string;
}

export interface UpdateUserDto {
  email?: string;
  name?: string | null;
}

export interface UserWhereInput {
  id?: string;
  email?: string;
  tenantId?: string;
  // ... other filters
}
```

### With Zod Validation

```typescript
// Command: /generate-types json data.json --name User --zod

// Generates both TypeScript types and Zod schemas:
import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  age: z.number().min(0).max(120),
  roles: z.array(z.enum(['admin', 'user', 'guest'])),
});

export type User = z.infer<typeof UserSchema>;

// Type guard using Zod
export function isUser(value: unknown): value is User {
  return UserSchema.safeParse(value).success;
}
```

## Advanced Features

### Discriminated Unions Detection

```typescript
// Automatically detects patterns and suggests discriminated unions
// Input: Multiple objects with 'type' field

// Generated:
export type Response =
  | { type: 'success'; data: any }
  | { type: 'error'; message: string }
  | { type: 'loading' };
```

### Branded Types for Domain Modeling

```typescript
// Command: /generate-types json --branded

// Detects ID fields and creates branded types:
export type UserId = string & { readonly __brand: unique symbol };
export type TenantId = string & { readonly __brand: unique symbol };
export type OrderId = string & { readonly __brand: unique symbol };

// Helper functions
export const UserId = (id: string): UserId => id as UserId;
export const TenantId = (id: string): TenantId => id as TenantId;
```

### Template Literal Types

```typescript
// Detects patterns in strings and suggests template literals
export type Route = `/users/${string}` | `/posts/${string}`;
export type EventName = `on${Capitalize<string>}`;
```

## File Organization

Generated types are organized as:

```
libs/shared/util-types/src/lib/
├── generated/
│   ├── api-types.ts      # API response types
│   ├── dto-types.ts       # Data transfer objects
│   ├── entity-types.ts    # Database entities
│   └── schema-types.ts    # Validation schemas
├── branded.ts             # Branded type utilities
├── guards.ts              # Type guard functions
└── index.ts               # Public exports
```

## Integration with Codebase

After generation:

1. Review generated types for accuracy
2. Add to type utility library
3. Replace existing `any` types
4. Add type guards where needed
5. Update imports across codebase

## Success Criteria

- No manual type definition needed
- 100% accuracy with source
- Proper naming conventions
- Reusable type utilities
- Type guards included
- Documentation generated

## When to Use

- Integrating new APIs
- After database schema changes
- Working with external data
- Migrating JavaScript code
- Creating type-safe validators
