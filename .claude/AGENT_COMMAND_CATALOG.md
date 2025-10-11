# Claude Code Agent & Command Catalog

## Complete Agent & Command Reference for ftry Project

This catalog provides a comprehensive reference for all specialist agents and slash commands available in the ftry project, optimized for maximum productivity with Claude Code.

---

## 🤖 Specialist Agents (17 Total)

### Core Architecture & Review

#### 1. **senior-architect**

- **Purpose**: Strategic technical oversight and architectural decisions
- **Expertise**: System design, scalability, performance strategies, technical debt
- **Commands**: `/architecture-review`, `/full-review`
- **Best For**: Major architectural decisions, system design reviews, technical roadmap

#### 2. **nx-specialist**

- **Purpose**: Nx monorepo architecture expert
- **Expertise**: Library creation, dependency management, build optimization, module boundaries
- **Commands**: `/add-library`, `/manage-agents`
- **Best For**: Creating libraries, refactoring architecture, optimizing builds

### Frontend Development

#### 3. **frontend-expert**

- **Purpose**: React 19, TypeScript, and Tailwind CSS specialist
- **Expertise**: Component architecture, hooks, performance, accessibility, type safety
- **Commands**: `/implement-feature`, `/quick-fix frontend`, `/full-review`
- **Best For**: React components, frontend optimization, UI/UX implementation

### Backend Development

#### 4. **backend-expert**

- **Purpose**: NestJS 11, Node.js, and Bun runtime specialist
- **Expertise**: API design, dependency injection, security, testing patterns
- **Commands**: `/implement-feature`, `/quick-fix backend`, `/full-review`
- **Best For**: API endpoints, NestJS modules, backend services

### Database & Data

#### 5. **database-expert**

- **Purpose**: PostgreSQL 18 and Prisma 6 specialist
- **Expertise**: Schema design, query optimization, migrations, data integrity
- **Commands**: `/quick-fix database`, `/full-review`, `/security-audit`
- **Best For**: Database design, query optimization, migration planning

### Testing Specialists

#### 6. **test-guardian**

- **Purpose**: Test-Driven Development enforcement
- **Expertise**: TDD methodology, test-first approach, zero-tolerance for failures
- **Commands**: `/test-first`, `/full-test`, `/improve-tests`
- **Best For**: Writing tests first, ensuring test quality, TDD workflow

#### 7. **test-refactor**

- **Purpose**: Test quality and coverage improvement
- **Expertise**: Test structure, coverage analysis, testing patterns, framework migration
- **Commands**: `/improve-tests`, `/full-test`
- **Best For**: Improving test coverage, refactoring tests, test optimization

### Code Quality

#### 8. **code-quality-enforcer**

- **Purpose**: Code standards and quality gates enforcement
- **Expertise**: Linting, formatting, type checking, quality metrics
- **Commands**: `/quick-fix quality`, `/full-review`, `/full-test`
- **Best For**: Enforcing standards, quality checks, pre-commit validation

#### 9. **code-duplication-detector**

- **Purpose**: DRY principle enforcement
- **Expertise**: Duplicate code detection, refactoring, utility extraction
- **Commands**: `/quick-fix duplication`, `/refactor-code`, `/full-review`
- **Best For**: Finding duplicates, extracting utilities, code consolidation

#### 10. **module-boundaries**

- **Purpose**: Module boundary and dependency management
- **Expertise**: Circular dependencies, Nx tags, import violations, ESLint rules
- **Commands**: `/quick-fix boundaries`, `/full-review`
- **Best For**: Fixing import violations, enforcing boundaries, dependency cleanup

### Performance & Optimization

#### 11. **performance-optimizer**

- **Purpose**: Full-stack performance optimization
- **Expertise**: React rendering, bundle size, query optimization, caching
- **Commands**: `/optimize-performance`, `/full-review`, `/quick-fix performance`
- **Best For**: Performance issues, optimization, bottleneck identification

### DevOps & Operations

#### 12. **monitoring-observability**

- **Purpose**: Grafana Cloud monitoring instrumentation
- **Expertise**: Metrics, logging, tracing, alerting, dashboards
- **Commands**: `/setup-monitoring`
- **Best For**: Adding monitoring, creating dashboards, setting up alerts

#### 13. **git-workflow**

- **Purpose**: Git best practices and workflow management
- **Expertise**: Conventional commits, branching, PRs, git operations
- **Commands**: `/commit`, `/manage-agents`
- **Best For**: Git operations, commit management, PR creation

### Documentation & Maintenance

#### 14. **docs-maintainer**

- **Purpose**: Documentation synchronization and maintenance
- **Expertise**: Documentation updates, consistency, accuracy, templates
- **Commands**: `/update-docs`
- **Best For**: Keeping docs current, creating new docs, validation

#### 15. **subagent-updater**

- **Purpose**: Agent configuration maintenance
- **Expertise**: Agent updates, version synchronization, configuration management
- **Commands**: `/update-agents`
- **Best For**: Updating agent configs, version bumps, agent maintenance

#### 16. **claude-code-optimizer**

- **Purpose**: Claude Code workflow optimization
- **Expertise**: CLAUDE.md files, settings, permissions, workflows, context management
- **Commands**: `/optimize-claude`, `/use-agent claude-code-optimizer`
- **Best For**: Optimizing Claude Code setup, improving workflows

### Product & Planning

#### 17. **feature-planner**

- **Purpose**: Product feature planning and prioritization
- **Expertise**: User stories, MVP scope, lean development, requirements
- **Commands**: `/implement-feature`, `/manage-agents`
- **Best For**: Feature planning, requirement analysis, MVP scoping

---

## 📝 Slash Commands (25 Total)

### Core Development Commands

#### `/implement-feature [name] [backend|frontend|fullstack]`

- **Agents Used**: feature-planner, frontend-expert, backend-expert, test-guardian
- **Purpose**: Complete feature implementation with TDD approach
- **Example**: `/implement-feature appointment-booking fullstack`

#### `/add-library [type] [scope] [name]`

- **Agents Used**: nx-specialist
- **Purpose**: Create new Nx library with proper configuration
- **Example**: `/add-library feature appointments booking`

#### `/test-first [component/service] [unit|integration|e2e]`

- **Agents Used**: test-guardian
- **Purpose**: Write failing tests first (TDD approach)
- **Example**: `/test-first UserProfile unit`

### Review & Quality Commands

#### `/full-review [scope]`

- **Agents Used**: ALL review specialists in parallel
- **Purpose**: Comprehensive code review from multiple perspectives
- **Example**: `/full-review authentication`

#### `/architecture-review [full|frontend|backend|data|security]`

- **Agents Used**: senior-architect, relevant domain experts
- **Purpose**: Deep architectural analysis and recommendations
- **Example**: `/architecture-review full`

#### `/refactor-code`

- **Agents Used**: code-duplication-detector, module-boundaries, performance-optimizer
- **Purpose**: Orchestrated refactoring with multiple specialists
- **Example**: `/refactor-code`

#### `/quick-fix [type]`

- **Agents Used**: Specific specialist based on type
- **Purpose**: Quick targeted improvements
- **Types**: types, duplication, boundaries, quality, api, performance, tests, frontend, backend, database
- **Example**: `/quick-fix performance`

### Testing Commands

#### `/full-test [scope]`

- **Agents Used**: ALL testing specialists in parallel
- **Purpose**: Comprehensive testing coverage and quality
- **Example**: `/full-test frontend`

#### `/improve-tests`

- **Agents Used**: test-refactor, test-guardian
- **Purpose**: Enhance test coverage and quality
- **Example**: `/improve-tests`

### Documentation & Maintenance

#### `/update-docs [feature|new|validate|metrics]`

- **Agents Used**: docs-maintainer
- **Purpose**: Maintain and update documentation
- **Examples**:
  - `/update-docs` - Full audit
  - `/update-docs authentication` - Update specific feature
  - `/update-docs new user-profile` - Create new docs
  - `/update-docs validate` - Validate all docs
  - `/update-docs metrics` - Generate health metrics

#### `/update-agents`

- **Agents Used**: subagent-updater
- **Purpose**: Update all agent configurations with current project state
- **Example**: `/update-agents`

#### `/update-commands [agents|scripts|workflows|docs|--dry-run|--force]`

- **Agents Used**: claude-code-optimizer
- **Purpose**: Sync slash commands with repository changes
- **Example**: `/update-commands --dry-run`

### Monitoring & Operations

#### `/setup-monitoring [scope]`

- **Agents Used**: monitoring-observability
- **Purpose**: Configure Grafana Cloud monitoring
- **Examples**:
  - `/setup-monitoring` - Complete setup
  - `/setup-monitoring backend` - Backend only
  - `/setup-monitoring dashboards` - Create dashboards
  - `/setup-monitoring alerts` - Configure alerts

### Performance & Security

#### `/optimize-performance`

- **Agents Used**: performance-optimizer, database-expert, frontend-expert
- **Purpose**: Full-stack performance audit and optimization
- **Example**: `/optimize-performance`

#### `/security-audit`

- **Agents Used**: backend-expert, database-expert, senior-architect
- **Purpose**: Comprehensive security review
- **Example**: `/security-audit`

### Claude Code Optimization

#### `/optimize-claude [workflows|permissions|documentation|onboarding]`

- **Agents Used**: claude-code-optimizer
- **Purpose**: Optimize Claude Code configuration and workflows
- **Example**: `/optimize-claude workflows`

### Agent Management

#### `/use-agent [agent-name] [task-description]`

- **Purpose**: Use a specific specialist agent
- **Example**: `/use-agent database-expert optimize appointment queries`

#### `/manage-agents [operation] [arguments]`

- **Purpose**: Orchestrate multiple agents
- **Operations**: parallel, sequence, deploy, feature, review-pr, optimize
- **Example**: `/manage-agents parallel "review:frontend-expert,backend-expert"`

### Repository Maintenance

#### `/sync-repo [scope]`

- **Agents Used**: ALL specialists in parallel (Phase 2)
- **Purpose**: Complete repository synchronization after feature implementation
- **Phases**:
  1. Quality Gate (sequential): /check-all
  2. Parallel Maintenance: docs, agents, commands, review, security, boundaries
- **Example**: `/sync-repo authentication`
- **When**: After completing features, before PRs, weekly maintenance

### Git & Workflow

#### `/commit [message] [--push]`

- **Agents Used**: git-workflow, code-quality-enforcer
- **Purpose**: Quality checks and conventional commit
- **Example**: `/commit "feat(auth): add OAuth support" --push`

---

## 🎯 Quick Reference: Task → Command Mapping

| Task                 | Recommended Command                   |
| -------------------- | ------------------------------------- |
| Start new feature    | `/implement-feature [name] fullstack` |
| Review before PR     | `/full-review`                        |
| Fix failing tests    | `/use-agent test-guardian`            |
| Improve performance  | `/optimize-performance`               |
| Update documentation | `/update-docs [feature]`              |
| Add monitoring       | `/setup-monitoring`                   |
| Create library       | `/add-library [type] [scope] [name]`  |
| Security check       | `/security-audit`                     |
| Fix linting          | `/quick-fix quality`                  |
| Remove duplication   | `/quick-fix duplication`              |
| Architecture review  | `/architecture-review full`           |
| Write tests first    | `/test-first [component] unit`        |
| Update all agents    | `/update-agents`                      |
| Optimize Claude      | `/optimize-claude`                    |
| After feature done   | `/sync-repo`                          |

---

## 🔄 Workflow Examples

### Complete Feature Development

```bash
/implement-feature user-profile fullstack
/test-first UserProfile unit
/update-docs new user-profile
/commit "feat(users): implement user profile feature"
```

### Pre-Release Checklist

```bash
/full-review
/full-test
/security-audit
/optimize-performance
/update-docs validate
```

### Maintenance Sprint

```bash
/update-agents
/update-commands
/optimize-claude
/update-docs metrics
```

### Quick Fixes

```bash
/quick-fix quality
/quick-fix duplication
/quick-fix boundaries
/commit "fix: resolve code quality issues"
```

---

## 🚀 Best Practices

### 1. **Use Collective Commands for Efficiency**

Instead of running agents individually, use collective commands like `/full-review` or `/full-test` for comprehensive analysis.

### 2. **Chain Commands for Workflows**

Combine commands for complete workflows:

```bash
/test-first → /implement-feature → /full-review → /commit
```

### 3. **Parallel Execution**

Use `/manage-agents parallel` for independent tasks to save time.

### 4. **Regular Maintenance**

Run `/update-agents` and `/update-commands` weekly to keep configurations current.

### 5. **Document as You Go**

Use `/update-docs` after each feature to maintain documentation quality.

### 6. **Test First, Always**

Start with `/test-first` to ensure TDD approach.

### 7. **Review Before Commit**

Always run `/full-review` or at minimum `/quick-fix quality` before committing.

---

## 📊 Agent Usage Statistics

### Most Used Agents

1. frontend-expert (UI implementation)
2. backend-expert (API development)
3. test-guardian (TDD enforcement)
4. code-quality-enforcer (Quality gates)
5. docs-maintainer (Documentation)

### Most Effective Combinations

- **Full-stack**: frontend-expert + backend-expert + database-expert
- **Quality**: code-quality-enforcer + test-guardian + code-duplication-detector
- **Optimization**: performance-optimizer + module-boundaries
- **Review**: senior-architect + domain experts

---

## 🔧 Configuration Files

### Key Configuration Locations

- **Agents**: `.claude/agents/`
- **Commands**: `.claude/commands/`
- **Settings**: `.claude/settings.json`
- **Documentation**: `CLAUDE.md`, `.claude/SLASH_COMMANDS.md`
- **This Catalog**: `.claude/AGENT_COMMAND_CATALOG.md`

### Maintenance Commands

- `/update-agents` - Sync agent configurations
- `/update-commands` - Sync command definitions
- `/optimize-claude` - Optimize overall setup
- `/update-docs` - Maintain documentation

---

## 📈 Continuous Improvement

This catalog is maintained by:

1. **Automated Updates**: `/update-commands` command
2. **Agent Synchronization**: `/update-agents` command
3. **Documentation Maintenance**: `/update-docs` command
4. **Manual Reviews**: Periodic optimization with `/optimize-claude`

---

**Last Updated**: 2025-10-10
**Version**: 1.1.0
**Total Agents**: 17
**Total Commands**: 25

---

## Need Help?

1. **Specific Agent Info**: Check `.claude/agents/[agent-name].md`
2. **Command Details**: Check `.claude/commands/[command-name].md`
3. **General Setup**: Check `CLAUDE.md`
4. **Quick Reference**: Check `.claude/SLASH_COMMANDS.md`
