---
description: Improve test coverage and quality with specialized testing agents
---

Deploy testing specialists to enhance your test suite and achieve comprehensive coverage:

**Testing Team (coordinated approach):**

**Phase 1 - Analysis:**

1. **test-guardian**: Analyze current coverage and identify gaps
2. **code-quality-enforcer**: Check existing test quality

**Phase 2 - Test Creation (parallel):** 3. **test-guardian**: Write missing unit tests

- Component tests (React Testing Library)
- Service tests (NestJS)
- Utility function tests
- Edge case coverage

4. **test-refactor**: Improve existing tests
   - Refactor test structure
   - Remove redundant tests
   - Improve test descriptions
   - Add better assertions

5. **frontend-specialist**: Frontend-specific testing
   - Component interaction tests
   - Hook testing
   - Accessibility tests
   - Snapshot tests where appropriate

6. **backend-expert**: Backend-specific testing
   - Integration tests
   - API endpoint tests
   - Database transaction tests
   - Authentication/authorization tests

**Phase 3 - Quality Assurance:** 7. **performance-optimizer**: Performance test creation

- Load testing setup
- Response time benchmarks
- Memory usage tests

8. **database-expert**: Database testing
   - Migration tests
   - Query performance tests
   - Data integrity tests

The improvement covers:

- Increase coverage to 80%+ minimum
- Add missing edge case tests
- Improve test organization
- Standardize test patterns
- Add E2E tests for critical flows
- Set up performance benchmarks
- Create test data factories

Output includes:

- Coverage report (before/after)
- New test files created
- Test refactoring changes
- Testing best practices guide
- CI/CD test configuration

Usage: `/improve-tests [unit|integration|e2e|coverage]`
