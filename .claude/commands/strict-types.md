# Strict Types Audit and Enforcement

Perform comprehensive TypeScript type safety audit and automatically fix issues. This command ensures zero `any` usage, proper type inference, and adherence to SOLID/DRY principles.

## Usage

```
/strict-types [scope]
```

Where scope can be:

- No argument: Audit entire codebase
- `current`: Current file only
- `affected`: Only affected files (based on git changes)
- Path: Specific directory or file

## What This Command Does

1. **Type Safety Audit**
   - Scans for all `any` type usage
   - Identifies missing type annotations
   - Finds type assertions that should be type guards
   - Detects overly broad `unknown` usage

2. **Automated Fixes**
   - Replace `any` with proper types or generics
   - Convert type assertions to type guards
   - Add missing return types to public APIs
   - Extract repeated type patterns to utilities

3. **SOLID/DRY Enforcement**
   - Break down large interfaces (Interface Segregation)
   - Extract common type patterns (DRY)
   - Suggest composition over inheritance
   - Create proper abstractions

4. **Type Utility Generation**
   - Create Result<T, E> types for error handling
   - Implement branded types for domain modeling
   - Generate discriminated unions for state
   - Add exhaustive check helpers

5. **Reporting**
   - Type safety score (0-100)
   - Detailed issue breakdown
   - Before/after code examples
   - Migration guide for complex changes

## Implementation

Use the typescript-guardian agent to perform a comprehensive type audit, then apply automated fixes systematically. Follow this workflow:

1. Run type coverage analysis to get baseline metrics
2. Identify and categorize all type safety issues
3. Apply automated fixes in order of severity
4. Create type utility library if needed
5. Update ESLint configuration for ongoing enforcement
6. Generate detailed report with metrics

For each `any` found:

- Analyze the actual type being used
- Suggest proper generic or specific type
- If truly dynamic, use discriminated union
- Add type guards for runtime validation

For missing types:

- Infer from usage patterns
- Add explicit types for all exports
- Ensure no implicit any in parameters

For SOLID violations:

- Split large interfaces into focused ones
- Extract common patterns to base types
- Use composition with intersection types
- Create proper type hierarchies

## Type Patterns to Apply

### Replace Any with Generics

```typescript
// Before
function process(data: any): any {}

// After
function process<T>(data: T): T {}
```

### Use Discriminated Unions

```typescript
// Before
interface Response {
  data?: any;
  error?: string;
}

// After
type Response<T> = { success: true; data: T } | { success: false; error: string };
```

### Add Type Guards

```typescript
// Before
const user = response as User;

// After
function isUser(value: unknown): value is User {
  return typeof value === 'object' && value !== null && 'id' in value;
}

if (isUser(response)) {
  // response is now typed as User
}
```

### Extract Common Types

```typescript
// Before (repeated pattern)
interface UserDTO {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}
interface PostDTO {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// After
interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

interface UserDTO extends BaseEntity {}
interface PostDTO extends BaseEntity {}
```

## Success Criteria

The command succeeds when:

- Zero `any` types (except with @ts-expect-error justification)
- 100% type coverage for exports
- All type assertions replaced with guards
- No SOLID principle violations
- Type utility library created if needed

## Error Handling

If issues cannot be auto-fixed:

- Provide manual fix instructions
- Create TODO comments with specific guidance
- Generate migration script for complex changes
- Suggest incremental migration path

## Post-Execution

After running this command:

1. Review the changes made
2. Run tests to ensure no breaking changes
3. Update documentation if types changed
4. Commit with message: `refactor(types): enforce strict TypeScript typing`

This command should be run:

- Before major releases
- After adding new features
- When onboarding new code
- As part of regular code health checks
