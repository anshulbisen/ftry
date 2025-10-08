---
description: Write failing tests first for a specific component/service (focused TDD for single items)
argument-hint: [component/service] [unit|integration|e2e]
allowed-tools: Write, Edit, Bash, Task, TodoWrite
---

# Test-First Development: $1 ($2)

**Note**: For complete feature implementation with TDD, use `/implement-feature` instead.
This command is for focused test writing on individual components/services.

## Context

- Target: $1
- Test type: $2 (unit/integration/e2e)
- Test runner: !`if [[ "$1" == *"frontend"* ]]; then echo "Vitest"; else echo "Jest"; fi`

## Instructions

Use the **test-guardian** subagent to implement Test-Driven Development for **$1**.

### TDD Cycle to Follow:

#### 1. RED Phase - Write Failing Tests FIRST

Create comprehensive test file for $1 that covers:

**For Components (Frontend)**:

- Renders without crashing
- Displays expected elements
- Handles user interactions
- Updates state correctly
- Shows loading/error states
- Validates form inputs
- Accessibility requirements

**For Services (Backend)**:

- Happy path scenarios
- Error handling
- Edge cases
- Input validation
- Database operations
- External API calls (mocked)
- Authorization checks

**For API Endpoints**:

- Correct status codes
- Response structure
- Request validation
- Authentication required
- Rate limiting
- Error responses

#### 2. Run Tests to Confirm They Fail

```bash
# For specific project
nx test [project-name] --watch

# For affected projects
nx affected --target=test --watch
```

#### 3. GREEN Phase - Minimal Implementation

Write ONLY enough code to make tests pass:

- No extra features
- No premature optimization
- Focus on test requirements

#### 4. REFACTOR Phase

Once tests pass:

- Improve code quality
- Extract common logic
- Add proper types
- Enhance readability
- Run tests after each change

### Example Test Templates:

**React Component Test (Vitest)**:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { $1 } from './$1';

describe('$1', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<$1 />);
    expect(baseElement).toBeTruthy();
  });

  it('should handle user interaction', async () => {
    render(<$1 />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    await waitFor(() => {
      expect(screen.getByText('Updated')).toBeInTheDocument();
    });
  });
});
```

**NestJS Service Test (Jest)**:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { $1 } from './$1';

describe('$1', () => {
  let service: $1;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [$1],
    }).compile();

    service = module.get<$1>($1);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should handle business logic', async () => {
    const result = await service.process({ data: 'test' });
    expect(result).toEqual({ success: true });
  });
});
```

### Testing Checklist:

- [ ] Tests written BEFORE implementation
- [ ] All tests initially fail (RED)
- [ ] Implementation makes tests pass (GREEN)
- [ ] Code refactored while keeping tests green
- [ ] Coverage > 80%
- [ ] Edge cases covered
- [ ] Error scenarios tested
- [ ] Mocks properly configured

### Commands:

```bash
# Run tests in watch mode
nx test [project] --watch

# Run with coverage
nx test [project] --coverage

# Run all affected tests
nx affected --target=test

# Debug specific test
nx test [project] --testNamePattern="should handle"
```

Remember:

- NEVER write implementation before tests
- Each test should test ONE thing
- Test behavior, not implementation details
- Keep tests simple and readable
- Use meaningful test descriptions
