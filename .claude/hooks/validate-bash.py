#!/usr/bin/env python3
"""
Validates Bash commands to ensure they follow project standards.
Blocks commands that use wrong package managers or outdated tools.
"""
import json
import re
import sys

# Validation rules: (pattern, message, severity)
# severity: "block" = exit 2 (blocks tool), "warn" = exit 1 (shows warning)
VALIDATION_RULES = [
    # Package manager enforcement
    (
        r'\b(npm|npx|yarn|pnpm|node)\b(?!\s+(install|init|create))',
        "⚠️ Use 'bun' instead of npm/yarn/pnpm/node. This project exclusively uses Bun as the runtime and package manager.",
        "block"
    ),
    (
        r'\bnpm\s+install\b',
        "⚠️ Use 'bun install' instead of 'npm install'",
        "block"
    ),
    (
        r'\bnpm\s+run\b',
        "⚠️ Use 'bun run' instead of 'npm run'",
        "block"
    ),
    (
        r'\byarn\s+(?:install|add|remove)',
        "⚠️ Use 'bun install/add/remove' instead of yarn commands",
        "block"
    ),

    # Nx command patterns - should be called directly, not via bun nx
    (
        r'\bbun\s+nx\b',
        "ℹ️ Call 'nx' directly, not 'bun nx'. Nx automatically uses bun via packageManager field.",
        "warn"
    ),

    # Prefer specialized tools over bash commands
    (
        r'\bgrep\b(?!.*\|)',
        "ℹ️ Use the Grep tool instead of 'grep' command for better performance and features",
        "warn"
    ),
    (
        r'\bfind\s+\S+\s+-name\b',
        "ℹ️ Use the Glob tool instead of 'find -name' for pattern matching",
        "warn"
    ),
    (
        r'\bcat\s+[^\|]+(?:\||$)',
        "ℹ️ Use the Read tool instead of 'cat' for reading files",
        "warn"
    ),
    (
        r'\b(sed|awk)\b',
        "ℹ️ Use the Edit tool instead of 'sed/awk' for file modifications",
        "warn"
    ),

    # Git commit best practices
    (
        r'git\s+commit.*--no-verify',
        "⚠️ Avoid --no-verify flag. Pre-commit hooks ensure code quality.",
        "warn"
    ),
    (
        r'git\s+push.*--force(?!\-with-lease)',
        "⚠️ Use 'git push --force-with-lease' instead of '--force' for safer force pushes",
        "warn"
    ),
]


def validate_command(command: str) -> tuple[list[str], bool]:
    """
    Validate a bash command against project standards.
    Returns (issues, should_block) where should_block is True if any blocking issue found.
    """
    blocking_issues = []
    warning_issues = []

    for pattern, message, severity in VALIDATION_RULES:
        if re.search(pattern, command, re.IGNORECASE):
            if severity == "block":
                blocking_issues.append(message)
            else:
                warning_issues.append(message)

    return (blocking_issues, warning_issues, len(blocking_issues) > 0)


def main():
    try:
        input_data = json.load(sys.stdin)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON input: {e}", file=sys.stderr)
        sys.exit(1)

    tool_name = input_data.get("tool_name", "")
    tool_input = input_data.get("tool_input", {})
    command = tool_input.get("command", "")

    # Only validate Bash tool commands
    if tool_name != "Bash" or not command:
        sys.exit(0)

    blocking_issues, warning_issues, should_block = validate_command(command)

    if blocking_issues or warning_issues:
        if blocking_issues:
            print("🚫 Command Blocked - Project Standards Violation:\n", file=sys.stderr)
            for issue in blocking_issues:
                print(f"   {issue}\n", file=sys.stderr)

        if warning_issues:
            print("📋 Recommendations:\n", file=sys.stderr)
            for issue in warning_issues:
                print(f"   {issue}\n", file=sys.stderr)

        if should_block:
            print("\nRefer to CLAUDE.md for project tooling standards.", file=sys.stderr)
            sys.exit(2)  # Block the tool call
        else:
            sys.exit(1)  # Show warnings but don't block

    # Command passes validation
    sys.exit(0)


if __name__ == "__main__":
    main()
