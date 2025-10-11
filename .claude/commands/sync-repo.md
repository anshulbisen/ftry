---
description: Complete repository synchronization after feature implementation - runs all maintenance tasks in parallel
---

Run comprehensive repository maintenance and synchronization in parallel after building any feature. This command ensures all documentation, code quality, agent configurations, and reviews are up to date.

## Execution Strategy

### Phase 1: Quality Gate (Sequential - Must Pass First)

Run quality checks to ensure codebase is in good state:

```bash
/check-all
```

**Must pass before proceeding:**

- Formatting (Prettier)
- Linting (ESLint with auto-fix)
- Type checking (TypeScript strict mode)
- Tests (all must pass)

If any check fails, stop immediately and fix issues.

### Phase 2: Parallel Maintenance (Independent Tasks)

Once quality gates pass, launch ALL maintenance specialists **in parallel**:

#### 1. **Documentation Synchronization** (docs-maintainer)

```bash
/update-docs
```

- Update docs for recent changes
- Validate all documentation
- Generate metrics report
- Fix broken links
- Update code examples

#### 2. **Agent Configuration Sync** (subagent-updater)

```bash
/update-agents
```

- Sync with latest package versions
- Update technology stack references
- Discover new libraries
- Update agent capabilities
- Refresh best practices

#### 3. **Command Synchronization** (claude-code-optimizer)

```bash
/update-commands
```

- Sync slash commands with agents
- Update command descriptions
- Create missing commands
- Update version references
- Optimize workflows

#### 4. **Comprehensive Code Review** (all review specialists)

```bash
/full-review
```

**Parallel reviews by:**

- senior-architect (architecture, design patterns)
- frontend-expert (React, TypeScript, UI/UX)
- backend-expert (NestJS, API design, security)
- database-expert (schema, queries, performance)
- code-quality-enforcer (standards compliance)
- performance-optimizer (bottlenecks, optimization)
- code-duplication-detector (DRY violations)
- module-boundaries (dependency violations)

#### 5. **Security Audit** (security specialists)

```bash
/security-audit
```

- Vulnerability scanning
- Authentication/authorization review
- Data protection validation
- API security assessment
- Dependency security check

#### 6. **Module Boundary Check** (module-boundaries)

```bash
/fix-boundaries
```

- Detect circular dependencies
- Enforce Nx tag rules
- Identify import violations
- Fix boundary issues

## Usage

```bash
# Full synchronization after feature
/sync-repo

# With specific scope
/sync-repo authentication
/sync-repo frontend
/sync-repo backend

# Skip specific checks (comma-separated)
/sync-repo --skip security,boundaries

# Only run specific tasks
/sync-repo --only docs,agents,commands
```

## What Gets Updated

### 1. **Documentation** (`docs/`)

- Feature documentation
- API documentation
- Architecture docs
- CLAUDE.md files
- README files
- Migration guides

### 2. **Agent Configurations** (`.claude/agents/`)

- Package versions (React 19, NestJS 11, etc.)
- New dependencies
- Technology stack changes
- Best practices updates
- Tool configurations

### 3. **Slash Commands** (`.claude/commands/`)

- New command creation
- Description updates
- Usage example updates
- Version synchronization
- Workflow optimization

### 4. **Code Quality**

- Linting issues resolved
- Formatting standardized
- Type safety enforced
- Test coverage validated
- No build errors

### 5. **Architecture**

- Module boundaries enforced
- Dependency graph clean
- No circular dependencies
- Nx tag compliance
- Library structure validated

### 6. **Security**

- Vulnerabilities identified
- Security best practices enforced
- Authentication/authorization validated
- Data protection verified
- Dependencies audited

### 7. **Performance**

- Bottlenecks identified
- Optimization opportunities
- Query performance reviewed
- Bundle size analyzed
- Rendering optimized

## Expected Outputs

### Summary Report

```
Repository Synchronization Report
=================================

✅ Quality Gates: PASSED
  - Format: ✅ All files formatted
  - Lint: ✅ No violations
  - TypeCheck: ✅ No errors
  - Tests: ✅ 245 passed

🔄 Parallel Maintenance (6 tasks):

✅ Documentation Update
  - 8 files updated
  - 2 new docs created
  - 0 broken links
  - 95% coverage

✅ Agent Config Sync
  - 17 agents updated
  - React 19 → 19.0.0
  - NestJS 11 → 11.2.0
  - 3 new capabilities added

✅ Command Synchronization
  - 22 commands validated
  - 1 new command created
  - 4 descriptions improved
  - All workflows optimized

✅ Code Review (8 specialists)
  - Architecture: ✅ Excellent design
  - Frontend: ⚠️ 2 minor suggestions
  - Backend: ✅ Well structured
  - Database: ⚠️ 1 index recommendation
  - Quality: ✅ Standards met
  - Performance: ✅ No issues
  - Duplication: ⚠️ 1 opportunity
  - Boundaries: ✅ Clean graph

✅ Security Audit
  - 0 critical vulnerabilities
  - 0 high vulnerabilities
  - 1 low vulnerability (noted)
  - Authentication: ✅ Secure
  - Data protection: ✅ Compliant

✅ Module Boundaries
  - No circular dependencies
  - All tags compliant
  - Clean dependency graph
  - 0 violations

=================================
Total Time: ~3-5 minutes (parallel)
Status: ✅ REPOSITORY SYNCHRONIZED
=================================
```

### Action Items

Prioritized list of recommendations:

- **Critical**: Must fix immediately
- **High**: Should fix before merge
- **Medium**: Consider for next iteration
- **Low**: Nice to have improvements

### Files Modified

List of all files changed during synchronization:

- Documentation updates
- Configuration changes
- Code improvements (if auto-fixable)

## When to Run

### Required

- ✅ After completing any feature
- ✅ Before creating a pull request
- ✅ After merging major changes
- ✅ Before releases

### Recommended

- ✅ Weekly maintenance
- ✅ After dependency updates
- ✅ After major refactoring
- ✅ When onboarding new team members

### Optional

- After small bug fixes (use `/check-all` instead)
- During active development (run phase 1 only)
- For experimental branches

## Performance

**Initial Run**: ~3-5 minutes (all tasks in parallel)

**Cached Run**: ~1-2 minutes (minimal changes)

**Phase 1 Only**: ~30-60 seconds (quality checks)

**Parallel Efficiency**: 80% faster than sequential

## Best Practices

### 1. **Run After Feature Completion**

```bash
# Standard workflow
/test-first BookingForm unit
/implement-feature appointment-booking fullstack
/sync-repo  # ← Run this after implementation
/commit "feat(appointments): add booking feature"
```

### 2. **Review Before Merge**

```bash
# Pre-merge checklist
/sync-repo
# Review all reports
# Fix critical/high priority items
/commit "fix: address review feedback"
```

### 3. **Regular Maintenance**

```bash
# Weekly maintenance sprint
/sync-repo --only docs,agents,commands
```

### 4. **Custom Scope**

```bash
# Frontend-only changes
/sync-repo frontend

# Backend-only changes
/sync-repo backend

# Specific feature
/sync-repo authentication
```

## Troubleshooting

### Quality Gate Failures

**Problem**: Phase 1 fails, parallel tasks don't run

**Solution**: Fix quality issues first

```bash
bun run format
bun run lint:fix
# Fix type errors manually
bun run test
# Then retry
/sync-repo
```

### Long Running Time

**Problem**: Command takes longer than expected

**Solution**: Check specific tasks

- Large docs update? Normal for major features
- Many agent updates? Normal after dependency changes
- Slow reviews? Complex codebase areas

### Conflicting Changes

**Problem**: Multiple tasks modify same files

**Solution**: Command handles this automatically

- Documentation takes precedence
- User changes preserved
- Conflicts reported for manual resolution

## Integration with Workflows

### Feature Development Workflow

```bash
/implement-feature [name] [scope]  # Build feature
/sync-repo                          # Synchronize everything
/commit "feat(scope): description" # Commit changes
```

### Pre-Release Workflow

```bash
/sync-repo                     # Full synchronization
/full-test                     # Comprehensive testing
/optimize-performance          # Performance tuning
# Review all reports
# Fix all critical/high items
/commit "chore: pre-release sync"
```

### Maintenance Workflow

```bash
# Weekly maintenance
/sync-repo --only docs,agents,commands
/update-docs metrics
# Review and plan improvements
```

### Review Workflow

```bash
# Before creating PR
/sync-repo
# Review comprehensive report
# Address feedback
/commit "fix: address review feedback"
# Create PR
```

## Configuration

**Customize behavior** in `.claude/sync-repo.config.json` (optional):

```json
{
  "quality_gate": {
    "required": true,
    "fail_fast": true
  },
  "parallel_tasks": {
    "docs": true,
    "agents": true,
    "commands": true,
    "review": true,
    "security": true,
    "boundaries": true
  },
  "timeouts": {
    "quality_gate": 120000,
    "parallel_tasks": 300000
  },
  "reports": {
    "detailed": true,
    "summary": true,
    "action_items": true
  }
}
```

## Technical Details

### Parallel Execution

Uses Claude Code's agent orchestration to run tasks concurrently:

```
Quality Gate (Sequential)
    ↓
    PASS
    ↓
    ├─→ docs-maintainer ────────┐
    ├─→ subagent-updater ───────┤
    ├─→ claude-code-optimizer ──┤
    ├─→ full-review (8 agents) ─┤→ Aggregate
    ├─→ security-audit ─────────┤   Results
    └─→ module-boundaries ──────┘
```

### Agent Coordination

- **No dependencies**: All phase 2 tasks are independent
- **No conflicts**: Each task has distinct focus area
- **Safe parallelization**: No race conditions
- **Efficient**: Maximum resource utilization

### Error Handling

- Phase 1 failure stops execution
- Phase 2 failures reported but don't block others
- Partial success allowed (e.g., 5/6 tasks complete)
- Detailed error reports for failed tasks

## Technology Stack

**Powered by:**

- **17 Specialist Agents** - Domain expertise
- **Nx 21.6.3** - Affected detection
- **Bun 1.2.19** - Fast execution
- **Claude Code** - Orchestration

**Quality Tools:**

- Prettier 3.6.2 (formatting)
- ESLint 9.8.0 (linting)
- TypeScript 5.9.2 (type checking)
- Vitest 3.0.0 / Jest 30.0.2 (testing)

## See Also

- `/check-all` - Phase 1 only (quick quality check)
- `/full-review` - Comprehensive review only
- `/update-docs` - Documentation update only
- `/update-agents` - Agent sync only
- `/update-commands` - Command sync only
- `/security-audit` - Security audit only
- `/implement-feature` - Full feature workflow with sync
- `/commit` - Quality checks and commit

---

**The /sync-repo command ensures your repository is always in a production-ready state with up-to-date documentation, synchronized configurations, and comprehensive quality validation.**

**Use this after every feature to maintain repository health and developer productivity.**
