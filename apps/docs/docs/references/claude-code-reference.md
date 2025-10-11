# Claude Code Reference

Complete reference for Claude Code agents and slash commands in the ftry project.

## Overview

Claude Code is enhanced with 17 specialist agents and 26 custom slash commands for maximum development productivity.

**Tech Stack**: React 19, NestJS 11, PostgreSQL 18, Prisma 6, Nx 21.6.3, Bun 1.3.0

## Specialist Agents (17 Total)

### Core Architecture & Review

#### senior-architect

- **Purpose**: Strategic technical oversight and architectural decisions
- **Expertise**: System design, scalability, performance, technical debt
- **Commands**: `/architecture-review`, `/full-review`
- **Best For**: Major architectural decisions, system design reviews, technical roadmap

#### nx-specialist

- **Purpose**: Nx monorepo architecture expert
- **Expertise**: Library creation, dependency management, build optimization, module boundaries
- **Commands**: `/add-library`, `/manage-agents`
- **Best For**: Creating libraries, refactoring architecture, optimizing builds

### Development Specialists

#### frontend-expert

- **Purpose**: React 19, TypeScript, and Tailwind CSS specialist
- **Expertise**: Component architecture, hooks, performance, accessibility, type safety
- **Commands**: `/implement-feature`, `/quick-fix frontend`, `/full-review`
- **Best For**: React components, frontend optimization, UI/UX implementation

#### backend-expert

- **Purpose**: NestJS 11, Node.js, and Bun runtime specialist
- **Expertise**: API design, dependency injection, security, testing patterns
- **Commands**: `/implement-feature`, `/quick-fix backend`, `/full-review`
- **Best For**: API endpoints, NestJS modules, backend services

#### database-expert

- **Purpose**: PostgreSQL 18 and Prisma 6 specialist
- **Expertise**: Schema design, query optimization, migrations, data integrity, RLS
- **Commands**: `/quick-fix database`, `/full-review`, `/security-audit`
- **Best For**: Database design, query optimization, migration planning

### Testing Specialists

#### test-guardian

- **Purpose**: Test-Driven Development enforcement
- **Expertise**: TDD methodology, test-first approach, zero-tolerance for failures
- **Commands**: `/test-first`, `/full-test`, `/improve-tests`
- **Best For**: Writing tests first, ensuring test quality, TDD workflow

#### test-refactor

- **Purpose**: Test quality and coverage improvement
- **Expertise**: Test structure, coverage analysis, testing patterns, framework migration
- **Commands**: `/improve-tests`, `/full-test`
- **Best For**: Improving test coverage, refactoring tests, test optimization

### Code Quality Specialists

#### code-quality-enforcer

- **Purpose**: Code standards and quality gates enforcement
- **Expertise**: Linting, formatting, type checking, quality metrics
- **Commands**: `/quick-fix quality`, `/full-review`, `/full-test`
- **Best For**: Enforcing standards, quality checks, pre-commit validation

#### code-duplication-detector

- **Purpose**: DRY principle enforcement
- **Expertise**: Duplicate code detection, refactoring, utility extraction
- **Commands**: `/quick-fix duplication`, `/refactor-code`, `/full-review`
- **Best For**: Finding duplicates, extracting utilities, code consolidation

#### module-boundaries

- **Purpose**: Module boundary and dependency management
- **Expertise**: Circular dependencies, Nx tags, import violations, ESLint rules
- **Commands**: `/quick-fix boundaries`, `/full-review`, `/fix-boundaries`
- **Best For**: Fixing import violations, enforcing boundaries, dependency cleanup

### Performance & Operations

#### performance-optimizer

- **Purpose**: Full-stack performance optimization
- **Expertise**: React rendering, bundle size, query optimization, caching
- **Commands**: `/optimize-performance`, `/full-review`, `/quick-fix performance`
- **Best For**: Performance issues, optimization, bottleneck identification

#### monitoring-observability

- **Purpose**: Grafana Cloud monitoring instrumentation
- **Expertise**: Metrics, logging, tracing, alerting, dashboards
- **Commands**: `/setup-monitoring`
- **Best For**: Adding monitoring, creating dashboards, setting up alerts

#### git-workflow

- **Purpose**: Git best practices and workflow management
- **Expertise**: Conventional commits, branching, PRs, git operations
- **Commands**: `/commit`, `/manage-agents`
- **Best For**: Git operations, commit management, PR creation

### Documentation & Maintenance

#### docs-maintainer

- **Purpose**: Documentation synchronization and maintenance
- **Expertise**: Documentation updates, consistency, accuracy, templates
- **Commands**: `/update-docs`, `/sync-docs`
- **Best For**: Keeping docs current, creating new docs, validation

#### subagent-updater

- **Purpose**: Agent configuration maintenance
- **Expertise**: Agent updates, version synchronization, configuration management
- **Commands**: `/update-agents`
- **Best For**: Updating agent configs, version bumps, agent maintenance

#### claude-code-optimizer

- **Purpose**: Claude Code workflow optimization
- **Expertise**: CLAUDE.md files, settings, permissions, workflows, context management
- **Commands**: `/optimize-claude`
- **Best For**: Optimizing Claude Code setup, improving workflows

### Product & Planning

#### feature-planner

- **Purpose**: Product feature planning and prioritization
- **Expertise**: User stories, MVP scope, lean development, requirements
- **Commands**: `/implement-feature`, `/manage-agents`
- **Best For**: Feature planning, requirement analysis, MVP scoping

## Slash Commands (26 Total)

### Development Workflow

#### /dev [scope]

Start development servers with auto-cleanup and hot reload.

```bash
/dev                # Both frontend + backend
/dev frontend       # Frontend only (port 3000)
/dev backend        # Backend only (port 3001)
```

**Features**: Auto-kills port processes, validates environment, checks DB connectivity, hot reload

#### /check-all [scope]

Run all quality gates: format, lint, typecheck, test.

```bash
/check-all          # All checks (before commit)
/check-all format   # Prettier only
/check-all lint     # ESLint only
/check-all typecheck # TypeScript only
/check-all test     # Tests only
/check-all --fix    # Auto-fix issues
```

**Quality Gates**: Format → Lint → Typecheck → Test (sequential, fail-fast)

#### /db-migrate [action]

Database migration workflow with safety checks.

```bash
/db-migrate                          # Create migration
/db-migrate add-user-preferences     # Named migration
/db-migrate deploy                   # Deploy to production
/db-migrate reset                    # Reset DB (dev only)
/db-migrate status                   # View status
```

**Safety**: Schema validation, breaking change detection, RLS verification, type checking

### Testing & Quality

#### /test-first [component] [type]

TDD workflow: write failing tests first.

```bash
/test-first UserProfile unit
/test-first AuthService integration
/test-first BookingFlow e2e
```

**Agent**: test-guardian
**Workflow**: Write tests → Implement → Refactor → Validate

#### /improve-tests [scope]

Improve test coverage and quality.

```bash
/improve-tests          # Full review
/improve-tests coverage # Coverage gaps
/improve-tests quality  # Test quality
```

**Agents**: test-guardian, test-refactor (parallel)

#### /full-test

Comprehensive testing with all specialists in parallel.

**Agents**: test-guardian, test-refactor, code-quality-enforcer

### Feature Development

#### /implement-feature [name] [type]

Complete feature implementation with TDD.

```bash
/implement-feature "appointment-booking" fullstack
/implement-feature "user-profile" frontend
/implement-feature "notifications" backend
```

**Phases**:

1. Planning (feature-planner, senior-architect)
2. Test-First (test-guardian)
3. Implementation (database-expert, backend-expert, frontend-expert - parallel)
4. Quality (code-quality-enforcer, performance-optimizer)
5. Review (test-guardian, module-boundaries, git-workflow)

#### /add-library [type] [scope] [name]

Create Nx library with proper configuration.

```bash
/add-library feature appointments booking
/add-library ui shared button
/add-library data-access users
/add-library util shared validation
```

**Types**: feature, ui, data-access, util
**Agent**: nx-specialist

### Code Quality & Architecture

#### /full-review [scope]

Comprehensive review with all specialists in parallel.

```bash
/full-review            # Complete review
/full-review frontend   # Frontend only
/full-review backend    # Backend only
```

**Agents**: senior-architect, frontend-expert, backend-expert, database-expert, code-quality-enforcer, performance-optimizer, test-guardian

#### /quick-fix [type]

Targeted improvements with specific specialists.

```bash
/quick-fix types        # Type safety
/quick-fix duplication  # DRY violations
/quick-fix boundaries   # Module boundaries
/quick-fix quality      # Code quality
/quick-fix performance  # Performance issues
/quick-fix frontend     # React patterns
/quick-fix backend      # NestJS patterns
/quick-fix database     # Query optimization
```

#### /refactor-code [scope]

Orchestrate multiple refactoring specialists.

**Agents**: code-duplication-detector, module-boundaries, code-quality-enforcer, performance-optimizer

#### /fix-boundaries [scope]

Fix module boundary violations and circular dependencies.

```bash
/fix-boundaries            # All violations
/fix-boundaries --check    # Check only
/fix-boundaries frontend   # Specific project
/fix-boundaries --circular # Circular deps only
```

**Agent**: module-boundaries

#### /architecture-review [scope]

Deep architectural review with senior specialists.

```bash
/architecture-review full       # Complete architecture
/architecture-review frontend   # React architecture
/architecture-review backend    # NestJS architecture
/architecture-review data       # Database design
/architecture-review security   # Security patterns
```

**Agents**: senior-architect, nx-specialist, database-expert

#### /nx-graph [view]

Visualize Nx dependency graph.

```bash
/nx-graph               # Interactive graph
/nx-graph affected      # Affected projects
/nx-graph circular      # Circular dependencies
```

### Performance & Security

#### /optimize-performance [scope]

Comprehensive performance audit and optimization.

```bash
/optimize-performance          # Full stack
/optimize-performance frontend # React optimization
/optimize-performance backend  # NestJS optimization
/optimize-performance database # Query optimization
```

**Agent**: performance-optimizer

#### /security-audit [scope]

Comprehensive security audit.

```bash
/security-audit             # Full review
/security-audit auth        # Authentication
/security-audit api         # API security
/security-audit database    # Database security
```

**Checks**: Authentication, authorization, input validation, SQL injection, XSS, dependencies, secrets, HTTPS/TLS

### Monitoring

#### /setup-monitoring [scope]

Add monitoring instrumentation for Grafana Cloud.

```bash
/setup-monitoring              # Complete setup
/setup-monitoring backend      # NestJS metrics
/setup-monitoring frontend     # React performance
/setup-monitoring metrics [component]  # Custom metrics
/setup-monitoring alerts [service]     # Alert rules
```

**Agent**: monitoring-observability
**Tech**: Prometheus, Loki, Tempo, Grafana Cloud

### Documentation

#### /update-docs [scope]

Maintain and update documentation (legacy).

```bash
/update-docs                  # Full audit
/update-docs authentication   # Specific feature
/update-docs new feature-name # Create new docs
/update-docs validate         # Validate all
```

**Agent**: docs-maintainer

#### /sync-docs [feature-name|validate]

Automatically synchronize Docusaurus documentation (recommended).

```bash
/sync-docs              # Sync all
/sync-docs authentication # Sync specific
/sync-docs validate     # Validate only
```

**Agent**: docs-maintainer

### Repository Maintenance

#### /sync-repo [scope]

Complete repository synchronization after features.

```bash
/sync-repo                  # Full sync
/sync-repo authentication   # Specific feature
/sync-repo --skip security  # Skip task
/sync-repo --only docs      # Specific task
```

**Phase 1 (Sequential)**: `/check-all` (must pass)
**Phase 2 (Parallel)**: `/update-docs`, `/update-agents`, `/update-commands`, `/full-review`, `/security-audit`, `/fix-boundaries`

**When**: After features, before PRs, weekly maintenance

#### /update-agents

Update all agent configurations with current project state.

**Agent**: subagent-updater
**Updates**: Tech versions, packages, architecture, patterns, tools

#### /update-commands [options]

Sync slash commands with repository changes.

```bash
/update-commands --dry-run  # Preview only
/update-commands --force    # Force update
```

**Agent**: claude-code-optimizer

#### /optimize-claude

Optimize Claude Code configuration and workflows.

**Agent**: claude-code-optimizer
**Optimizations**: CLAUDE.md files, permissions, MCP setup, commands, agents, context, workflows

### Git Workflow

#### /commit [message] [--push]

Run quality checks, commit changes, optionally push.

```bash
/commit                                # Interactive
/commit "feat(auth): add JWT refresh"  # Direct
/commit "fix(db): optimize" --push     # Commit + push
```

**Format**: `type(scope): subject`
**Types**: feat, fix, docs, style, refactor, perf, test, build, ci, chore
**Agent**: git-workflow

### Agent Management

#### /use-agent [agent-name] [task]

Use specific specialist agent for targeted tasks.

```bash
/use-agent frontend-expert
/use-agent database-expert optimize queries
/use-agent test-guardian write tests for BookingForm
```

#### /manage-agents [operation]

Orchestrate multiple agents for complex workflows.

```bash
/manage-agents parallel    # Run in parallel
/manage-agents sequence    # Sequential execution
/manage-agents deploy      # Deploy feature
/manage-agents feature     # Feature development
/manage-agents review-pr   # PR review
```

## Task → Command Mapping

| Task                   | Command                               |
| ---------------------- | ------------------------------------- |
| Start new feature      | `/implement-feature [name] fullstack` |
| Review before PR       | `/full-review`                        |
| Fix failing tests      | `/use-agent test-guardian`            |
| Improve performance    | `/optimize-performance`               |
| Update documentation   | `/sync-docs [feature]`                |
| Add monitoring         | `/setup-monitoring`                   |
| Create library         | `/add-library [type] [scope] [name]`  |
| Security check         | `/security-audit`                     |
| Fix linting            | `/quick-fix quality`                  |
| Remove duplication     | `/quick-fix duplication`              |
| Architecture review    | `/architecture-review full`           |
| Write tests first      | `/test-first [component] unit`        |
| Update all agents      | `/update-agents`                      |
| After feature complete | `/sync-repo`                          |

## Workflow Examples

### New Feature (TDD)

```bash
/implement-feature "appointment-booking" fullstack
/sync-repo
/commit "feat(appointments): add booking" --push
```

### Bug Fix

```bash
/test-first AppointmentService unit
# Fix the bug
/check-all
/commit "fix(appointments): resolve double booking"
```

### Refactoring

```bash
/nx-graph circular
/quick-fix duplication
/refactor-code
/fix-boundaries
/check-all
/commit "refactor(core): extract shared utilities"
```

### Database Migration

```bash
# Edit schema
/db-migrate add-user-preferences
/test-first UserRepository integration
/update-docs database
/commit "feat(db): add user preferences table"
```

## Best Practices

1. **TDD First**: Always `/test-first` before implementing
2. **Quality Gates**: Run `/check-all` before every commit
3. **Atomic Commits**: Use `/commit` with conventional format
4. **Review Often**: `/full-review` before PRs
5. **Document Changes**: `/sync-docs` after features
6. **Fix Boundaries**: `/fix-boundaries --check` regularly
7. **Monitor Performance**: `/optimize-performance` periodically
8. **Security First**: `/security-audit` before production
9. **After Features**: Always `/sync-repo` for complete sync

## See Also

- [Claude Code Guide](../guides/claude-code) - Getting started with Claude Code
- [Development Workflows](../guides/development-workflows) - Common workflows
- [Contributing Guide](../guides/contributing) - Contribution guidelines

---

**Last Updated**: 2025-10-11
**Total Agents**: 17
**Total Commands**: 26
**Status**: Active Development (Authentication Feature)
