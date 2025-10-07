---
description: Run comprehensive quality checks before committing or pushing code
allowed-tools: Bash, BashOutput, Task
---

# Run Comprehensive Quality Checks

## Current Status

- Git status: !`git status --short`
- Branch: !`git branch --show-current`
- Affected projects: !`nx affected:graph --plain 2>/dev/null | head -5`

## Instructions

Use the **code-quality-enforcer** subagent to run ALL quality checks and fix any issues found.

### Required Checks (in order):

1. **Format Check** ✨

   ```bash
   bun run format:check
   ```

   If formatting issues found, fix with: `bun run format`

2. **Lint Check** 🔍

   ```bash
   bun run lint
   ```

   If lint errors found, attempt auto-fix: `bun run lint:fix`

3. **Type Check** 📝

   ```bash
   bun run typecheck
   ```

   Fix any TypeScript errors manually

4. **Test Suite** 🧪

   ```bash
   nx affected --target=test
   ```

   Ensure all tests pass - fix any failures

5. **Build Verification** 🏗️

   ```bash
   nx affected --target=build
   ```

   Ensure affected apps build successfully

6. **Module Boundaries** 🔒
   ```bash
   nx run-many --target=lint --all
   ```
   Verify no module boundary violations

### Quick All-in-One Check:

```bash
bun run check-all
```

### Results Summary:

After running all checks, provide a clear status report:

- ✅ Passed checks
- ❌ Failed checks (with fixes applied)
- ⚠️ Warnings or manual fixes needed

### CI Readiness:

Confirm that pushing this code will pass CI by ensuring:

- No TypeScript errors
- No lint violations
- All tests passing
- Proper formatting
- Successful builds

Remember:

- NEVER skip checks with --no-verify
- Fix issues, don't suppress them
- Zero tolerance for errors
