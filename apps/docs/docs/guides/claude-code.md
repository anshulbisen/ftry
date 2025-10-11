# Working with Claude Code

ftry is optimized for development with Claude Code (AI-powered coding assistant). This guide explains how to leverage Claude's capabilities effectively.

## Claude Code Setup

### Installation

Claude Code is accessed via:

- **Claude.ai**: https://claude.com/claude-code
- **Desktop App**: Download from anthropic.com

### Project Context

The `.claude/` directory contains agent configurations and workflows:

```
.claude/
├── agents/                   # Specialized AI agents
│   ├── senior-architect.md
│   ├── frontend-expert.md
│   ├── backend-expert.md
│   └── docs-maintainer.md
├── commands/                 # Slash commands
│   ├── sync-repo.md
│   ├── update-docs.md
│   └── implement-feature.md
├── AGENT_COMMAND_CATALOG.md  # Quick reference
└── DOCUMENTATION_STANDARDS.md # Documentation policy
```

## Slash Commands

Quick workflows for common tasks.

### `/sync-repo`

Comprehensive repository synchronization after feature development.

**What it does**:

1. Updates Docusaurus documentation
2. Syncs agent configurations
3. Updates command files
4. Runs full code review
5. Performs security audit

**Usage**:

```
/sync-repo
```

**When to use**: After completing a feature, before PR.

---

### `/update-docs [feature-name]`

Update Docusaurus documentation for a specific feature.

**Usage**:

```
/update-docs authentication
/update-docs new admin-appointments
/update-docs validate
```

**Options**:

- `[feature-name]` - Update specific feature docs
- `new [feature-name]` - Create new feature documentation
- `validate` - Check documentation consistency

**When to use**: After implementing feature, before commit.

---

### `/implement-feature [name] [type]`

Full TDD feature implementation workflow.

**Usage**:

```
/implement-feature appointment-booking fullstack
/implement-feature user-profile frontend
/implement-feature billing-service backend
```

**Types**:

- `fullstack` - Frontend + backend + tests + docs
- `frontend` - Frontend feature only
- `backend` - Backend service only

**Workflow**:

1. Write failing tests
2. Implement minimal code
3. Refactor
4. Update documentation
5. Run quality checks

---

### `/test-first [component] [type]`

Test-Driven Development for specific component.

**Usage**:

```
/test-first BookingForm unit
/test-first AuthService integration
/test-first UserCRUD e2e
```

**Types**:

- `unit` - Component/function unit tests
- `integration` - Service integration tests
- `e2e` - End-to-end workflow tests

---

### `/full-review`

Comprehensive code quality review.

**Checks**:

- Code quality and patterns
- Test coverage (target: 80%)
- Documentation completeness
- Security vulnerabilities
- Performance issues
- Type safety

**Usage**:

```
/full-review
```

---

### `/quick-fix [issue]`

Targeted fixes for specific issues.

**Usage**:

```
/quick-fix performance
/quick-fix security
/quick-fix types
```

---

### `/commit [message]`

Quality-checked commit workflow.

**Usage**:

```
/commit "feat(auth): implement refresh token rotation"
```

**What it does**:

1. Runs quality checks (format, lint, typecheck, test)
2. Validates commit message format
3. Commits if all checks pass

---

## Specialized Agents

Invoke experts for specific domains.

### `/use-agent senior-architect [task]`

System design and architecture decisions.

**Use for**:

- Database schema design
- API design patterns
- Scalability planning
- Security architecture

**Example**:

```
/use-agent senior-architect "Design appointment booking schema"
```

---

### `/use-agent frontend-expert [task]`

React, component design, state management.

**Use for**:

- Component architecture
- State management patterns
- Performance optimization
- UI/UX implementation

**Example**:

```
/use-agent frontend-expert "Optimize ResourceManager rendering"
```

---

### `/use-agent backend-expert [task]`

NestJS, services, business logic.

**Use for**:

- Service layer design
- Business logic implementation
- API endpoint design
- Database query optimization

**Example**:

```
/use-agent backend-expert "Implement appointment conflict detection"
```

---

### `/use-agent docs-maintainer [task]`

Docusaurus documentation management.

**Use for**:

- Creating documentation
- Updating docs after code changes
- Documentation structure
- Migration from legacy docs

**Example**:

```
/use-agent docs-maintainer "Document new billing API"
```

---

## Best Practices

### When to Use Claude Code

✅ **Great for**:

- Generating boilerplate code
- Writing tests
- Refactoring
- Documentation updates
- Code reviews
- Learning codebase patterns

❌ **Not ideal for**:

- Critical security logic (always review!)
- Production database migrations
- Environment configuration
- Git operations (use manual review)

### Effective Prompts

**Good Prompts**:

```
"Create a new admin resource for Appointments with CRUD operations.
Include:
- ResourceConfig with all required fields
- Custom AppointmentForm component
- TanStack Query hooks
- Table columns with status badge
- Permission checks for create/read/update/delete"
```

**Poor Prompts**:

```
"Make appointments page"
```

### Review AI-Generated Code

Always review and test AI-generated code:

1. **Read the implementation** - Understand what was generated
2. **Run tests** - `nx test [project]`
3. **Type check** - `nx typecheck [project]`
4. **Manual test** - Use the feature locally
5. **Security review** - Check for vulnerabilities
6. **Documentation** - Ensure docs were updated

## Documentation Policy

**CRITICAL**: All technical documentation MUST be in Docusaurus.

### Rules

✅ **DO**:

- Create all docs in `apps/docs/docs/`
- Update docs after every feature
- Use `/update-docs` command
- Validate with `nx build docs`

❌ **DON'T**:

- Create standalone .md files in `docs/` root
- Create README.md outside package directories
- Skip documentation updates
- Commit without documentation

### Documentation Structure

```
apps/docs/docs/
├── getting-started/     # Onboarding
├── architecture/        # System design
├── api/                 # REST API reference
└── guides/              # How-to guides
```

### After Code Changes

```bash
# Update documentation
/update-docs [feature-name]

# Validate (fails on broken links)
nx build docs

# Preview
nx serve docs  # http://localhost:3002
```

## Common Workflows

### Implementing New Feature

```bash
# 1. Create feature with TDD
/implement-feature appointment-booking fullstack

# 2. Manual testing
nx serve frontend
nx serve backend

# 3. Update documentation
/update-docs appointment-booking

# 4. Sync repository
/sync-repo

# 5. Commit
/commit "feat(appointments): implement booking system"
```

### Fixing Bugs

```bash
# 1. Write failing test that reproduces bug
/test-first BuggyComponent unit

# 2. Fix the bug

# 3. Verify fix
nx test [project]

# 4. Commit
/commit "fix(component): resolve rendering issue"
```

### Refactoring

```bash
# 1. Ensure tests exist
nx test [project]

# 2. Refactor code

# 3. Ensure tests still pass
nx test [project]

# 4. Update docs if needed
/update-docs [feature]

# 5. Commit
/commit "refactor(module): improve code structure"
```

## Tips and Tricks

### Ask for Explanations

```
"Explain how Row-Level Security works in the JWT strategy"
"Show me an example of using ResourceManager for a new resource"
```

### Request Multiple Options

```
"Give me 3 approaches to implement appointment conflict detection,
with pros/cons of each"
```

### Iterative Refinement

```
1. "Create basic AppointmentForm component"
2. "Add validation with zod"
3. "Add date/time picker with conflict detection"
4. "Add recurring appointment support"
```

### Code Review Requests

```
"Review this AuthService implementation for security vulnerabilities"
"Suggest performance improvements for this database query"
```

## Resources

- **Agent Catalog**: `.claude/AGENT_COMMAND_CATALOG.md`
- **Workflows**: `.claude/WORKFLOWS.md`
- **Documentation Standards**: `.claude/DOCUMENTATION_STANDARDS.md`
- **Project Context**: `CLAUDE.md` (root + module-specific)

---

**Last Updated**: 2025-10-11
**Claude Code Version**: Latest
