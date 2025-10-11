#!/usr/bin/env python3
"""
Documentation Validation Hook

Validates that:
1. All documentation is in Docusaurus (apps/docs/docs/)
2. No standalone markdown files created outside Docusaurus
3. Documentation changes are included with code changes
4. Docusaurus build succeeds

This hook enforces the Docusaurus-first documentation policy.
"""

import json
import os
import re
import subprocess
import sys
from pathlib import Path

# ANSI color codes
RED = '\033[0;31m'
YELLOW = '\033[1;33m'
GREEN = '\033[0;32m'
NC = '\033[0m'  # No Color

def print_error(message):
    print(f"{RED}❌ {message}{NC}", file=sys.stderr)

def print_warning(message):
    print(f"{YELLOW}⚠️  {message}{NC}", file=sys.stderr)

def print_success(message):
    print(f"{GREEN}✅ {message}{NC}")

def get_staged_files():
    """Get list of staged files"""
    try:
        result = subprocess.run(
            ['git', 'diff', '--cached', '--name-only'],
            capture_output=True,
            text=True,
            check=True
        )
        return [f.strip() for f in result.stdout.split('\n') if f.strip()]
    except subprocess.CalledProcessError:
        return []

def check_forbidden_markdown_files(staged_files):
    """Check for markdown files outside Docusaurus"""
    forbidden_patterns = [
        r'^docs/.*\.md$',  # Legacy docs/ directory
        r'^README\.md$',   # Root README (allowed)
        r'^libs/.*/README\.md$',  # Library READMEs (allowed)
        r'^apps/.*/README\.md$',  # App READMEs (allowed, but not docs)
    ]

    forbidden_files = []

    for file in staged_files:
        if not file.endswith('.md'):
            continue

        # Check if it's in the legacy docs/ directory
        if file.startswith('docs/') and file.endswith('.md'):
            if file != 'docs/README.md':  # Allow docs/README.md as index
                forbidden_files.append(file)
                continue

        # Check if it's a documentation file (not README) outside Docusaurus
        if file.endswith('.md') and not file.endswith('README.md'):
            if not file.startswith('apps/docs/docs/'):
                # Allow specific files
                allowed_files = [
                    'CLAUDE.md',
                    'CHANGELOG.md',
                    'CONTRIBUTING.md',
                    'LICENSE.md',
                ]
                if not any(file.endswith(f) for f in allowed_files):
                    if not file.startswith('.claude/'):  # Allow .claude/ md files
                        forbidden_files.append(file)

    return forbidden_files

def check_docs_with_code_changes(staged_files):
    """Check if code changes include documentation updates"""
    code_extensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.prisma']
    doc_files = [f for f in staged_files if f.startswith('apps/docs/docs/')]
    code_files = [f for f in staged_files if any(f.endswith(ext) for ext in code_extensions)]

    # Check if there are code changes in apps/ or libs/ without doc changes
    significant_code_changes = [
        f for f in code_files
        if f.startswith('apps/') or f.startswith('libs/')
    ]

    # Filter out test files
    significant_code_changes = [
        f for f in significant_code_changes
        if not ('.spec.' in f or '.test.' in f)
    ]

    # If there are significant code changes but no doc changes, warn
    if significant_code_changes and not doc_files:
        return False, significant_code_changes

    return True, []

def validate_docusaurus_build():
    """Validate that Docusaurus build succeeds"""
    try:
        print("Validating Docusaurus build...")
        result = subprocess.run(
            ['nx', 'build', 'docs'],
            capture_output=True,
            text=True,
            timeout=120
        )

        if result.returncode != 0:
            print_error("Docusaurus build failed!")
            print(result.stdout)
            print(result.stderr, file=sys.stderr)
            return False

        # Check for broken links in output
        if 'Broken link' in result.stdout or 'Broken link' in result.stderr:
            print_error("Docusaurus build found broken links!")
            print(result.stdout)
            return False

        return True
    except subprocess.TimeoutExpired:
        print_error("Docusaurus build timed out (>120s)")
        return False
    except subprocess.CalledProcessError as e:
        print_error(f"Failed to run Docusaurus build: {e}")
        return False

def main():
    """Main validation logic"""
    staged_files = get_staged_files()

    if not staged_files:
        print("No staged files to validate")
        return 0

    errors = []
    warnings = []

    # Check 1: No forbidden markdown files
    forbidden_files = check_forbidden_markdown_files(staged_files)
    if forbidden_files:
        errors.append("Forbidden markdown files outside Docusaurus:")
        for file in forbidden_files:
            errors.append(f"  - {file}")
        errors.append("")
        errors.append("CRITICAL: All documentation MUST be in Docusaurus (apps/docs/docs/)")
        errors.append("")
        errors.append("To fix:")
        errors.append("  1. Move content to apps/docs/docs/")
        errors.append("  2. Update apps/docs/sidebars.ts")
        errors.append("  3. Remove the forbidden file")
        errors.append("  4. Run: nx build docs")

    # Check 2: Documentation with code changes
    has_docs, code_files = check_docs_with_code_changes(staged_files)
    if not has_docs and code_files:
        warnings.append("Code changes detected without documentation updates:")
        for file in code_files[:5]:  # Show first 5
            warnings.append(f"  - {file}")
        if len(code_files) > 5:
            warnings.append(f"  ... and {len(code_files) - 5} more files")
        warnings.append("")
        warnings.append("Consider running: /sync-docs")
        warnings.append("Or add documentation manually in apps/docs/docs/")

    # Check 3: If docs changed, validate build
    doc_files = [f for f in staged_files if f.startswith('apps/docs/')]
    if doc_files:
        print(f"\n{len(doc_files)} documentation file(s) changed. Validating...")
        if not validate_docusaurus_build():
            errors.append("Docusaurus build validation failed!")
            errors.append("Fix broken links or build errors before committing.")
            errors.append("")
            errors.append("To debug:")
            errors.append("  nx build docs")
            errors.append("  nx serve docs  # Preview at http://localhost:3002")

    # Print results
    if warnings:
        print("\n" + YELLOW + "=" * 60 + NC)
        for warning in warnings:
            print_warning(warning)
        print(YELLOW + "=" * 60 + NC + "\n")

    if errors:
        print("\n" + RED + "=" * 60 + NC)
        for error in errors:
            print_error(error)
        print(RED + "=" * 60 + NC + "\n")
        return 1

    if doc_files:
        print_success("Documentation validation passed!")

    return 0

if __name__ == '__main__':
    sys.exit(main())
