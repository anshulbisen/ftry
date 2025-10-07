#!/usr/bin/env python3
"""
Post-tool hook to remind about code quality after file modifications.
Provides helpful reminders about running formatters, linters, and tests.
"""
import json
import sys
import os

# File extensions that require quality checks
CODE_EXTENSIONS = {'.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'}
CONFIG_EXTENSIONS = {'.json', '.yml', '.yaml'}
TEST_EXTENSIONS = {'.spec.ts', '.spec.tsx', '.test.ts', '.test.tsx'}


def should_check_quality(file_path: str) -> tuple[bool, str]:
    """
    Determine if quality checks should be suggested for a file.
    Returns (should_check, reminder_type)
    """
    if not file_path:
        return False, ""

    _, ext = os.path.splitext(file_path)

    # Check if it's a test file
    if any(test_ext in file_path for test_ext in ['.spec.', '.test.']):
        return True, "test"

    # Check if it's a code file
    if ext in CODE_EXTENSIONS:
        return True, "code"

    # Check if it's a config file
    if ext in CONFIG_EXTENSIONS:
        return True, "config"

    return False, ""


def get_quality_reminder(file_path: str, reminder_type: str) -> str:
    """Generate appropriate quality reminder based on file type."""
    base_reminder = f"\n📋 File modified: {file_path}\n"

    if reminder_type == "test":
        return base_reminder + (
            "💡 Test file modified. Consider:\n"
            "   • Run tests: `nx affected --target=test` or `bun run test`\n"
            "   • Pre-commit hooks will auto-format and lint"
        )
    elif reminder_type == "code":
        return base_reminder + (
            "💡 Code file modified. Consider:\n"
            "   • Format: `bun run format` (or let pre-commit handle it)\n"
            "   • Lint: `bun run lint` to check for issues\n"
            "   • Type check: `bun run typecheck`\n"
            "   • Test: `nx affected --target=test`\n"
            "   • All checks: `bun run check-all`"
        )
    elif reminder_type == "config":
        return base_reminder + (
            "💡 Config file modified. Consider:\n"
            "   • Format: `bun run format`\n"
            "   • Test affected projects if this impacts builds"
        )

    return ""


def main():
    try:
        input_data = json.load(sys.stdin)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON input: {e}", file=sys.stderr)
        sys.exit(1)

    tool_name = input_data.get("tool_name", "")
    tool_input = input_data.get("tool_input", {})

    # Only check for Write and Edit tools
    if tool_name not in ["Write", "Edit", "MultiEdit"]:
        sys.exit(0)

    file_path = tool_input.get("file_path", "")
    should_check, reminder_type = should_check_quality(file_path)

    if should_check:
        reminder = get_quality_reminder(file_path, reminder_type)

        # Use JSON output to provide context without blocking
        output = {
            "hookSpecificOutput": {
                "hookEventName": "PostToolUse",
                "additionalContext": reminder
            },
            "suppressOutput": False  # Show in transcript
        }
        print(json.dumps(output))

    sys.exit(0)


if __name__ == "__main__":
    main()
