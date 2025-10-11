# Slash Commands Reference

Complete reference for all custom slash commands in the ftry project.

**Tech Stack Context:** React 19, NestJS 11, PostgreSQL 18, Prisma 6, Nx 21.6.3, Bun 1.3.0

---

## Quick Access

| Category          | Commands                                                          |
| ----------------- | ----------------------------------------------------------------- |
| **Development**   | `/dev`, `/check-all`, `/db-migrate`                               |
| **Testing**       | `/test-first`, `/improve-tests`, `/full-test`                     |
| **Features**      | `/implement-feature`, `/add-library`                              |
| **Quality**       | `/full-review`, `/quick-fix`, `/refactor-code`, `/fix-boundaries` |
| **Architecture**  | `/architecture-review`, `/nx-graph`                               |
| **Monitoring**    | `/setup-monitoring`                                               |
| **Security**      | `/security-audit`                                                 |
| **Documentation** | `/update-docs`, `/sync-docs`, `/update-commands`                  |
| **Maintenance**   | `/sync-all`, `/sync-repo`, `/update-agents`                       |
| **Agents**        | `/use-agent`, `/manage-agents`                                    |
| **Git**           | `/commit`                                                         |
| **Optimization**  | `/optimize-performance`, `/optimize-claude`                       |

---

## Development Workflow

### `/dev [scope]`

Start development servers with auto-cleanup and hot reload.

**Usage:**

```bash
/dev                    # Start both frontend + backend
/dev frontend           # Frontend only (port 3000)
/dev backend            # Backend only (port 3001)
```

**Features:**

- Auto-kills processes on ports 3000/3001
- Validates environment variables
- Checks database connectivity
- Hot reload (HMR for frontend, watch mode for backend)
- Concurrent execution with failure handling

**Tech:** Vite 7.0.0, NestJS 11, Bun 1.3.0, concurrently 9.2.1

---

### `/check-all [scope]`

Run all quality gates: format, lint, typecheck, test.

**Usage:**

```bash
/check-all              # All checks (recommended before commit)
/check-all format       # Prettier formatting only
/check-all lint         # ESLint only
/check-all typecheck    # TypeScript only
/check-all test         # Tests only
/check-all --fix        # Auto-fix issues
```

**Quality Gates:**

1. **Format** - Prettier 3.6.2 (auto-fix)
2. **Lint** - ESLint 9.8.0 + typescript-eslint 8.40.0
3. **Typecheck** - TypeScript 5.9.2 (strict mode)
4. **Test** - Vitest 3.0.0 (frontend) + Jest 30.0.2 (backend)

**Execution:** Sequential with fail-fast (format → lint → typecheck → test)

**Integration:** Pre-commit hooks via Husky, CI/CD enforcement

---

### `/db-migrate [action]`

Database migration workflow with safety checks.

**Usage:**

```bash
/db-migrate                           # Create migration (interactive)
/db-migrate add-user-preferences      # Named migration
/db-migrate deploy                    # Deploy to production
/db-migrate generate                  # Generate Prisma client only
/db-migrate create-only schema-change # Review before apply
/db-migrate reset                     # Reset DB (dev only)
/db-migrate status                    # View migration status
```

**Safety Features:**

- Pre-migration schema validation
- Breaking change detection
- RLS policy verification
- Post-migration type checking
- Automatic Prisma client regeneration

**Tech:** Prisma 6.16.3, PostgreSQL 18

**Multi-Tenant:** Validates RLS policies and tenant_id indexes

---

## Testing & Quality

### `/test-first [component] [type]`

TDD workflow: write failing tests first.

**Usage:**

```bash
/test-first UserProfile unit
/test-first AuthService integration
/test-first BookingFlow e2e
```

**Options:** `unit`, `integration`, `e2e`

**Workflow:**

1. Write failing tests
2. Implement minimal code to pass
3. Refactor while keeping tests green
4. Validate and commit

**Agent:** test-guardian

---

### `/improve-tests [scope]`

Improve test coverage and quality.

**Usage:**

```bash
/improve-tests              # Full test suite review
/improve-tests coverage     # Focus on coverage gaps
/improve-tests quality      # Improve test quality
/improve-tests frontend     # Frontend tests only
/improve-tests backend      # Backend tests only
```

**Agents:** test-guardian, test-refactor (parallel execution)

**Improvements:**

- Increase coverage
- Refactor test structure
- Add missing test cases
- Improve test performance
- Update outdated tests

---

### `/full-test`

Comprehensive testing with all test specialists in parallel.

**Deploys:**

- test-guardian (TDD enforcement)
- test-refactor (quality improvement)
- code-quality-enforcer (standards)

**Output:** Complete test coverage report with recommendations

---

## Feature Development

### `/implement-feature [name] [type]`

Complete feature implementation with TDD.

**Usage:**

```bash
/implement-feature "appointment-booking" fullstack
/implement-feature "user-profile" frontend
/implement-feature "notifications" backend
```

**Options:** `backend`, `frontend`, `fullstack`

**Phases:**

1. **Planning** - feature-planner, senior-architect
2. **Test-First** - test-guardian writes failing tests
3. **Implementation** - database-expert, backend-expert, frontend-expert (parallel)
4. **Quality** - code-quality-enforcer, performance-optimizer
5. **Review** - test-guardian, module-boundaries, git-workflow

**Output:** Production-ready feature with tests, docs, and PR

---

### `/add-library [type] [scope] [name]`

Create Nx library with proper configuration.

**Usage:**

```bash
/add-library feature appointments booking
/add-library ui shared button
/add-library data-access users
/add-library util shared validation
```

**Types:** `feature`, `ui`, `data-access`, `util`

**Configuration:**

- Proper tags (type, scope)
- Module boundary rules
- Non-buildable (library best practice)
- Bundler: none (apps build only)
- Test runner: Vitest (frontend) or Jest (backend)

**Agent:** nx-specialist

---

## Code Quality & Architecture

### `/full-review [scope]`

Comprehensive code review with all specialists in parallel.

**Usage:**

```bash
/full-review                # Complete review
/full-review frontend       # Frontend only
/full-review backend        # Backend only
/full-review database       # Database only
```

**Deploys (parallel):**

- senior-architect
- frontend-expert
- backend-expert
- database-expert
- code-quality-enforcer
- performance-optimizer
- test-guardian

**Output:** Consolidated review report with action items

---

### `/quick-fix [type]`

Targeted improvements with specific specialists.

**Usage:**

```bash
/quick-fix types            # Type safety (TypeScript)
/quick-fix duplication      # DRY violations
/quick-fix boundaries       # Module boundaries
/quick-fix quality          # Code quality
/quick-fix performance      # Performance issues
/quick-fix tests            # Test improvements
/quick-fix frontend         # React patterns
/quick-fix backend          # NestJS patterns
/quick-fix database         # Query optimization
```

**Execution:** Single specialist focused on specific issue

---

### `/refactor-code [scope]`

Orchestrate multiple refactoring specialists.

**Agents:**

- code-duplication-detector
- module-boundaries
- code-quality-enforcer
- performance-optimizer

**Output:** Refactored code with improved structure and performance

---

### `/fix-boundaries [scope]`

Fix module boundary violations and circular dependencies.

**Usage:**

```bash
/fix-boundaries                # All violations
/fix-boundaries --check        # Check only (no fixes)
/fix-boundaries frontend       # Specific project
/fix-boundaries --circular     # Circular deps only
/fix-boundaries --interactive  # Ask before each fix
```

**Fixes:**

- Wrong dependency direction (ui → feature)
- Circular dependencies
- Cross-scope imports (frontend → backend)
- Tag rule violations

**Agent:** module-boundaries

**Validation:** ESLint, TypeScript, tests, Nx graph

---

### `/architecture-review [scope]`

Deep architectural review with senior specialists.

**Usage:**

```bash
/architecture-review full       # Complete architecture
/architecture-review frontend   # React architecture
/architecture-review backend    # NestJS architecture
/architecture-review data       # Database design
/architecture-review security   # Security patterns
```

**Agents:** senior-architect, nx-specialist, database-expert

**Output:** Strategic recommendations and technical decisions

---

### `/nx-graph [view]`

Visualize Nx dependency graph and affected projects.

**Usage:**

```bash
/nx-graph                  # Interactive graph (opens browser)
/nx-graph affected         # Affected projects only
/nx-graph focus frontend   # Focus on specific project
/nx-graph critical-path    # Build critical path
/nx-graph circular         # Circular dependencies
/nx-graph export           # Export as JSON
```

**Features:**

- Visual dependency graph
- Affected analysis
- Circular dependency detection
- Tag-based filtering
- Export options (JSON, PNG)

**Tech:** Nx 21.6.3, D3.js

---

## Performance & Optimization

### `/optimize-performance [scope]`

Comprehensive performance audit and optimization.

**Usage:**

```bash
/optimize-performance              # Full stack
/optimize-performance frontend    # React optimization
/optimize-performance backend     # NestJS optimization
/optimize-performance database    # Query optimization
/optimize-performance bundle      # Bundle size
```

**Agent:** performance-optimizer

**Optimizations:**

- React rendering (memoization, lazy loading)
- Bundle size (code splitting, tree shaking)
- Database queries (indexes, N+1, connection pooling)
- API performance (caching, throttling)
- Network (compression, CDN)

---

### `/optimize-claude`

Optimize Claude Code configuration and workflows.

**Agent:** claude-code-optimizer

**Optimizations:**

- CLAUDE.md files
- Tool permissions
- MCP setup
- Slash commands
- Agent configurations
- Context management
- Workflow automation

---

## Security

### `/security-audit [scope]`

Comprehensive security audit across the application stack.

**Usage:**

```bash
/security-audit                # Full security review
/security-audit auth           # Authentication/authorization
/security-audit api            # API security
/security-audit database       # Database security
/security-audit dependencies   # Dependency vulnerabilities
```

**Checks:**

- Authentication (JWT, sessions, CSRF)
- Authorization (RLS, permissions)
- Input validation
- SQL injection prevention
- XSS prevention
- Dependency vulnerabilities
- Secret management
- HTTPS/TLS configuration

**Output:** Security report with severity levels and remediation steps

---

## Monitoring & Observability

### `/setup-monitoring [scope]`

Add monitoring instrumentation for Grafana Cloud.

**Usage:**

```bash
/setup-monitoring              # Complete instrumentation
/setup-monitoring backend      # NestJS metrics
/setup-monitoring frontend     # React performance
/setup-monitoring metrics [component]  # Custom metrics
/setup-monitoring alerts [service]     # Alert rules
```

**Agent:** monitoring-observability

**Instrumentation:**

- Prometheus metrics (backend)
- Structured logging (Pino)
- OpenTelemetry tracing
- Web Vitals (frontend)
- Business metrics
- Health checks
- Multi-tenant labels

**Tech:** Prometheus, Loki, Tempo, Grafana Cloud, Pino 10.0.0, OpenTelemetry

---

## Documentation & Maintenance

### `/sync-docs [scope]`

**Synchronize Docusaurus documentation with codebase changes** using the docs-maintainer specialist.

**Usage:**

```bash
/sync-docs                    # Sync all documentation
/sync-docs [feature-name]     # Sync specific feature docs
/sync-docs validate           # Only validate existing docs
```

**Actions:**

- Analyze recent code changes
- Create docs for new features
- Update docs for modified features
- Fix broken internal links
- Update code examples
- Validate all API documentation
- Update sidebar navigation
- Build and validate Docusaurus

**When to Run:**

- ✅ After ANY code changes
- ✅ Before creating pull requests
- ✅ After API modifications
- ✅ After feature implementation

**Output:** Documentation sync report with files created/updated

**See:** `.claude/commands/sync-docs.md` for complete workflow

---

### `/update-docs [scope]`

Maintain and update documentation (legacy - use `/sync-docs` for Docusaurus sync).

**Usage:**

```bash
/update-docs                      # Full doc audit
/update-docs authentication       # Specific feature
/update-docs new appointment-booking  # Create new docs
/update-docs validate             # Validate all docs
/update-docs metrics              # Doc health report
```

**Agent:** docs-maintainer

**Actions:**

- Scan for outdated docs
- Update with current implementation
- Validate code examples
- Check broken links
- Create new documentation
- Generate health metrics

---

### `/update-commands`

Sync slash commands with repository state.

**Synchronizes:**

- Agent configurations
- Technology versions (package.json)
- Script changes
- Workflow patterns
- MCP integrations

**Output:**

- Updated commands
- Documentation refresh
- Migration notes
- Usage statistics

---

### `/update-agents`

Update all agent configurations to reflect current project state.

**Agent:** subagent-updater

**Updates:**

- Technology versions
- Package updates
- Architecture changes
- New patterns discovered
- Tool configurations

**Output:** Agent update report with changes

---

## Repository Maintenance

### `/sync-all [scope]`

**Complete codebase synchronization** - orchestrates all quality, documentation, configuration, and review tasks.

**Usage:**

```bash
/sync-all                      # Full synchronization (recommended)
/sync-all authentication       # Specific feature scope
/sync-all frontend             # Frontend only
/sync-all --skip-review        # Skip review phase
/sync-all --only config,docs   # Run only specific phases
/sync-all --dry-run            # Show what would be done
```

**Orchestrated Execution Strategy:**

**Phase 1: Quality Gate (Sequential - Must Pass)**

- `/check-all` - Format → Lint → TypeCheck → Test

**Phase 2: Configuration Sync (Parallel)**

- `/update-agents` - Agent configurations
- `/update-commands` - Slash commands
- Type synchronization (typescript-guardian)

**Phase 3: Documentation Sync (Sequential)**

- `/sync-docs` - Docusaurus documentation update

**Phase 4: Comprehensive Review (Parallel)**

- All review specialists (9 agents in parallel)
- Architecture, frontend, backend, database
- Code quality, performance, duplication, boundaries
- Security audit

**Phase 5: Final Validation (Sequential)**

- Build validation (all apps)
- Test validation (all tests)

**When to Run:**

- ✅ After completing any feature
- ✅ Before creating a pull request
- ✅ After merging major changes
- ✅ Before releases

**Performance:** ~4-6 minutes (parallel execution, 80% faster than sequential)

**Output:** Unified comprehensive report with prioritized action items

**See:** `.claude/commands/sync-all.md` for complete orchestration details

---

### `/sync-repo [scope]`

Complete repository synchronization after feature implementation (legacy - superseded by `/sync-all`).

**Usage:**

```bash
/sync-repo                      # Full synchronization
/sync-repo authentication       # Specific feature scope
/sync-repo frontend             # Frontend only
/sync-repo --skip security      # Skip specific tasks
/sync-repo --only docs,agents   # Run only specific tasks
```

**Execution Strategy:**

**Phase 1: Quality Gate (Sequential - Must Pass)**

```bash
/check-all  # Format → Lint → TypeCheck → Test
```

**Phase 2: Parallel Maintenance (Independent Tasks)**

- `/update-docs` - Documentation synchronization
- `/update-agents` - Agent configuration sync
- `/update-commands` - Command synchronization
- `/full-review` - Comprehensive code review
- `/security-audit` - Security vulnerability scan
- `/fix-boundaries` - Module boundary validation

**When to Run:**

- ✅ After completing any feature
- ✅ Before creating a pull request
- ✅ After merging major changes
- ✅ Before releases
- ✅ Weekly maintenance

**What Gets Updated:**

1. Documentation (docs/, CLAUDE.md files)
2. Agent configurations (.claude/agents/)
3. Slash commands (.claude/commands/)
4. Code quality (linting, formatting, types)
5. Architecture (module boundaries, dependencies)
6. Security (vulnerabilities, best practices)
7. Performance (bottlenecks, optimizations)

**Performance:** ~3-5 minutes (parallel execution, 80% faster than sequential)

**Output:** Comprehensive report with action items prioritized by severity

---

## Git Workflow

### `/commit [message] [--push]`

Run quality checks, commit changes, optionally push.

**Usage:**

```bash
/commit                                    # Interactive commit
/commit "feat(auth): add JWT refresh"      # Direct commit
/commit "fix(db): optimize queries" --push # Commit and push
```

**Workflow:**

1. Run `/check-all`
2. Stage relevant files
3. Create conventional commit
4. Run pre-commit hooks
5. Optionally push to remote

**Format:** `type(scope): subject`

**Types:** feat, fix, docs, style, refactor, perf, test, build, ci, chore

**Agent:** git-workflow

**Enforcement:** commitlint via Husky

---

## Agent Management

### `/use-agent [agent-name] [task]`

Use specific specialist agent for targeted tasks.

**Usage:**

```bash
/use-agent frontend-expert
/use-agent database-expert optimize queries
/use-agent test-guardian write tests for BookingForm
```

**Available Agents (17 total):**

**Architecture & Design:**

- `senior-architect` - Strategic technical oversight
- `nx-specialist` - Nx monorepo expertise

**Development:**

- `frontend-expert` - React 19, TypeScript, Tailwind
- `backend-expert` - NestJS 11, Bun runtime
- `database-expert` - PostgreSQL 18, Prisma 6

**Testing:**

- `test-guardian` - TDD enforcement
- `test-refactor` - Test improvement

**Quality:**

- `code-quality-enforcer` - Standards enforcement
- `code-duplication-detector` - DRY principle
- `module-boundaries` - Dependency management

**Performance:**

- `performance-optimizer` - Full-stack optimization

**Operations:**

- `monitoring-observability` - Grafana Cloud
- `git-workflow` - Git best practices

**Maintenance:**

- `docs-maintainer` - Documentation sync
- `subagent-updater` - Agent config updates
- `claude-code-optimizer` - Claude Code optimization

**Planning:**

- `feature-planner` - Product feature planning

---

### `/manage-agents [operation]`

Orchestrate multiple agents for complex workflows.

**Usage:**

```bash
/manage-agents parallel     # Run multiple agents in parallel
/manage-agents sequence     # Sequential execution
/manage-agents deploy       # Deploy feature
/manage-agents feature      # Feature development
/manage-agents review-pr    # PR review
/manage-agents optimize     # Optimization workflow
```

**Coordination:** Intelligent agent orchestration for complex tasks

---

## Workflow Examples

### New Feature (Full TDD)

```bash
# 1. Implement feature with TDD
/implement-feature "appointment-booking" fullstack

# 2. Complete codebase synchronization
/sync-all

# 3. Commit and push
/commit "feat(appointments): add booking feature" --push
```

### Bug Fix

```bash
# 1. Write failing test first
/test-first AppointmentService unit

# 2. Fix the bug
# ... implement fix ...

# 3. Verify fix
/check-all

# 4. Commit
/commit "fix(appointments): resolve double booking"
```

### Refactoring

```bash
# 1. Analyze issues
/nx-graph circular
/quick-fix duplication

# 2. Refactor code
/refactor-code

# 3. Fix boundaries
/fix-boundaries

# 4. Validate
/check-all

# 5. Commit
/commit "refactor(core): extract shared utilities"
```

### Database Migration

```bash
# 1. Update schema
# Edit prisma/schema.prisma

# 2. Create migration
/db-migrate add-user-preferences

# 3. Test migration
/test-first UserRepository integration

# 4. Sync documentation and validate
/sync-all database

# 5. Commit
/commit "feat(db): add user preferences table"
```

### Performance Optimization

```bash
# 1. Analyze performance
/optimize-performance

# 2. Review database
/quick-fix database

# 3. Optimize frontend
/quick-fix frontend

# 4. Sync and validate everything
/sync-all

# 5. Commit
/commit "perf(app): optimize query performance"
```

---

## Technology Stack Reference

**Frontend:**

- React: 19.0.0
- Vite: 7.0.0
- Tailwind CSS: 4.1.14
- shadcn/ui: 3.4.0
- Zustand: 5.0.8
- React Router: 7.9.4

**Backend:**

- NestJS: 11.0.0
- Bun: 1.3.0 (runtime + package manager)
- Passport JWT: 4.0.1
- Bull: 11.0.3 (queues)
- Pino: 10.0.0 (logging)

**Database:**

- PostgreSQL: 18
- Prisma: 6.16.3

**Testing:**

- Vitest: 3.0.0 (frontend)
- Jest: 30.0.2 (backend)
- Testing Library: 16.1.0

**Monorepo:**

- Nx: 21.6.3
- TypeScript: 5.9.2
- ESLint: 9.8.0
- Prettier: 3.6.2

**Monitoring:**

- Prometheus (metrics)
- Loki (logs)
- Tempo (traces)
- Grafana Cloud

---

## Command Categories by Use Case

### Daily Development

`/dev`, `/test-first`, `/check-all`, `/commit`

### Code Quality

`/full-review`, `/quick-fix`, `/refactor-code`, `/fix-boundaries`

### Feature Work

`/implement-feature`, `/add-library`, `/architecture-review`

### Testing

`/test-first`, `/improve-tests`, `/full-test`

### Database

`/db-migrate`, `/quick-fix database`

### Performance

`/optimize-performance`, `/nx-graph`

### Maintenance

`/sync-all`, `/sync-docs`, `/update-agents`, `/update-commands`

### Deployment Prep

`/security-audit`, `/setup-monitoring`, `/full-review`

---

## Best Practices

1. **TDD First**: Always `/test-first` before implementing
2. **Quality Gates**: Run `/check-all` before every commit
3. **Sync Everything**: Run `/sync-all` after every feature completion
4. **Atomic Commits**: Use `/commit` with conventional format
5. **Review Often**: `/full-review` (or `/sync-all`) before PRs
6. **Document Changes**: `/sync-docs` after features (or use `/sync-all`)
7. **Fix Boundaries**: `/fix-boundaries --check` regularly
8. **Monitor Performance**: `/optimize-performance` periodically
9. **Security First**: `/security-audit` before production (included in `/sync-all`)

---

## Getting Help

- **Command details**: `.claude/commands/[command-name].md`
- **Agent details**: `.claude/agents/[agent-name].md`
- **Project standards**: `CLAUDE.md`
- **Architecture**: `.nx/NX_ARCHITECTURE.md`
- **Database**: `prisma/CLAUDE.md`
- **Workflows**: `.claude/WORKFLOWS.md`

---

**Last Updated**: 2025-10-11
**Total Commands**: 27
**Total Agents**: 18
**Status**: Active Development (Authentication Feature)
