---
description: Run quality checks, commit changes, and push to remote
argument-hint: [commit-message]
allowed-tools: Bash, BashOutput, Task
---

# Commit and Push Changes

## Context

- Current branch: !`git branch --show-current`
- Modified files: !`git status --short`
- Unstaged changes: !`git diff --stat`

## Instructions

Create a clean commit and push to remote with the message: **$ARGUMENTS**

### Process:

1. **Run Quality Checks First**

   ```bash
   bun run check-all
   ```

   Fix any issues found before proceeding.

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
