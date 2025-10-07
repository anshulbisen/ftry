# GitHub Configuration

This directory contains GitHub-specific configurations for repository management, CI/CD, and collaboration.

## Contents

### Workflows (`.github/workflows/`)

- **ci.yml**: Main CI/CD pipeline that runs on push and pull requests
  - Code quality checks (linting, formatting, type checking)
  - Test execution with coverage
  - Build verification
  - Artifact archival

### Issue Templates (`.github/ISSUE_TEMPLATE/`)

- **bug_report.yml**: Structured template for bug reports
- **feature_request.yml**: Structured template for feature requests

### Pull Request Template

- **pull_request_template.md**: Standard PR template with checklists

### Dependabot Configuration

- **dependabot.yml**: Automated dependency updates
  - Weekly updates on Mondays at 9 AM IST
  - Groups related packages (Nx, NestJS, React, Testing, etc.)
  - Ignores major version updates (requires manual review)
  - Also updates GitHub Actions

## CI/CD Pipeline

### Triggers

- Push to `main` or `develop` branches
- Pull requests targeting `main` or `develop`

### Jobs

1. **Quality** (runs first)
   - ESLint (code linting)
   - TypeScript (type checking)
   - Prettier (format checking)

2. **Tests** (runs in parallel with quality)
   - Unit tests on affected projects
   - Coverage reports
   - Uploads to Codecov (optional)

3. **Build** (runs after quality and tests pass)
   - Builds all affected projects
   - Archives dist folder on main branch pushes

### Environment

- **Runtime**: Bun 1.2.19
- **OS**: Ubuntu Latest
- **Parallelization**: Up to 3 concurrent tasks
- **Optimization**: Uses Nx affected commands

## Dependabot

Dependabot automatically creates PRs for:

- npm package updates (grouped by ecosystem)
- GitHub Actions updates
- Security vulnerabilities

**Review Process**:

1. Dependabot creates PR with grouped updates
2. CI runs automatically on the PR
3. Review changes and test locally if needed
4. Merge if tests pass and changes look good

## Issue and PR Guidelines

### Bug Reports

Use the bug report template to ensure all necessary information is provided:

- Clear description
- Reproduction steps
- Expected vs actual behavior
- Version and environment details

### Feature Requests

Use the feature request template to propose new features:

- Problem statement
- Proposed solution
- Alternatives considered
- Priority and scope

### Pull Requests

All PRs should:

- Use the PR template
- Pass all CI checks
- Use conventional commit messages
- Include tests for new features
- Update documentation as needed

## Secrets Configuration

The following secrets may need to be configured in repository settings:

- `CODECOV_TOKEN` (optional): For uploading test coverage to Codecov

## Branch Protection

Recommended branch protection rules for `main`:

- ✅ Require pull request reviews before merging
- ✅ Require status checks to pass before merging
  - quality
  - test
  - build
- ✅ Require branches to be up to date before merging
- ✅ Require linear history
- ✅ Include administrators

## Notes

- All GitHub Actions use official actions from trusted publishers
- CI uses `--frozen-lockfile` to ensure reproducible builds
- Artifacts are retained for 7 days
- Timeouts are set to prevent runaway jobs
