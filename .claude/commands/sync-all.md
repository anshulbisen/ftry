---
description: Complete codebase synchronization - orchestrates all quality, documentation, configuration, and review tasks
---

# Complete Codebase Synchronization

Deploy all maintenance specialists in a **carefully orchestrated workflow** to ensure complete synchronization of code, documentation, configuration, and quality standards.

## Overview

This command combines and enhances both `/sync-repo` and `/sync-docs` into a single, intelligent orchestration that:

1. **Validates quality gates** before any sync operations
2. **Synchronizes core configurations** (agents, commands, types)
3. **Updates documentation** to match codebase
4. **Runs comprehensive reviews** (architecture, security, performance)
5. **Validates boundaries** and module structure
6. **Generates unified report** with actionable insights

## Execution Strategy

### Phase 1: Quality Gate (Sequential - Must Pass)

**Purpose**: Ensure codebase is in valid state before synchronization

```bash
/check-all
```

**Requirements (ALL must pass):**

- ✅ Format: All files formatted with Prettier
- ✅ Lint: 0 errors (warnings acceptable if documented)
- ✅ TypeCheck: All TypeScript compilation successful
- ✅ Test: All tests passing (100% pass rate)

**If any check fails**: Stop immediately. Fix issues first, then retry `/sync-all`.

**Why first**: Synchronization should never be performed on a broken codebase.

---

### Phase 2: Configuration Synchronization (Parallel)

**Purpose**: Update all configuration and metadata before documentation

These tasks update project infrastructure and must complete before documentation sync:

#### 2.1 Agent Configuration Sync (subagent-updater)

```bash
/update-agents
```

**Updates:**

- Package version numbers (React 19, NestJS 11, Bun 1.3.0)
- Technology stack references
- New library discoveries
- Agent capabilities
- Best practices

**Why now**: Documentation may reference agent capabilities, so agents must be updated first.

---

#### 2.2 Command Synchronization (claude-code-optimizer)

```bash
/update-commands
```

**Updates:**

- Slash command descriptions
- Command workflows
- Version references
- New command creation
- Command catalog

**Why now**: Documentation references commands, so commands must be current first.

---

#### 2.3 TypeScript Type Synchronization (typescript-guardian)

**Agent**: typescript-guardian
**Purpose**: Ensure all shared types are current and properly exported

**Actions:**

- Generate type definitions from Prisma
- Validate shared type exports
- Check type coverage
- Fix type inconsistencies
- Update type documentation

**Why now**: Documentation code examples use types, so types must be accurate first.

---

### Phase 3: Documentation Synchronization (Sequential)

**Purpose**: Update all documentation to reflect current codebase state

**Why sequential**: Documentation sync needs to see the results of Phase 2 updates.

#### 3.1 Docusaurus Documentation Sync (docs-maintainer)

```bash
/sync-docs
```

**Actions:**

- Analyze code changes since last sync
- Create docs for new features
- Update docs for modified features
- Fix broken internal links
- Update code examples
- Validate all API documentation
- Update sidebar navigation
- Build and validate Docusaurus

**Scope:**

- `apps/docs/docs/guides/` - Feature documentation
- `apps/docs/docs/api/` - API reference
- `apps/docs/docs/architecture/` - Architecture docs
- `apps/docs/docs/operations/` - Operations guides
- `apps/docs/sidebars.ts` - Navigation structure

**Why sequential**: Needs complete view of updated configurations from Phase 2.

---

### Phase 4: Comprehensive Review (Parallel)

**Purpose**: Validate quality, security, and architecture

**Why last**: Reviews should see the complete synchronized state.

#### 4.1 Architecture Review (senior-architect)

**Agent**: senior-architect
**Scope**: High-level architecture and design patterns

**Reviews:**

- Overall system architecture
- Design pattern usage
- Scalability considerations
- Technology choices
- Technical debt assessment

---

#### 4.2 Frontend Review (frontend-expert)

**Agent**: frontend-expert
**Scope**: React 19, TypeScript, UI/UX

**Reviews:**

- Component architecture
- React 19 best practices
- TypeScript usage
- Performance (rendering, re-renders)
- Accessibility
- Tailwind CSS patterns
- shadcn/ui integration

---

#### 4.3 Backend Review (backend-expert)

**Agent**: backend-expert
**Scope**: NestJS 11, API design, security

**Reviews:**

- API design and RESTful patterns
- NestJS module architecture
- Authentication/authorization
- Error handling
- Input validation
- Business logic

---

#### 4.4 Database Review (database-expert)

**Agent**: database-expert
**Scope**: PostgreSQL 18, Prisma 6, schema design

**Reviews:**

- Schema design
- Relationships and constraints
- Index optimization
- Query performance
- Migration safety
- Row-level security (RLS)
- Backup strategies

---

#### 4.5 Code Quality Enforcement (code-quality-enforcer)

**Agent**: code-quality-enforcer
**Scope**: Standards compliance

**Enforces:**

- ESLint rules
- Prettier formatting
- TypeScript strict mode
- Naming conventions
- Code organization
- Test coverage

---

#### 4.6 Performance Optimization (performance-optimizer)

**Agent**: performance-optimizer
**Scope**: React and NestJS performance

**Analyzes:**

- React rendering performance
- Bundle size optimization
- API response times
- Database query performance
- Caching strategies
- Memory usage

---

#### 4.7 Code Duplication Detection (code-duplication-detector)

**Agent**: code-duplication-detector
**Scope**: DRY principle enforcement

**Identifies:**

- Duplicate code blocks
- Repeated patterns
- Extraction opportunities
- Shared utility needs
- Component abstraction

---

#### 4.8 Module Boundary Validation (module-boundaries)

**Agent**: module-boundaries
**Scope**: Nx dependency graph

**Validates:**

- No circular dependencies
- Nx tag compliance
- Import violations
- Library access patterns
- Dependency direction

---

#### 4.9 Security Audit (security-specialist)

**Agent**: Combined security review
**Scope**: Application security

**Audits:**

- Authentication mechanisms
- Authorization rules
- Input validation
- SQL injection prevention
- XSS prevention
- CSRF protection
- Dependency vulnerabilities
- Secret management
- API security

---

### Phase 5: Final Validation (Sequential)

**Purpose**: Ensure all synchronization succeeded

#### 5.1 Build Validation

```bash
nx build frontend
nx build backend
nx build docs
```

**Validates:**

- All apps build successfully
- No compilation errors
- No build warnings

---

#### 5.2 Test Validation

```bash
nx run-many --target=test --all
```

**Validates:**

- All tests still passing
- No regressions introduced
- Coverage maintained

---

## Orchestration Flow

```
┌─────────────────────────────────────────────────────────────┐
│ PHASE 1: Quality Gate (Sequential - Blocking)              │
│ /check-all                                                  │
│   ├─ Format  ✅                                             │
│   ├─ Lint    ✅                                             │
│   ├─ Type    ✅                                             │
│   └─ Test    ✅                                             │
└────────────────┬────────────────────────────────────────────┘
                 │ ALL PASS
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ PHASE 2: Configuration Sync (Parallel)                     │
│                                                             │
│ ┌──────────────────┐ ┌─────────────────┐ ┌──────────────┐ │
│ │ /update-agents   │ │ /update-commands│ │ Type Sync    │ │
│ │ (subagent-       │ │ (claude-code-   │ │ (typescript- │ │
│ │  updater)        │ │  optimizer)     │ │  guardian)   │ │
│ └──────────────────┘ └─────────────────┘ └──────────────┘ │
│                                                             │
└────────────────┬────────────────────────────────────────────┘
                 │ ALL COMPLETE
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ PHASE 3: Documentation Sync (Sequential)                   │
│                                                             │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ /sync-docs (docs-maintainer)                          │  │
│ │  ├─ Analyze code changes                              │  │
│ │  ├─ Create/update Docusaurus docs                     │  │
│ │  ├─ Fix broken links                                  │  │
│ │  ├─ Update code examples                              │  │
│ │  ├─ Update sidebar navigation                         │  │
│ │  └─ Build and validate                                │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
└────────────────┬────────────────────────────────────────────┘
                 │ COMPLETE
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ PHASE 4: Comprehensive Review (Parallel)                   │
│                                                             │
│ ┌───────────┐ ┌──────────┐ ┌─────────┐ ┌──────────────┐   │
│ │Architecture│ │ Frontend │ │ Backend │ │   Database   │   │
│ │  (senior-  │ │(frontend-│ │(backend-│ │  (database-  │   │
│ │ architect) │ │ expert)  │ │ expert) │ │   expert)    │   │
│ └───────────┘ └──────────┘ └─────────┘ └──────────────┘   │
│                                                             │
│ ┌───────────┐ ┌──────────┐ ┌─────────┐ ┌──────────────┐   │
│ │  Quality  │ │Performance│ │Duplicate│ │   Boundary   │   │
│ │  (code-   │ │(perf-    │ │ (dup-   │ │  (module-    │   │
│ │ quality-  │ │optimizer)│ │detector)│ │ boundaries)  │   │
│ │ enforcer) │ └──────────┘ └─────────┘ └──────────────┘   │
│ └───────────┘                                               │
│                                                             │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ Security (security-specialist)                        │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
└────────────────┬────────────────────────────────────────────┘
                 │ ALL COMPLETE
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ PHASE 5: Final Validation (Sequential)                     │
│   ├─ Build Validation (all apps)  ✅                        │
│   └─ Test Validation (all tests)  ✅                        │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ COMPLETE: Generate Unified Report                          │
└─────────────────────────────────────────────────────────────┘
```

## Usage

```bash
# Full synchronization (most common)
/sync-all

# With specific scope
/sync-all [feature-name]
/sync-all frontend
/sync-all backend
/sync-all authentication

# Skip specific phases (advanced)
/sync-all --skip-review
/sync-all --skip-security
/sync-all --skip-docs

# Only specific phases
/sync-all --only config
/sync-all --only docs
/sync-all --only review

# Dry run (show what would be done)
/sync-all --dry-run
```

## When to Run

### Required (Always Run)

✅ **After completing any feature**

```bash
/implement-feature appointment-booking fullstack
/sync-all  # ← Always run after feature
/commit "feat(appointments): add booking feature"
```

✅ **Before creating a pull request**

```bash
# Feature complete
git status
/sync-all  # ← Ensure everything synchronized
# Review report, fix critical items
/commit "chore: sync codebase"
# Create PR
```

✅ **After merging major changes**

```bash
git pull origin main
/sync-all  # ← Sync with latest changes
```

✅ **Before releases**

```bash
# Prepare for release
/sync-all
# Review all reports
# Fix critical/high priority items
# Tag release
```

### Recommended (Best Practice)

✅ **Weekly maintenance** - Keep repository healthy
✅ **After dependency updates** - Ensure compatibility
✅ **After major refactoring** - Validate changes
✅ **When onboarding new team members** - Validate docs

### Optional (Use Judgment)

⚠️ **After small bug fixes** - Use `/check-all` instead
⚠️ **During active development** - Run Phase 1 only
⚠️ **For experimental branches** - Not needed

## What Gets Synchronized

### 1. Configuration Files

- `.claude/agents/*.md` - Agent configurations
- `.claude/commands/*.md` - Slash commands
- `eslint.config.mjs` - Linting rules
- `tsconfig.*.json` - TypeScript config
- Package versions in all configs

### 2. Documentation

- `apps/docs/docs/guides/` - Feature guides
- `apps/docs/docs/api/` - API reference
- `apps/docs/docs/architecture/` - Architecture
- `apps/docs/docs/operations/` - Operations
- `apps/docs/sidebars.ts` - Navigation
- All CLAUDE.md files

### 3. Type Definitions

- `libs/shared/types/` - Shared types
- Prisma generated types
- API response types
- DTO type exports

### 4. Code Quality

- All linting issues fixed
- All formatting standardized
- All type errors resolved
- All tests passing

### 5. Architecture

- Module boundaries validated
- No circular dependencies
- Nx tags compliant
- Clean dependency graph

### 6. Security

- Vulnerabilities identified
- Security best practices enforced
- Authentication validated
- Data protection verified

### 7. Performance

- Bottlenecks identified
- Optimization opportunities documented
- Query performance reviewed
- Bundle size analyzed

## Output Report

The command generates a comprehensive unified report:

````markdown
# Complete Codebase Synchronization Report

**Generated**: 2025-10-11 15:30:00
**Duration**: 4m 32s
**Status**: ✅ ALL PHASES COMPLETE

═══════════════════════════════════════════════════════════

## Phase 1: Quality Gate ✅

- ✅ Format: All 847 files formatted
- ✅ Lint: 0 errors, 327 warnings (all acceptable)
- ✅ TypeCheck: All compilation successful
- ✅ Test: 147/147 tests passing

═══════════════════════════════════════════════════════════

## Phase 2: Configuration Synchronization ✅

### Agent Updates (subagent-updater)

- Updated 17 agent configurations
- Synced versions: React 19.0.0, NestJS 11.2.0, Bun 1.3.0
- Added 3 new capabilities
- Updated 12 best practices

### Command Updates (claude-code-optimizer)

- Validated 22 slash commands
- Created 1 new command: /sync-all
- Updated 4 command descriptions
- Optimized 6 workflows

### Type Synchronization (typescript-guardian)

- Generated Prisma types
- Validated 89 shared type exports
- Fixed 2 type inconsistencies
- Type coverage: 98.5%

═══════════════════════════════════════════════════════════

## Phase 3: Documentation Synchronization ✅

### Docusaurus Updates (docs-maintainer)

- Analyzed 23 code changes
- Created 2 new documentation files
- Updated 8 existing files
- Fixed 3 broken links
- Updated 12 code examples
- Added 2 sidebar entries
- Build: ✅ SUCCESS
- Preview: http://localhost:3002

**Files Created:**

- `apps/docs/docs/guides/appointment-booking.md`
- `apps/docs/docs/api/appointments.md`

**Files Updated:**

- `apps/docs/docs/architecture/database.md`
- `apps/docs/docs/getting-started/quick-start.md`
- ... (6 more)

**Documentation Coverage:**

- Feature docs: 95% (+10%)
- API docs: 90% (+5%)
- Architecture docs: 100%

═══════════════════════════════════════════════════════════

## Phase 4: Comprehensive Review ✅

### Architecture (senior-architect)

✅ Excellent overall design
✅ Clean separation of concerns
✅ Proper Nx monorepo structure
⚠️ Suggestion: Consider caching layer for JWT strategy
⚠️ Suggestion: Document ADR for admin CRUD pattern

### Frontend (frontend-expert)

✅ React 19 best practices followed
✅ Component structure excellent
✅ TypeScript usage strong
⚠️ Minor: 2 components could use memo optimization
✅ Accessibility: WCAG 2.1 AA compliant

### Backend (backend-expert)

✅ NestJS architecture solid
✅ API design RESTful and consistent
✅ Authentication secure (JWT + CSRF + RLS)
⚠️ Suggestion: Add rate limiting on refresh endpoint
✅ Error handling comprehensive

### Database (database-expert)

✅ Schema design normalized
✅ Indexes properly configured
✅ Row-level security active
⚠️ Recommendation: Add index on users.lastLogin
✅ Migration strategy sound

### Code Quality (code-quality-enforcer)

✅ 0 ESLint errors
✅ 327 warnings (all documented/acceptable)
✅ Prettier formatting consistent
✅ TypeScript strict mode enabled
✅ Test coverage: 85% (target: 80%)

### Performance (performance-optimizer)

✅ No critical bottlenecks
✅ Bundle size: 245 KB (good)
⚠️ Opportunity: Lazy load admin routes
✅ API response times: p95 < 200ms
✅ Database queries optimized

### Code Duplication (code-duplication-detector)

✅ Overall DRY compliance good
⚠️ Found 3 duplicated patterns

- User validation logic (2 locations)
- Error formatting (3 locations)
- Date formatting helpers (2 locations)
  ⚠️ Recommendation: Extract to shared utilities

### Module Boundaries (module-boundaries)

✅ No circular dependencies
✅ All Nx tags compliant
✅ Clean dependency graph
✅ No import violations

### Security (security-specialist)

✅ Authentication: JWT with rotation ✅
✅ Authorization: RBAC with permissions ✅
✅ CSRF protection active ✅
✅ Row-level security active ✅
✅ Input validation comprehensive ✅
⚠️ Low priority: Add 2FA support (future)
✅ Dependencies: 0 critical vulnerabilities

═══════════════════════════════════════════════════════════

## Phase 5: Final Validation ✅

### Build Validation

- ✅ frontend: Build successful (3.2s)
- ✅ backend: Build successful (4.1s)
- ✅ docs: Build successful (8.3s)

### Test Validation

- ✅ All tests passing: 147/147
- ✅ No regressions detected
- ✅ Coverage maintained: 85%

═══════════════════════════════════════════════════════════

## Summary

**Status**: ✅ FULLY SYNCHRONIZED

**Quality Metrics:**

- Code Quality: 98/100
- Documentation: 95/100
- Architecture: 96/100
- Security: 99/100
- Performance: 94/100

**Action Items:**

**Critical (Fix Before Merge):** None ✅

**High Priority (Address Soon):**

- Add rate limiting on JWT refresh endpoint
- Add index on users.lastLogin column

**Medium Priority (Next Sprint):**

- Implement JWT strategy caching with Redis
- Extract duplicated validation utilities
- Lazy load admin routes for better performance

**Low Priority (Future):**

- Document ADR for admin CRUD pattern
- Add 2FA support
- Memo optimize 2 large components

═══════════════════════════════════════════════════════════

## Files Modified During Sync

**Agent Configurations (17 files):**

- `.claude/agents/senior-architect.md`
- `.claude/agents/frontend-expert.md`
- ... (15 more)

**Commands (2 files):**

- `.claude/commands/sync-all.md` (created)
- `.claude/SLASH_COMMANDS.md` (updated)

**Documentation (10 files):**

- `apps/docs/docs/guides/appointment-booking.md` (created)
- `apps/docs/docs/api/appointments.md` (created)
- ... (8 more)

**Types (3 files):**

- `libs/shared/types/src/index.ts`
- `libs/shared/types/src/lib/admin/index.ts`
- `node_modules/.prisma/client/index.d.ts` (generated)

═══════════════════════════════════════════════════════════

## Next Steps

1. Review action items above
2. Fix high priority items
3. Commit synchronized changes:

   ```bash
   git add .
   git commit -m "chore: complete codebase synchronization

   - Update all agent configurations
   - Sync documentation with codebase
   - Address review feedback
   - Validate all quality gates"
   ```
````

4. Create pull request if on feature branch

═══════════════════════════════════════════════════════════

**Synchronization Complete** ✅

Repository is production-ready with:

- ✅ All quality gates passing
- ✅ Complete documentation
- ✅ Current configurations
- ✅ Comprehensive validation
- ✅ Security verified

**Total Time**: 4 minutes 32 seconds

````

## Best Practices

### DO ✅

- Run `/sync-all` after every feature completion
- Run before creating pull requests
- Review the complete report
- Fix all critical items immediately
- Address high priority items before merge
- Commit sync changes separately from feature changes

### DON'T ❌

- Skip synchronization "to save time"
- Ignore action items in report
- Run on broken codebase (Phase 1 will catch this)
- Skip review of generated documentation
- Commit without running `/sync-all` first

## Performance

**Average Duration:**
- Small changes: ~2-3 minutes
- Medium changes: ~4-6 minutes
- Large features: ~8-12 minutes

**Parallelization Benefit:**
- Sequential would take: ~25-30 minutes
- Parallel execution: ~4-6 minutes
- **Speed improvement: 80% faster**

## Troubleshooting

### Issue: Phase 1 fails

**Solution**: Fix quality issues before proceeding

```bash
# Format issues
bun run format

# Lint issues
bun run lint:fix

# Type errors (manual fix required)
# Fix type errors in reported files

# Test failures (manual fix required)
# Fix failing tests

# Retry
/sync-all
````

### Issue: Documentation sync creates incorrect docs

**Solution**: Review and manually correct

1. Check generated files in `apps/docs/docs/`
2. Update content for accuracy
3. Add detailed examples
4. Re-run `/sync-all` to validate

### Issue: Review phase reports many warnings

**Solution**: This is normal and expected

- Warnings are suggestions, not blockers
- Prioritize by severity (Critical > High > Medium > Low)
- Address critical/high before merge
- Plan medium/low for future iterations

### Issue: Command takes too long

**Solution**: Use scoped sync

```bash
# Only sync specific scope
/sync-all frontend
/sync-all backend

# Skip expensive phases
/sync-all --skip-review
```

## Integration with Workflows

### Standard Feature Workflow

```bash
# 1. Implement feature
/test-first BookingForm unit
/implement-feature appointment-booking fullstack

# 2. Synchronize everything
/sync-all

# 3. Review and fix critical items
# (Review report, fix critical/high items)

# 4. Commit
/commit "feat(appointments): add booking with sync"

# 5. Create PR
gh pr create --title "Add appointment booking"
```

### Pre-Release Workflow

```bash
# 1. Full synchronization
/sync-all

# 2. Review comprehensive report
# Fix ALL critical and high priority items

# 3. Final validation
/check-all
/full-test

# 4. Tag release
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

### Weekly Maintenance Workflow

```bash
# Every Monday morning
/sync-all

# Review action items
# Plan sprint to address medium priority items

# Keep repository healthy
```

## Technology Stack

**Powered by:**

- 18+ Specialist Agents
- Nx 21.6.3 (affected detection, dependency graph)
- Bun 1.3.0 (fast execution)
- Claude Code (orchestration)

**Quality Tools:**

- Prettier 3.6.2
- ESLint 9.8.0
- TypeScript 5.9.2
- Vitest 3.0.0 / Jest 30.0.2

## Related Commands

- `/check-all` - Phase 1 only (quick quality check)
- `/sync-repo` - Repository sync (superseded by this command)
- `/sync-docs` - Documentation only (included in Phase 3)
- `/full-review` - Review only (included in Phase 4)
- `/implement-feature` - Feature workflow (should end with this command)
- `/commit` - Quality checks and commit

## See Also

- **Agent Catalog**: `.claude/AGENT_COMMAND_CATALOG.md`
- **Workflow Guide**: `.claude/WORKFLOWS.md`
- **Documentation Standards**: `apps/docs/README.md`
- **Quality Standards**: `CLAUDE.md`

---

**The /sync-all command ensures your entire codebase - code, docs, configs, and quality - stays in perfect synchronization.**

**Use this as the final step after every feature to maintain a production-ready, well-documented, and fully validated codebase.**

**Remember**: Synchronization is not optional. It's how we maintain professional-grade quality.
