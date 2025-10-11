---
description: Automatically synchronize Docusaurus documentation with code changes using docs-maintainer specialist
---

# Sync Documentation with Codebase

Deploy the **docs-maintainer** specialist to automatically synchronize Docusaurus documentation with code changes.

## Purpose

**Run this command after ANY code changes** to ensure documentation stays current.

This command:

1. Analyzes recent code changes
2. Identifies documentation impact
3. Updates or creates Docusaurus documentation
4. Validates all documentation links and builds
5. Generates comprehensive sync report

## Usage

```bash
/sync-docs                    # Sync all documentation
/sync-docs [feature-name]     # Sync specific feature docs
/sync-docs validate           # Only validate existing docs
```

## What Gets Synchronized

### Code Changes Detected

- ✅ New features or components
- ✅ Modified API endpoints
- ✅ Database schema changes
- ✅ Configuration changes
- ✅ Dependency updates
- ✅ Architectural decisions

### Documentation Actions

- 📝 Create new docs for new features
- ✏️ Update existing docs for changes
- 🔗 Fix broken internal links
- ✅ Validate code examples
- 🗂️ Update sidebar navigation
- 🏗️ Build and validate Docusaurus

## Sync Workflow

The docs-maintainer will:

### 1. Analyze Changes

```bash
# Check recent commits
git log --since="1 week ago" --oneline

# Identify affected files
git diff --name-only HEAD~10..HEAD

# Find new features
grep -r "export.*function\|export.*class" --include="*.ts" --include="*.tsx"
```

### 2. Audit Documentation

```bash
# Check Docusaurus docs
ls -la apps/docs/docs/

# Find outdated docs
grep -r "TODO\|FIXME\|OUTDATED" apps/docs/docs/

# Validate build
nx build docs
```

### 3. Update Documentation

**For New Features:**

- Create new doc in `apps/docs/docs/guides/[feature-name].md`
- Add to sidebar in `apps/docs/sidebars.ts`
- Include usage examples
- Cross-reference related docs

**For API Changes:**

- Update `apps/docs/docs/api/[resource].md`
- Sync request/response types
- Update code examples
- Add migration notes if breaking

**For Architecture Changes:**

- Update `apps/docs/docs/architecture/[component].md`
- Document design decisions
- Update diagrams if needed
- Add ADR if significant

**For Configuration Changes:**

- Update `apps/docs/docs/getting-started/quick-start.md`
- Document new environment variables
- Update setup instructions

### 4. Validate & Build

```bash
# Validate documentation
nx build docs

# Check for broken links
# (build will fail if links broken)

# Preview changes
nx serve docs  # http://localhost:3002
```

### 5. Generate Report

Creates sync report with:

- Files created/updated
- Documentation gaps identified
- Broken links fixed
- Build validation results
- Next action items

## Examples

### Example 1: After Implementing New Feature

```bash
# You just implemented appointment booking feature
/sync-docs appointment-booking
```

**Result:**

- Creates `apps/docs/docs/guides/appointment-booking.md`
- Updates `apps/docs/docs/api/appointments.md` with new endpoints
- Adds to `guidesSidebar` in `apps/docs/sidebars.ts`
- Includes usage examples from code
- Validates build succeeds

### Example 2: After API Changes

```bash
# You modified user authentication endpoints
/sync-docs authentication
```

**Result:**

- Updates `apps/docs/docs/api/authentication.md`
- Updates `apps/docs/docs/architecture/authentication.md`
- Refreshes code examples
- Adds migration notes for breaking changes
- Validates all links

### Example 3: General Sync After Multiple Changes

```bash
# End of day sync
/sync-docs
```

**Result:**

- Scans all recent changes
- Updates multiple documentation files
- Creates docs for undocumented features
- Fixes all broken links
- Generates comprehensive report

### Example 4: Validation Only

```bash
# Just check documentation health
/sync-docs validate
```

**Result:**

- Validates existing documentation
- Checks for broken links
- Runs `nx build docs`
- Reports issues without making changes

## Integration with Development Workflow

### Daily Workflow

```bash
# Morning: Start work
git pull origin main

# During development: Make changes
# ... code, code, code ...

# Before committing: Sync docs
/sync-docs

# Commit with docs
git add apps/docs/
git commit -m "feat(appointments): add booking feature

- Implement booking controller
- Add validation rules
- Update documentation"
```

### Feature Branch Workflow

```bash
# Create feature branch
git checkout -b feature/new-feature

# Implement feature
# ... code ...

# Sync docs before PR
/sync-docs new-feature

# Create PR with updated docs
/create-pr
```

### PR Review Checklist

Before merging PR, ensure:

- [ ] `/sync-docs` has been run
- [ ] All documentation in `apps/docs/docs/`
- [ ] Sidebar navigation updated
- [ ] `nx build docs` succeeds
- [ ] No broken links in build output

## Documentation Standards Enforced

The sync command ensures:

### ✅ Docusaurus-First

- All docs in `apps/docs/docs/`
- No standalone markdown files
- Proper sidebar navigation

### ✅ Quality Standards

- Code examples tested
- Proper heading hierarchy
- Internal links validated
- Build succeeds

### ✅ Completeness

- Every feature documented
- API endpoints documented
- Configuration documented
- Examples provided

## Troubleshooting

### Issue: Sync reports missing documentation

**Solution**: The command will create placeholder docs. Review and fill in:

1. Check generated file in `apps/docs/docs/`
2. Add detailed description
3. Include usage examples
4. Validate with `nx build docs`

### Issue: Build fails with broken links

**Solution**: The sync command will attempt to fix. If manual fix needed:

1. Check build output for broken links
2. Update links to correct paths
3. Remove links to deprecated content
4. Re-run `/sync-docs validate`

### Issue: Documentation seems outdated

**Solution**: Run full sync:

```bash
/sync-docs

# If still outdated, check specific feature
/sync-docs [feature-name]
```

## Output Report Format

The sync command generates a report like:

````markdown
# Documentation Sync Report

**Date**: 2025-10-11
**Scope**: Full sync

## Changes Detected

- 5 files modified in last week
- 2 new features identified
- 1 API endpoint added
- 0 breaking changes

## Documentation Updates

### Created

- `apps/docs/docs/guides/appointment-booking.md`
- `apps/docs/docs/api/appointments.md`

### Updated

- `apps/docs/docs/architecture/database.md` (schema changes)
- `apps/docs/docs/getting-started/quick-start.md` (new env vars)

### Sidebar Changes

- Added `guides/appointment-booking` to guidesSidebar
- Added `api/appointments` to apiSidebar

## Validation Results

- ✅ Build succeeded
- ✅ No broken links
- ✅ All code examples valid
- ⚠️ 2 TODO markers found (non-blocking)

## Documentation Coverage

- Total docs: 18 (+2)
- API coverage: 85% (+10%)
- Feature coverage: 90% (+15%)
- Architecture docs: 100%

## Next Actions

- [ ] Review and enhance generated documentation
- [ ] Add more advanced examples
- [ ] Consider adding diagrams for complex flows

## Commands

```bash
# Preview documentation
nx serve docs  # http://localhost:3002

# Rebuild if needed
nx build docs

# Deploy (future)
nx build docs && deploy
```
````

```

## Best Practices

### DO ✅
- Run `/sync-docs` after every feature implementation
- Run `/sync-docs` before creating PRs
- Review generated documentation for accuracy
- Add detailed examples beyond basic template
- Cross-reference related documentation

### DON'T ❌
- Skip documentation sync "for later"
- Commit code without running `/sync-docs`
- Ignore documentation gaps in report
- Leave TODO markers without issue numbers
- Create docs outside Docusaurus

## Configuration

The sync command uses:
- **Agent**: docs-maintainer
- **Target**: `apps/docs/docs/`
- **Validation**: `nx build docs`
- **Preview**: `nx serve docs` (port 3002)

## Related Commands

- `/update-docs` - Legacy command (use `/sync-docs` instead)
- `/full-review` - Includes documentation review
- `/commit` - Can include doc sync validation
- `/sync-repo` - Full repository sync including docs

## Success Criteria

Documentation sync is successful when:
1. ✅ All new features have documentation
2. ✅ All API changes documented
3. ✅ Sidebar navigation complete
4. ✅ `nx build docs` succeeds
5. ✅ No broken links
6. ✅ Code examples tested
7. ✅ Preview looks correct

---

**Remember**: Run `/sync-docs` after **EVERY** code change. Documentation debt accumulates fast!

**Pro Tip**: Add to your git hooks or make it part of your commit workflow for automatic documentation updates.
```
