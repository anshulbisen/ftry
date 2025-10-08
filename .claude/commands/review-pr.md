---
description: Perform comprehensive code review with multiple specialist agents working in parallel
---

Launch a team of expert agents to review the current changes or a specific PR. The following agents will analyze your code in parallel:

**Core Review Team:**

1. **senior-architect**: High-level architecture review, design patterns, scalability assessment
2. **frontend-specialist**: React components, hooks, TypeScript, performance, accessibility
3. **backend-expert**: NestJS modules, API design, security, database interactions
4. **database-expert**: Schema design, query optimization, migrations, data integrity

**Quality Assurance Team:** 5. **code-quality-enforcer**: Linting, formatting, type checking, quality gates 6. **test-guardian**: Test coverage, test quality, missing tests identification 7. **type-safety-refactor**: TypeScript strict mode compliance, type annotations

**Optimization Team:** 8. **performance-optimizer**: Frontend/backend performance, bundle size, caching 9. **code-duplication-detector**: DRY violations, reusable component opportunities 10. **module-boundaries**: Circular dependencies, Nx module boundary violations

Each agent will provide specific feedback in their area of expertise. The review covers:

- Architecture and design patterns
- Code quality and standards
- Security vulnerabilities
- Performance bottlenecks
- Test coverage gaps
- Type safety issues
- Module organization
- Documentation needs

Usage: `/review-pr` or `/review-pr [pr-number]`
