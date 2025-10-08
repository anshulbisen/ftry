---
description: Comprehensive code review using all review specialists in parallel
---

Launch ALL review specialists in parallel for comprehensive analysis:

## Parallel Review Agents

The following specialists will review your code simultaneously:

1. **senior-architect** - Strategic technical oversight
   - System architecture and design patterns
   - Scalability and performance strategies
   - Technical debt assessment
   - Business-technical alignment

2. **frontend-expert** - React 19, TypeScript, Tailwind CSS
   - Component structure and patterns
   - Performance optimization
   - Accessibility compliance
   - TypeScript type safety

3. **backend-expert** - NestJS 11, Node.js, Bun runtime
   - API design and RESTful patterns
   - Security best practices
   - Testing coverage
   - Dependency injection patterns

4. **database-expert** - PostgreSQL 18, Prisma 6
   - Schema design and normalization
   - Query performance and indexes
   - Data integrity and constraints
   - Migration safety

5. **code-quality-enforcer** - Standards and quality gates
   - Linting and formatting compliance
   - Type safety verification
   - Testing requirements
   - Documentation standards

6. **performance-optimizer** - Full-stack performance
   - Bundle size analysis
   - Rendering optimization
   - Database query performance
   - Caching strategies

7. **code-duplication-detector** - DRY principle enforcement
   - Duplicate code identification
   - Refactoring opportunities
   - Shared utility extraction

8. **module-boundaries** - Dependency management
   - Circular dependency detection
   - Nx tag enforcement
   - Import violation identification

## Usage

```bash
# Review all recent changes
/full-review

# Review specific scope
/full-review authentication
/full-review frontend
/full-review backend

# Review before PR
/full-review pre-pr
```

## Expected Outputs

Each agent provides:

- Severity-categorized issues (Critical, High, Medium, Low)
- Specific code examples and fixes
- Best practice recommendations
- Performance metrics
- Security vulnerability assessment
- Test coverage analysis

## Review Process

1. **Parallel Analysis** - All agents analyze simultaneously
2. **Issue Aggregation** - Combine and deduplicate findings
3. **Priority Matrix** - Rank issues by impact and effort
4. **Action Plan** - Generate implementation roadmap
5. **Documentation** - Update CLAUDE.md with learnings

## Integration Points

- Run after feature implementation
- Before creating pull requests
- During refactoring sprints
- As part of release preparation
- For technical debt assessment

The review results are aggregated into a comprehensive report with actionable recommendations prioritized by impact.
