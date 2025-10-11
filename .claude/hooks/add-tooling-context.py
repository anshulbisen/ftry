#!/usr/bin/env python3
"""
Adds concise project tooling context to user prompts for SessionStart events.
Optimized to provide only critical reminders without overwhelming context.
"""
import json
import sys

TOOLING_CONTEXT = """
## Project Standards (ftry)

**Runtime**: Bun 1.2.19 exclusively (never npm/yarn/pnpm/node)
**Commands**: Use `nx` directly, not `bun nx` (Nx auto-detects bun)
**Development**: TDD approach - tests before implementation
**Commits**: Conventional format: `type(scope): subject`

**Quick Reference**:
- Dev servers: `nx serve [frontend|backend]`
- Quality gate: `bun run check-all` (before commits)
- Database: `bunx prisma [generate|migrate|studio]`

See CLAUDE.md for complete standards and workflows.
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
