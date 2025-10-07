---
description: Start new feature development with proper planning, libraries, and TDD setup
argument-hint: [feature-name] [scope]
allowed-tools: TodoWrite, Bash, Write, Edit, Read, Glob, Grep, Task
---

# Start Feature Development: $1 ($2 scope)

## Context

- Current branch: !`git branch --show-current`

## Instructions

I need you to start development of the **$1** feature with scope **$2** for the ftry salon management system.

Follow these steps using the appropriate subagents:

1. **Feature Planning** (use feature-planner subagent):
   - Define the problem this feature solves
   - Create user stories and acceptance criteria
   - Break down into technical tasks
   - Estimate effort for solo developer context

2. **Architecture Setup** (use nx-architect subagent):
   - Create necessary Nx libraries following our architecture:
     - `libs/$2/feature-$1` (if UI needed)
     - `libs/$2/data-access` (if API needed)
     - `libs/$2/ui-components` (if shared UI needed)
   - Set up proper module boundaries and tags
   - Ensure non-buildable library configuration

3. **Test-First Development** (use test-guardian subagent):
   - Write failing tests FIRST for the core functionality
   - Ensure tests cover the main user stories
   - Set up both unit and integration tests

4. **Create Feature Branch**:

   ```bash
   git checkout -b feature/$1
   ```

5. **Todo List Creation**:
   Create a comprehensive todo list for implementing this feature, including:
   - Database schema design (if needed)
   - API endpoints
   - UI components
   - Integration points
   - Testing phases
   - Documentation

Remember:

- Use bun exclusively (no npm/yarn/pnpm)
- Follow TDD approach - tests first!
- Consider Indian market requirements (GST, UPI, WhatsApp if relevant)
- Keep it lean - MVP scope only
- Ensure all quality checks pass

Start by analyzing the requirements and creating the implementation plan.
