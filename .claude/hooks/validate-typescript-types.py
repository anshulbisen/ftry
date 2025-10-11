#!/usr/bin/env python3
"""
TypeScript Type Safety Validation Hook

This hook validates TypeScript code for strict type safety, blocking any code
that uses 'any' types without explicit justification, and enforcing clean code principles.
"""

import json
import re
import sys
from pathlib import Path
from typing import Dict, List, Tuple, Optional

class TypeScriptValidator:
    def __init__(self):
        self.errors = []
        self.warnings = []
        self.stats = {
            'files_checked': 0,
            'any_count': 0,
            'unknown_count': 0,
            'assertions_count': 0,
            'missing_types': 0,
            'type_coverage': 0
        }

    def validate_file(self, file_path: Path) -> List[str]:
        """Validate a single TypeScript file for type safety issues."""
        issues = []

        try:
            content = file_path.read_text()
            lines = content.split('\n')

            for line_num, line in enumerate(lines, 1):
                # Skip comments and strings
                if self._is_comment_or_string(line):
                    continue

                # Check for 'any' usage without justification
                any_issues = self._check_any_usage(line, line_num, lines)
                if any_issues:
                    issues.extend([(file_path, line_num, issue) for issue in any_issues])
                    self.stats['any_count'] += len(any_issues)

                # Check for type assertions (as keyword)
                assertion_issues = self._check_type_assertions(line, line_num)
                if assertion_issues:
                    issues.extend([(file_path, line_num, issue) for issue in assertion_issues])
                    self.stats['assertions_count'] += len(assertion_issues)

                # Check for missing return types on exported functions
                missing_type_issues = self._check_missing_types(line, line_num)
                if missing_type_issues:
                    issues.extend([(file_path, line_num, issue) for issue in missing_type_issues])
                    self.stats['missing_types'] += len(missing_type_issues)

                # Check for overly broad unknown usage
                unknown_issues = self._check_unknown_usage(line, line_num)
                if unknown_issues:
                    issues.extend([(file_path, line_num, issue) for issue in unknown_issues])
                    self.stats['unknown_count'] += len(unknown_issues)

        except Exception as e:
            issues.append((file_path, 0, f"Error reading file: {e}"))

        return issues

    def _is_comment_or_string(self, line: str) -> bool:
        """Check if line is a comment or within a string."""
        stripped = line.strip()
        return (
            stripped.startswith('//') or
            stripped.startswith('/*') or
            stripped.startswith('*') or
            '`' in line or  # Template literals
            '"' in line or  # Strings
            "'" in line     # Strings
        )

    def _check_any_usage(self, line: str, line_num: int, all_lines: List[str]) -> List[str]:
        """Check for 'any' type usage without justification."""
        issues = []

        # Patterns to find 'any' usage
        any_patterns = [
            r': any\b',           # Type annotation
            r'<any>',             # Generic type
            r'as any\b',          # Type assertion
            r'Array<any>',        # Array of any
            r'\bany\[\]',         # Array notation
            r'Promise<any>',      # Promise of any
            r'Record<\w+,\s*any>' # Record with any values
        ]

        for pattern in any_patterns:
            if re.search(pattern, line):
                # Check if there's a justification comment
                has_justification = False

                # Check same line for @ts-expect-error or eslint-disable
                if '@ts-expect-error' in line or 'eslint-disable' in line:
                    has_justification = True

                # Check previous line for justification comment
                if line_num > 1:
                    prev_line = all_lines[line_num - 2]
                    if (
                        '@ts-expect-error' in prev_line or
                        'eslint-disable' in prev_line or
                        'TODO: Fix any type' in prev_line or
                        'FIXME: Remove any' in prev_line
                    ):
                        has_justification = True

                if not has_justification:
                    issues.append(
                        f"❌ BLOCKED: 'any' type detected without justification. "
                        f"Use proper types, generics, or add @ts-expect-error comment with explanation."
                    )

        return issues

    def _check_type_assertions(self, line: str, line_num: int) -> List[str]:
        """Check for type assertions that might hide type issues."""
        issues = []

        # Look for 'as' keyword (type assertion)
        if re.search(r'\bas\s+[A-Z]\w+', line):
            # Exclude some valid cases
            valid_assertions = [
                'as const',
                'as unknown',  # When followed by proper type guard
                'as HTMLElement',  # DOM assertions are often necessary
                'as any'  # Already caught by any checker
            ]

            is_valid = any(valid in line for valid in valid_assertions)

            if not is_valid and 'document.' not in line and 'querySelector' not in line:
                issues.append(
                    f"⚠️  WARNING: Type assertion detected. Consider using type guards instead of 'as' keyword."
                )

        return issues

    def _check_missing_types(self, line: str, line_num: int) -> List[str]:
        """Check for missing explicit types on exported functions."""
        issues = []

        # Check for exported functions without return types
        export_function_pattern = r'export\s+(async\s+)?function\s+\w+\([^)]*\)\s*{'
        if re.search(export_function_pattern, line):
            # Check if return type is specified
            if not re.search(r'\)\s*:\s*\w+', line):
                issues.append(
                    f"❌ BLOCKED: Exported function missing explicit return type. "
                    f"All public API functions must have explicit return types."
                )

        # Check for exported arrow functions without types
        export_arrow_pattern = r'export\s+const\s+\w+\s*=\s*(\([^)]*\)|[^=]+)\s*=>'
        if re.search(export_arrow_pattern, line):
            if not re.search(r':\s*\([^)]*\)\s*=>\s*\w+', line):
                issues.append(
                    f"❌ BLOCKED: Exported arrow function missing type annotation. "
                    f"All public API functions must have explicit types."
                )

        return issues

    def _check_unknown_usage(self, line: str, line_num: int) -> List[str]:
        """Check for overly broad 'unknown' usage without type guards."""
        issues = []

        # Check for unknown without nearby type guard
        if re.search(r': unknown\b', line):
            issues.append(
                f"⚠️  WARNING: 'unknown' type detected. Ensure proper type guards are used for narrowing."
            )

        return issues

    def _check_solid_violations(self, file_path: Path) -> List[Tuple[Path, int, str]]:
        """Check for SOLID principle violations in TypeScript code."""
        issues = []
        content = file_path.read_text()

        # Check for large interfaces (Interface Segregation Principle)
        interface_pattern = r'interface\s+(\w+)\s*{([^}]+)}'
        interfaces = re.findall(interface_pattern, content, re.DOTALL)

        for interface_name, interface_body in interfaces:
            property_count = len(re.findall(r'^\s*\w+:', interface_body, re.MULTILINE))
            if property_count > 5:
                issues.append((
                    file_path, 0,
                    f"⚠️  WARNING: Interface '{interface_name}' has {property_count} properties. "
                    f"Consider splitting into smaller, focused interfaces (Interface Segregation Principle)."
                ))

        # Check for repeated type patterns (DRY violation)
        type_patterns = re.findall(r'({\s*\w+:\s*\w+(?:;\s*\w+:\s*\w+)+\s*})', content)
        seen_patterns = {}

        for pattern in type_patterns:
            normalized = re.sub(r'\s+', ' ', pattern).strip()
            if normalized in seen_patterns:
                seen_patterns[normalized] += 1
            else:
                seen_patterns[normalized] = 1

        for pattern, count in seen_patterns.items():
            if count > 2:
                issues.append((
                    file_path, 0,
                    f"⚠️  WARNING: Type pattern '{pattern[:50]}...' repeated {count} times. "
                    f"Extract to a reusable type (DRY principle)."
                ))

        return issues

    def validate_workspace(self) -> Tuple[bool, str]:
        """Validate all TypeScript files in the workspace."""
        # Find all TypeScript files
        ts_files = list(Path.cwd().rglob("*.ts"))
        tsx_files = list(Path.cwd().rglob("*.tsx"))
        all_files = ts_files + tsx_files

        # Exclude node_modules and dist directories
        all_files = [
            f for f in all_files
            if 'node_modules' not in str(f) and 'dist' not in str(f)
        ]

        all_issues = []

        for file_path in all_files:
            self.stats['files_checked'] += 1
            issues = self.validate_file(file_path)
            all_issues.extend(issues)

            # Check SOLID violations
            solid_issues = self._check_solid_violations(file_path)
            all_issues.extend(solid_issues)

        # Generate report
        report = self._generate_report(all_issues)

        # Determine if we should block
        has_blocking_errors = any(
            '❌ BLOCKED' in issue[2]
            for issue in all_issues
        )

        return not has_blocking_errors, report

    def _generate_report(self, issues: List[Tuple[Path, int, str]]) -> str:
        """Generate a detailed report of type safety issues."""
        report_lines = [
            "=" * 80,
            "TypeScript Type Safety Validation Report",
            "=" * 80,
            "",
            f"Files Checked: {self.stats['files_checked']}",
            f"'any' Usage Count: {self.stats['any_count']}",
            f"Type Assertions: {self.stats['assertions_count']}",
            f"Missing Type Annotations: {self.stats['missing_types']}",
            f"'unknown' Usage: {self.stats['unknown_count']}",
            "",
        ]

        if not issues:
            report_lines.extend([
                "✅ SUCCESS: No type safety issues found!",
                "All TypeScript code follows strict typing principles.",
            ])
        else:
            # Group issues by severity
            blocking_issues = [i for i in issues if '❌ BLOCKED' in i[2]]
            warning_issues = [i for i in issues if '⚠️  WARNING' in i[2]]

            if blocking_issues:
                report_lines.extend([
                    "❌ BLOCKING ISSUES (Must be fixed):",
                    "-" * 40,
                ])
                for file_path, line_num, issue in blocking_issues[:10]:  # Show first 10
                    report_lines.append(f"  {file_path}:{line_num}")
                    report_lines.append(f"    {issue}")
                    report_lines.append("")

                if len(blocking_issues) > 10:
                    report_lines.append(f"  ... and {len(blocking_issues) - 10} more blocking issues")
                report_lines.append("")

            if warning_issues:
                report_lines.extend([
                    "⚠️  WARNINGS (Should be addressed):",
                    "-" * 40,
                ])
                for file_path, line_num, issue in warning_issues[:5]:  # Show first 5
                    report_lines.append(f"  {file_path}:{line_num}")
                    report_lines.append(f"    {issue}")
                    report_lines.append("")

                if len(warning_issues) > 5:
                    report_lines.append(f"  ... and {len(warning_issues) - 5} more warnings")
                report_lines.append("")

        # Add recommendations
        if self.stats['any_count'] > 0:
            report_lines.extend([
                "📝 RECOMMENDATIONS:",
                "-" * 40,
                "1. Replace 'any' with proper types or generics",
                "2. Use 'unknown' with type guards for truly unknown types",
                "3. Create type definitions for third-party libraries",
                "4. Consider using the /strict-types command to auto-fix issues",
                "",
            ])

        report_lines.append("=" * 80)

        return "\n".join(report_lines)


def main():
    """Main entry point for the hook."""
    # Check if this is being run on TypeScript files
    if len(sys.argv) < 2:
        print("ℹ️  TypeScript validation hook - no files to validate")
        return 0

    # Get list of files to check from arguments or git
    files_to_check = sys.argv[1:] if len(sys.argv) > 1 else []

    # Filter for TypeScript files only
    ts_files = [f for f in files_to_check if f.endswith(('.ts', '.tsx'))]

    if not ts_files:
        print("ℹ️  No TypeScript files to validate")
        return 0

    validator = TypeScriptValidator()

    print("🔍 Running TypeScript type safety validation...")

    # Validate the workspace
    success, report = validator.validate_workspace()

    # Print the report
    print(report)

    # Return appropriate exit code
    if not success:
        print("\n❌ COMMIT BLOCKED: Fix type safety issues before committing.")
        print("💡 TIP: Run '/strict-types' to get automated fixes for these issues.")
        return 1
    else:
        print("\n✅ TypeScript validation passed! Code follows strict typing principles.")
        return 0


if __name__ == "__main__":
    sys.exit(main())