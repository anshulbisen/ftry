---
description: Comprehensive testing using all test specialists in parallel
---

Launch ALL testing specialists in parallel for complete test coverage:

## Parallel Testing Agents

1. **test-guardian** - Test-Driven Development enforcement
   - Write tests BEFORE implementation
   - Ensure 100% test passing
   - Zero-tolerance for failures
   - TDD best practices

2. **test-refactor** - Test quality and coverage
   - Improve test structure and organization
   - Increase coverage percentages
   - Refactor test utilities
   - Migrate between testing frameworks

3. **code-quality-enforcer** - Test standards verification
   - Ensure test naming conventions
   - Validate test isolation
   - Check for test flakiness
   - Verify assertion quality

4. **frontend-expert** - React component testing
   - Component test coverage
   - Hook testing patterns
   - Integration test scenarios
   - E2E test validation

5. **backend-expert** - NestJS service testing
   - Unit test coverage
   - Integration test scenarios
   - API endpoint testing
   - Mock and stub validation

6. **database-expert** - Data layer testing
   - Repository test patterns
   - Transaction testing
   - Migration testing
   - Seed data validation

## Usage

```bash
# Full test suite analysis and improvement
/full-test

# Focus on specific area
/full-test frontend
/full-test backend
/full-test integration

# TDD for new feature
/full-test tdd authentication

# Coverage improvement
/full-test coverage
```

## Testing Strategy

### Phase 1: Analysis (All agents in parallel)

- Current coverage assessment
- Test quality evaluation
- Missing test identification
- Anti-pattern detection

### Phase 2: Test Creation (Coordinated)

- Write missing unit tests
- Add integration tests
- Create E2E scenarios
- Implement test utilities

### Phase 3: Refactoring (Sequential)

- Improve test structure
- Extract test helpers
- Optimize test performance
- Remove duplication

### Phase 4: Validation (All agents)

- Run full test suite
- Verify coverage targets
- Check test isolation
- Validate CI/CD integration

## Expected Outputs

- **Coverage Report**: Current vs target coverage
- **Test Inventory**: Complete list of all tests
- **Gap Analysis**: Missing test scenarios
- **Quality Metrics**: Test effectiveness scores
- **Performance Data**: Test execution times
- **Improvement Plan**: Prioritized action items

## Coverage Targets

- Unit Tests: 80% minimum
- Integration Tests: 70% minimum
- E2E Tests: Critical paths covered
- Overall: 75% minimum

## Test Patterns Applied

- AAA (Arrange, Act, Assert)
- Test isolation and independence
- Descriptive test names
- Proper mocking strategies
- Fast test execution
- Deterministic results

The combined effort ensures comprehensive test coverage with high-quality, maintainable tests that provide confidence in code changes.
