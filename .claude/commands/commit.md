---
description: Run quality checks, commit changes, and optionally push to remote
argument-hint: [commit-message] [--push]
allowed-tools: Bash, BashOutput, Task
---

# Commit Changes (with Quality Checks)

## Context

- Current branch: !`git branch --show-current`
- Modified files: !`git status --short`
- Unstaged changes: !`git diff --stat`

## Instructions

Create a clean commit with comprehensive quality checks. Include `--push` to also push to remote.

Message: **$ARGUMENTS**

### Process:

1. **Pre-Commit Quality Checks**

   Deploy the **code-quality-enforcer** and **test-guardian** agents to ensure:

   ```bash
   # Quick validation (< 2 minutes)
   bun run format:check
   bun run lint
   bun run typecheck
   nx affected --target=test
   ```

   For full checks, use: `bun run check-all`

2. **Stage Changes**
   Review changes and stage appropriate files:

   ```bash
   git add .
   ```

3. **Create Commit**
   Parse the commit message to ensure it follows conventional format:
   - If message starts with a type (feat, fix, docs, etc.), use as-is
   - Otherwise, infer the type from the changes

   Example formats:
   - `feat(scope): description`
   - `fix: description`
   - `docs: description`

4. **Push to Remote**
   ```bash
   git push origin HEAD
   ```
   If branch hasn't been pushed before, set upstream:
   ```bash
   git push -u origin HEAD
   ```

### Validation Steps:

- ✅ All quality checks pass (format, lint, type, test)
- ✅ Commit message follows conventional format
- ✅ No sensitive files staged (.env, credentials)
- ✅ Branch is up to date with remote

### Quick Flow:

If message provided: "$ARGUMENTS"

1. Run `bun run check-all`
2. Fix any issues
3. Stage all changes
4. Commit with conventional format
5. Push to origin

Remember:

- Never skip quality checks
- Never use --no-verify
- Ensure conventional commit format
- Check for merge conflicts before pushing
