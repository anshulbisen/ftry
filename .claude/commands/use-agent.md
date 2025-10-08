---
description: Use a specific specialist agent for targeted tasks
---

Select and launch a specific specialist agent based on your needs.

## Available Specialists

### Architecture & Design

- **senior-architect** - Strategic technical oversight and architectural decisions
- **nx-specialist** - Nx monorepo architecture and library management

### Code Review & Quality

- **code-quality-enforcer** - Standards enforcement and quality gates
- **code-duplication-detector** - DRY principle and refactoring opportunities
- **module-boundaries** - Dependency management and circular reference detection

### Frontend Development

- **frontend-expert** - React 19, TypeScript, Tailwind CSS specialist

### Backend Development

- **backend-expert** - NestJS 11, Node.js, Bun runtime specialist

### Database & Data

- **database-expert** - PostgreSQL 18, Prisma 6, query optimization

### Testing

- **test-guardian** - TDD enforcement and test-first development
- **test-refactor** - Test improvement and coverage enhancement

### Performance

- **performance-optimizer** - Full-stack performance optimization

### DevOps & Operations

- **monitoring-observability** - Grafana Cloud instrumentation
- **git-workflow** - Git best practices and conventional commits

### Documentation & Maintenance

- **docs-maintainer** - Documentation synchronization and updates
- **subagent-updater** - Agent configuration maintenance
- **claude-code-optimizer** - Claude Code workflow optimization

### Product & Planning

- **feature-planner** - Product feature planning and prioritization

## Usage

```bash
# Use specific agent by name
/use-agent senior-architect
/use-agent frontend-expert
/use-agent test-guardian

# With specific task description
/use-agent database-expert optimize queries for appointments
/use-agent performance-optimizer analyze bundle size
/use-agent docs-maintainer update authentication docs
```

## Agent Selection Guide

### "Which agent should I use?"

**For Code Review:**

- General review → senior-architect
- React components → frontend-expert
- NestJS services → backend-expert
- Database schemas → database-expert
- Code quality → code-quality-enforcer

**For Implementation:**

- New feature planning → feature-planner
- React UI → frontend-expert
- API endpoints → backend-expert
- Database design → database-expert
- Nx libraries → nx-specialist

**For Testing:**

- Write tests first → test-guardian
- Improve coverage → test-refactor
- Fix failing tests → test-guardian

**For Optimization:**

- Performance issues → performance-optimizer
- Code duplication → code-duplication-detector
- Module dependencies → module-boundaries

**For Maintenance:**

- Update docs → docs-maintainer
- Update agents → subagent-updater
- Optimize Claude → claude-code-optimizer
- Git operations → git-workflow

## Agent Capabilities

Each agent has:

- Specialized knowledge domain
- Specific tool access
- Focused system prompt
- Best practice enforcement
- Automated reporting

## Expected Workflow

1. **Select Agent** - Choose based on task type
2. **Provide Context** - Describe the specific need
3. **Agent Analysis** - Specialized review and recommendations
4. **Implementation** - Agent provides code/fixes/documentation
5. **Validation** - Agent verifies changes meet standards

The agent will work autonomously within its specialized domain to complete the requested task.
