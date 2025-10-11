# Type Coverage Report

Generate comprehensive TypeScript type coverage report and identify areas needing better typing.

## Usage

```
/type-coverage [options]
```

Options:

- `--detail`: Show file-by-file breakdown
- `--min-coverage 95`: Set minimum acceptable coverage
- `--fix`: Automatically add missing types where possible
- `--strict`: Include all strict mode checks

## What This Command Does

1. **Coverage Analysis**
   - Calculate percentage of typed vs untyped code
   - Identify files with lowest type coverage
   - Find implicit any usage
   - Detect any[] and Function types

2. **Detailed Metrics**
   - Total type coverage percentage
   - Number of `any` types
   - Number of `unknown` types
   - Missing return types count
   - Missing parameter types count
   - Type assertion count

3. **File-Level Analysis**
   - Sort files by coverage (worst first)
   - Show line-by-line issues
   - Highlight critical type gaps
   - Suggest quick fixes

4. **Generate Reports**
   - Console summary report
   - Detailed markdown report
   - JSON data for CI/CD integration
   - Historical comparison if available

## Implementation Steps

1. Use TypeScript compiler API to analyze type information
2. Run type-coverage tool: `bunx type-coverage --detail`
3. Parse and analyze the results
4. Generate actionable recommendations
5. Optionally apply automatic fixes
6. Create detailed report with trends

## Report Format

```
================================================================================
TypeScript Type Coverage Report
================================================================================

Overall Coverage: 87.3% (Target: 95%)

Summary:
- Files Analyzed: 145
- Typed Expressions: 12,456
- Untyped Expressions: 1,823
- Any Usage: 47 occurrences
- Unknown Usage: 23 occurrences
- Type Assertions: 31 occurrences

Critical Issues (Must Fix):
1. apps/frontend/src/api/client.ts - 42% coverage
   - Line 23: Parameter 'data' implicitly has 'any' type
   - Line 45: Missing return type annotation

2. libs/shared/utils/helpers.ts - 58% coverage
   - Line 12: Using 'any[]' instead of proper array type
   - Line 34: Type assertion should be type guard

Warnings (Should Fix):
1. apps/backend/src/services/user.service.ts - 78% coverage
   - Line 56: 'unknown' could be narrowed with type guard

Top 10 Files Needing Attention:
1. client.ts - 42% coverage (58% below target)
2. helpers.ts - 58% coverage (37% below target)
3. auth.service.ts - 71% coverage (24% below target)
...

Recommendations:
1. Add type definitions for API responses
2. Replace any[] with proper generic arrays
3. Convert 31 type assertions to type guards
4. Add return types to 23 exported functions

Historical Trend:
- Last Week: 85.2%
- Yesterday: 86.8%
- Current: 87.3% (+0.5%)

Next Steps:
1. Run '/strict-types' to automatically fix issues
2. Add pre-commit hook to prevent regression
3. Set up CI/CD type coverage gate
================================================================================
```

## Integration with CI/CD

Add to GitHub Actions:

```yaml
- name: Check Type Coverage
  run: |
    coverage=$(bunx type-coverage --json)
    if [ "$coverage" -lt "95" ]; then
      echo "Type coverage below 95%"
      exit 1
    fi
```

## Success Criteria

- Type coverage above 95%
- No implicit any types
- All exports have explicit types
- Zero use of Function type
- Minimal type assertions

## Automatic Fixes

When run with `--fix`:

1. Add return types to functions
2. Add parameter types where inferable
3. Replace any[] with unknown[]
4. Add basic type guards
5. Convert Function to proper signatures

## When to Run

- Before pull requests
- After major refactoring
- Weekly code health checks
- Before releases
- After adding dependencies
