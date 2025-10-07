#!/usr/bin/env python3
"""
Adds project tooling context to user prompts for SessionStart events.
Reminds Claude about project standards and available tools.
"""
import json
import sys

TOOLING_CONTEXT = """
## 🛠️ Project Tooling Standards (Auto-injected Context)

**CRITICAL REMINDERS**:

1. **Package Manager**: This project uses **bun exclusively**
   - ✅ USE: `bun install`, `bun add`, `bun remove`, `bun run`
   - ❌ NEVER: npm, yarn, pnpm, npx, or node commands
   - The packageManager field in package.json enforces bun@1.2.19

2. **Nx Commands**: Call `nx` directly, NOT `bun nx`
   - ✅ USE: `nx serve frontend`, `nx test backend`
   - ❌ NEVER: `bun nx serve frontend`
   - Nx auto-detects bun via packageManager field

3. **Preferred Tools** (use these instead of bash commands):
   - File reading: Use Read tool, not `cat`
   - File search: Use Glob tool, not `find`
   - Content search: Use Grep tool, not `grep` or `rg`
   - File editing: Use Edit tool, not `sed` or `awk`

4. **Code Quality Tools**:
   - Formatting: Prettier 3.6.2 (automatic via pre-commit)
   - Linting: ESLint 9 with flat config
   - Type checking: TypeScript 5.9.2
   - Git hooks: Husky 9.1.7 (auto-runs on commit)

5. **Commit Standards**:
   - Format: `type(scope): subject`
   - Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
   - Commitlint enforces this automatically

6. **Available Scripts** (from package.json):
   - `bun run format` - Format all files
   - `bun run lint` - Lint affected files
   - `bun run typecheck` - Type check affected files
   - `bun run test` - Run affected tests
   - `bun run check-all` - Run all quality checks

7. **Testing**:
   - Frontend: Vitest
   - Backend/Libs: Jest
   - Always run affected tests: `nx affected --target=test`

**When in doubt, consult CLAUDE.md for complete standards.**
"""


def main():
    try:
        input_data = json.load(sys.stdin)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON input: {e}", file=sys.stderr)
        sys.exit(1)

    hook_event = input_data.get("hook_event_name", "")

    # Only add context for SessionStart events
    if hook_event != "SessionStart":
        sys.exit(0)

    # Return context as JSON for better control
    output = {
        "hookSpecificOutput": {
            "hookEventName": "SessionStart",
            "additionalContext": TOOLING_CONTEXT
        },
        "suppressOutput": True  # Don't show in transcript mode
    }

    print(json.dumps(output))
    sys.exit(0)


if __name__ == "__main__":
    main()
