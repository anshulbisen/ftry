---
description: Implement a complete feature with TDD approach, from planning to production-ready code
argument-hint: "[feature-name]" [backend|frontend|fullstack]
---

Deploy a complete feature implementation team following Test-Driven Development:

**Feature Implementation Team (TDD workflow):**

**Phase 1 - Planning & Design:**

1. **feature-planner**: Break down requirements
   - User stories creation
   - Acceptance criteria
   - MVP scope definition
   - Technical requirements

2. **senior-architect**: Technical design
   - Architecture decisions
   - Integration points
   - API contracts
   - Data models

**Phase 2 - Test-First Development:** 3. **test-guardian**: Write failing tests FIRST

- Unit tests for business logic
- Integration tests for APIs
- Component tests for UI
- E2E tests for user flows

**Phase 3 - Implementation (parallel where possible):** 4. **database-expert**: Database layer

- Schema creation/migration
- Repository implementation
- Query optimization

5. **backend-expert**: Backend implementation
   - NestJS services
   - Controllers and DTOs
   - Business logic
   - API endpoints

6. **frontend-expert**: Frontend implementation
   - React components
   - State management
   - UI/UX implementation
   - Form handling

**Phase 4 - Quality & Optimization:**

7. **code-quality-enforcer**: Quality gates
   - Linting and formatting
   - Type checking and TypeScript type safety
   - Code standards

8. **performance-optimizer**: Performance tuning
   - Query optimization
   - Component optimization
   - Bundle size check

**Phase 5 - Final Review:**

9. **test-guardian**: Ensure all tests pass
10. **module-boundaries**: Verify architecture compliance
11. **git-workflow**: Create feature branch and commits

The implementation includes:

- Complete feature from database to UI
- Full test coverage (unit, integration, E2E)
- Type-safe implementation
- Performance optimized
- Security validated
- Documentation complete
- Ready for PR

Usage: `/implement-feature "[feature-name]" [backend|frontend|fullstack]`

Example: `/implement-feature "appointment-booking" fullstack`
