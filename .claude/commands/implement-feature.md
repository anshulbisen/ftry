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

6. **frontend-specialist**: Frontend implementation
   - React components
   - State management
   - UI/UX implementation
   - Form handling

7. **api-standardizer**: API standardization
   - OpenAPI documentation
   - Response formatting
   - Error handling

**Phase 4 - Quality & Optimization:** 8. **code-quality-enforcer**: Quality gates

- Linting and formatting
- Type checking
- Code standards

9. **performance-optimizer**: Performance tuning
   - Query optimization
   - Component optimization
   - Bundle size check

10. **type-safety-refactor**: Type safety
    - Complete type coverage
    - Interface definitions
    - Type inference optimization

**Phase 5 - Final Review:** 11. **test-guardian**: Ensure all tests pass 12. **module-boundaries**: Verify architecture compliance 13. **git-workflow**: Create feature branch and commits

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
