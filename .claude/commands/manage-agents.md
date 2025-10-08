---
description: Manage, coordinate, and orchestrate all specialist agents
---

Comprehensive agent management and orchestration for complex multi-agent workflows.

## Management Operations

### 1. Agent Orchestration

Launch multiple agents in coordinated workflows:

```bash
# Launch agents for specific workflow
/manage-agents deploy frontend backend database monitoring

# Parallel execution for independent tasks
/manage-agents parallel "review:frontend-expert,backend-expert" "test:test-guardian,test-refactor"

# Sequential execution for dependent tasks
/manage-agents sequence "plan:feature-planner" "implement:frontend-expert" "test:test-guardian" "deploy:monitoring-observability"
```

### 2. Agent Groups

Pre-configured agent groups for common scenarios:

**Development Groups:**

- `fullstack`: frontend-expert, backend-expert, database-expert
- `frontend-team`: frontend-expert, test-guardian, performance-optimizer
- `backend-team`: backend-expert, database-expert, test-guardian
- `testing-team`: test-guardian, test-refactor, code-quality-enforcer

**Review Groups:**

- `review-all`: All review specialists in parallel
- `review-architecture`: senior-architect, nx-specialist, module-boundaries
- `review-quality`: code-quality-enforcer, code-duplication-detector, test-guardian
- `review-performance`: performance-optimizer, database-expert

**Maintenance Groups:**

- `maintenance`: docs-maintainer, subagent-updater, claude-code-optimizer
- `optimization`: performance-optimizer, code-duplication-detector, module-boundaries
- `documentation`: docs-maintainer, subagent-updater

### 3. Agent Capabilities Matrix

```
| Agent                        | Review | Implement | Test | Optimize | Document |
|------------------------------|--------|-----------|------|----------|----------|
| senior-architect             | ✅     | ✅        | -    | ✅       | ✅       |
| frontend-expert              | ✅     | ✅        | ✅   | ✅       | -        |
| backend-expert               | ✅     | ✅        | ✅   | ✅       | -        |
| database-expert              | ✅     | ✅        | ✅   | ✅       | -        |
| nx-specialist                | ✅     | ✅        | -    | ✅       | ✅       |
| test-guardian                | ✅     | -         | ✅   | -        | -        |
| test-refactor                | ✅     | -         | ✅   | ✅       | -        |
| code-quality-enforcer        | ✅     | -         | ✅   | ✅       | -        |
| code-duplication-detector    | ✅     | -         | -    | ✅       | -        |
| performance-optimizer        | ✅     | -         | -    | ✅       | -        |
| module-boundaries            | ✅     | -         | -    | ✅       | -        |
| docs-maintainer              | -      | -         | -    | -        | ✅       |
| monitoring-observability     | -      | ✅        | -    | ✅       | ✅       |
| feature-planner              | -      | -         | -    | -        | ✅       |
| git-workflow                 | -      | -         | -    | -        | ✅       |
| claude-code-optimizer        | ✅     | ✅        | -    | ✅       | ✅       |
| subagent-updater             | -      | -         | -    | ✅       | ✅       |
```

## Usage Patterns

### Feature Development Workflow

```bash
# Complete feature implementation with all specialists
/manage-agents feature "appointment-booking"
# Runs: feature-planner → frontend-expert + backend-expert → test-guardian → docs-maintainer
```

### Code Review Workflow

```bash
# Comprehensive review before PR
/manage-agents review-pr
# Runs all review agents in parallel and aggregates results
```

### Optimization Sprint

```bash
# Full optimization pass
/manage-agents optimize
# Runs: performance-optimizer + code-duplication-detector + module-boundaries
```

### Testing Marathon

```bash
# Complete test coverage improvement
/manage-agents test-coverage
# Runs: test-guardian + test-refactor + all domain experts for test creation
```

## Advanced Orchestration

### Conditional Workflows

```bash
# Run agents based on conditions
/manage-agents if-changed frontend "frontend-expert,test-guardian"
/manage-agents if-failed tests "test-guardian,test-refactor"
```

### Iterative Workflows

```bash
# Keep running until condition met
/manage-agents until-pass "test-guardian,code-quality-enforcer"
/manage-agents until-coverage 80 "test-refactor"
```

### Scheduled Workflows

```bash
# Schedule agent runs
/manage-agents schedule daily "docs-maintainer,subagent-updater"
/manage-agents schedule weekly "full-review"
```

## Agent Communication

Agents can share context through:

- Shared markdown reports
- Git commits and branches
- File modifications
- TODO items
- Documentation updates

## Monitoring & Reporting

### Agent Performance Metrics

- Execution time per agent
- Success/failure rates
- Context usage
- Recommendations implemented

### Workflow Analytics

- Most used agent combinations
- Average workflow duration
- Bottleneck identification
- Optimization opportunities

## Best Practices

1. **Start Small**: Begin with single agents, then combine
2. **Parallel When Possible**: Use parallel execution for independent tasks
3. **Sequential for Dependencies**: Chain agents when output feeds input
4. **Group Common Workflows**: Create reusable agent groups
5. **Monitor Performance**: Track agent effectiveness
6. **Iterate and Improve**: Refine agent combinations based on results

## Error Handling

- Automatic retry for transient failures
- Fallback to alternative agents
- Detailed error reporting
- Recovery suggestions

## Integration Points

- Git hooks for automated agent runs
- CI/CD pipeline integration
- IDE integration via Claude Code
- Slack/Discord notifications

The manage-agents command provides powerful orchestration capabilities for complex, multi-faceted development tasks.
