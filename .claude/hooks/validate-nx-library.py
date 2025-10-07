#!/usr/bin/env python3
"""
Validates Nx library generation commands to ensure they follow architecture standards.
Blocks buildable libraries and enforces proper naming and tagging conventions.
"""
import json
import re
import sys

# Nx library generation patterns
NX_LIBRARY_PATTERNS = [
    r'nx\s+g(?:enerate)?\s+@nx/(?:react|nest|js|node):library',
    r'nx\s+g(?:enerate)?\s+@nx/(?:react|nest|js|node):lib',
]

# Forbidden flags
FORBIDDEN_FLAGS = [
    (r'--buildable(?:\s+|=)true', "❌ NEVER use --buildable=true. All libraries must be non-buildable."),
    (r'--buildable(?:\s|$)', "❌ NEVER use --buildable. All libraries must be non-buildable."),
    (r'--publishable', "❌ NEVER use --publishable. Libraries are internal only."),
]

# Required flags
REQUIRED_FLAGS = {
    'tags': r'--tags[=\s]+[^\s]+',
    'directory': r'--directory[=\s]+libs/',
}

# Recommended flags for non-buildable libraries
RECOMMENDED_FLAGS = {
    '@nx/react:library': ['--bundler=none', '--unitTestRunner=vitest'],
    '@nx/nest:library': ['--buildable=false'],
    '@nx/js:library': ['--bundler=none', '--unitTestRunner=vitest'],
}


def is_nx_library_command(command: str) -> bool:
    """Check if command is generating an Nx library."""
    for pattern in NX_LIBRARY_PATTERNS:
        if re.search(pattern, command, re.IGNORECASE):
            return True
    return False


def extract_generator(command: str) -> str:
    """Extract the generator being used (e.g., @nx/react:library)."""
    match = re.search(r'@nx/(react|nest|js|node):lib(?:rary)?', command, re.IGNORECASE)
    if match:
        generator_type = match.group(1)
        return f"@nx/{generator_type}:library"
    return ""


def validate_nx_library_command(command: str) -> tuple[list[str], list[str], bool]:
    """
    Validate an Nx library generation command.
    Returns (blocking_issues, warnings, should_block)
    """
    blocking_issues = []
    warnings = []

    # Check for forbidden flags
    for pattern, message in FORBIDDEN_FLAGS:
        if re.search(pattern, command, re.IGNORECASE):
            blocking_issues.append(message)

    # Check for required flags
    if not re.search(REQUIRED_FLAGS['tags'], command, re.IGNORECASE):
        blocking_issues.append(
            "❌ REQUIRED: --tags flag must include type and scope tags.\n"
            "   Example: --tags=type:feature,scope:appointments"
        )

    if not re.search(REQUIRED_FLAGS['directory'], command, re.IGNORECASE):
        blocking_issues.append(
            "❌ REQUIRED: --directory flag must specify libs/ path.\n"
            "   Example: --directory=libs/appointments/feature-booking"
        )

    # Check tags format if present
    tags_match = re.search(r'--tags[=\s]+([^\s]+)', command, re.IGNORECASE)
    if tags_match:
        tags = tags_match.group(1)
        if 'type:' not in tags:
            blocking_issues.append(
                "❌ Tags must include a type tag: type:feature, type:ui, type:data-access, or type:util"
            )
        if 'scope:' not in tags:
            blocking_issues.append(
                "❌ Tags must include a scope tag: scope:shared, scope:appointments, etc."
            )

    # Check for recommended flags
    generator = extract_generator(command)
    if generator and generator in RECOMMENDED_FLAGS:
        for recommended_flag in RECOMMENDED_FLAGS[generator]:
            if recommended_flag not in command:
                warnings.append(
                    f"💡 RECOMMENDED: Add {recommended_flag} for non-buildable library"
                )

    return (blocking_issues, warnings, len(blocking_issues) > 0)


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

    # Check if this is an Nx library generation command
    if not is_nx_library_command(command):
        sys.exit(0)

    # Validate the Nx library command
    blocking_issues, warnings, should_block = validate_nx_library_command(command)

    if blocking_issues or warnings:
        if blocking_issues:
            print("🚫 Nx Library Generation Blocked - Architecture Violation:\n", file=sys.stderr)
            for issue in blocking_issues:
                print(f"   {issue}\n", file=sys.stderr)

        if warnings:
            print("📋 Nx Library Recommendations:\n", file=sys.stderr)
            for warning in warnings:
                print(f"   {warning}\n", file=sys.stderr)

        if should_block:
            print("\n📖 Refer to .nx/NX_ARCHITECTURE.md for complete guidelines.", file=sys.stderr)
            print("📖 Refer to CLAUDE.md 'Nx Monorepo Architecture' section.\n", file=sys.stderr)
            print("✅ Example valid command:", file=sys.stderr)
            print("   nx g @nx/react:library feature-booking \\", file=sys.stderr)
            print("     --directory=libs/appointments/feature-booking \\", file=sys.stderr)
            print("     --tags=type:feature,scope:appointments \\", file=sys.stderr)
            print("     --bundler=none \\", file=sys.stderr)
            print("     --unitTestRunner=vitest", file=sys.stderr)
            sys.exit(2)  # Block the tool call
        else:
            sys.exit(1)  # Show warnings but don't block

    # Command passes validation
    sys.exit(0)


if __name__ == "__main__":
    main()
