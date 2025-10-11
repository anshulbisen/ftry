# Documentation Standards

Comprehensive standards for documentation, reports, and file organization in the ftry project.

## CRITICAL: Docusaurus-First Policy

**Effective Date**: 2025-10-11

**ALL project documentation MUST be maintained in Docusaurus (`apps/docs/`).**

This is the single source of truth for technical documentation. No standalone markdown files should be created outside of Docusaurus.

## Quick Reference

### File Types

- **Technical Documentation** (permanent) → `apps/docs/docs/` (Docusaurus) **[PRIMARY]**
- **Reports** (temporary, auto-generated) → `.claude/reports/` (ignored)
- **CLAUDE.md** (AI context) → Module directories (committed)
- **README.md** (package docs only) → Library directories (committed)

### Key Directories

```
apps/docs/                # Docusaurus application (PRIMARY DOCUMENTATION)
├── docs/                 # Technical documentation (committed)
│   ├── getting-started/  # Setup, quick start, project structure
│   ├── architecture/     # System design, architectural decisions
│   ├── api/              # REST API reference
│   └── guides/           # Development guides, how-tos
├── sidebars.ts           # Navigation configuration
└── docusaurus.config.ts  # Docusaurus configuration

.claude/reports/          # Generated reports (ignored by git)
├── archive/              # Historical reports (90-day retention)
└── README.md             # Directory guide

.claude/                  # Claude Code configuration (committed)
├── commands/             # Slash commands
├── agents/               # Subagent configurations
├── hooks/                # Pre/post-tool hooks
└── DOCUMENTATION_STANDARDS.md  # This file

docs/                     # LEGACY - Being migrated to apps/docs/
```

---

## 1. Docusaurus Documentation Standards

### 1.1 Documentation Structure

All technical documentation lives in `apps/docs/docs/`:

```
apps/docs/docs/
├── getting-started/           # New user onboarding
│   ├── introduction.md        # Project overview
│   ├── quick-start.md         # Setup guide
│   ├── project-structure.md   # Codebase organization
│   └── development-workflow.md # Development process
├── architecture/              # System design
│   ├── overview.md            # Architecture overview
│   ├── nx-monorepo.md         # Monorepo patterns
│   ├── frontend.md            # Frontend architecture
│   ├── backend.md             # Backend architecture
│   ├── database.md            # Database design
│   ├── authentication.md      # Auth system
│   └── admin-crud.md          # Admin interface
├── api/                       # REST API documentation
│   ├── overview.md            # API overview
│   ├── authentication.md      # Auth endpoints
│   ├── tenants.md             # Tenant endpoints
│   ├── users.md               # User endpoints
│   ├── permissions.md         # Permission endpoints
│   └── roles.md               # Role endpoints
└── guides/                    # Development guides
    ├── contributing.md        # Contribution guide
    ├── claude-code.md         # Claude Code setup
    ├── tdd-workflow.md        # TDD practices
    ├── creating-libraries.md  # Nx library creation
    ├── admin-resources.md     # Admin CRUD guide
    ├── database-migrations.md # Migration workflow
    └── testing.md             # Testing strategies
```

### 1.2 File Naming Conventions

- Use **kebab-case** for file names: `quick-start.md`, `development-workflow.md`
- Use descriptive, scannable names
- Avoid abbreviations: `authentication.md` not `auth.md`
- One concept per file

### 1.3 Frontmatter (Optional)

Docusaurus supports frontmatter for metadata:

```markdown
---
sidebar_position: 1
title: Quick Start Guide
description: Get up and running with ftry in minutes
---

# Quick Start
```

### 1.4 When to Update Documentation

**ALWAYS update documentation when:**

1. Implementing new features
2. Changing public APIs
3. Making architectural decisions
4. Adding/modifying libraries
5. Changing configuration
6. User workflows change

**Use the `/update-docs` command:**

```bash
/update-docs [feature-name]      # Update existing docs
/update-docs new [feature-name]  # Create new docs
/update-docs validate            # Validate all docs
```

### 1.5 Documentation Requirements for Features

Every feature must have:

- **Architecture documentation** - How it's designed
- **API documentation** - If backend changes
- **Usage guide** - How to use it
- **Code examples** - Working examples
- **Testing guide** - How to test it

### 1.6 For Claude Code AI

When implementing features:

1. **Plan documentation** - Include in feature plan
2. **Write during implementation** - Don't defer
3. **Update sidebar** - Add to `apps/docs/sidebars.ts`
4. **Test examples** - Ensure code examples work
5. **Validate links** - Check internal references
6. **Build docs** - Run `nx build docs` to verify

### 1.7 For Subagents

#### docs-maintainer

- Primary agent for documentation
- Creates/updates Docusaurus pages
- Updates sidebar navigation
- Validates links and formatting
- Generates documentation reports

#### All Other Agents

- Must update documentation when changing code
- Reference Docusaurus URLs in comments
- Call docs-maintainer for complex updates
- Never create standalone markdown files

---

## 2. Naming Conventions (Reports & Legacy)

### 1.1 Reports (Temporary, Auto-Generated)

**Location**: `.claude/reports/` (ignored by git)

**Format**: `{category}-{subcategory}-{date}.md`

**Categories**:

- `sync` - Repository synchronization reports
- `review` - Code and architecture reviews
- `optimization` - Performance and code optimization
- `security` - Security audits and vulnerability reports
- `test` - Test coverage and quality reports
- `architecture` - Architectural analysis reports

**Date Format**: `YYYY-MM-DD` (ISO 8601, sortable)

**Examples**:

```
sync-repository-2025-10-11.md
review-architecture-2025-10-11.md
review-code-quality-2025-10-11.md
optimization-performance-2025-10-11.md
optimization-database-2025-10-11.md
security-audit-2025-10-11.md
test-coverage-2025-10-11.md
architecture-assessment-2025-10-11.md
```

**Legacy Naming** (to be migrated):

- `SYNC_REPORT_2025-10-10.md` → `sync-repository-2025-10-10.md`
- `CONSOLIDATION_SUMMARY.md` → `sync-consolidation-2025-10-10.md`
- `performance-optimization-2025-10-11.md` ✓ (already correct)
- `type-safety-fix-20251011.md` → `optimization-type-safety-2025-10-11.md`

### 1.2 Documentation (Permanent, Curated)

**Location**: `docs/` (committed to git)

**Format**: `{TOPIC}_{TYPE}.md`

**Types**:

- `GUIDE` - Step-by-step instructions (e.g., `BACKUP_RESTORE_GUIDE.md`)
- `REFERENCE` - Quick lookup information (e.g., `DATABASE_QUICK_REFERENCE.md`)
- `ARCHITECTURE` - Architectural documentation (e.g., `ADMIN_CRUD_ARCHITECTURE.md`)
- `QUICK_START` - Getting started guides (e.g., `ADMIN_QUICK_START.md`)

**Examples**:

```
docs/guides/AUTHENTICATION_GUIDE.md
docs/guides/BACKUP_RESTORE_GUIDE.md
docs/architecture/DATABASE_ARCHITECTURE.md
docs/architecture/ADMIN_CRUD_ARCHITECTURE.md
docs/operations/DEPLOYMENT_GUIDE.md
docs/development/TESTING_GUIDE.md
```

**Legacy Naming** (to be migrated):

- `AUTHENTICATION.md` → `AUTHENTICATION_GUIDE.md`
- `DATABASE_QUICK_REFERENCE.md` ✓ (already correct)
- `ADMIN_CRUD_ARCHITECTURE.md` ✓ (already correct)
- `RLS_IMPLEMENTATION_GUIDE.md` ✓ (already correct)

### 1.3 Implementation Reports (Transitional)

**Current Location**: `docs/` (to be moved to `.claude/reports/`)

**Files to Migrate**:

```
ADMIN_GUARD_SCOPING_IMPLEMENTATION.md    → .claude/reports/archive/
ADMIN_SEEDS_IMPLEMENTATION.md            → .claude/reports/archive/
UNIFIED_ADMIN_API_IMPLEMENTATION.md      → .claude/reports/archive/
UNIFIED_ADMIN_IMPLEMENTATION_PLAN.md     → .claude/reports/archive/
DOCUMENTATION_UPDATE_REPORT_2025-10-08.md → .claude/reports/archive/
```

**Rationale**: Implementation reports are temporary artifacts documenting the _process_ of building features. Once features are complete, the permanent documentation (guides, architecture docs) should be updated, and implementation reports archived.

### 1.4 CLAUDE.md Files

**Location**: Module directories (committed to git)

**Purpose**: AI context for Claude Code

**Naming**: Always `CLAUDE.md` (uppercase, no variations)

**Locations**:

```
/CLAUDE.md                                    # Root (primary)
apps/frontend/CLAUDE.md                       # Frontend app context
apps/frontend/src/hooks/CLAUDE.md             # Custom hooks guidance
apps/frontend/src/pages/public/CLAUDE.md      # Public pages guidance
libs/backend/auth/CLAUDE.md                   # Auth module context
prisma/CLAUDE.md                              # Database context
```

**Content Structure** (see Section 3):

1. Module Overview (purpose, location, type)
2. Quick Commands
3. Architecture & Key Concepts
4. Usage Examples
5. Common Patterns
6. Known Issues & TODOs
7. Testing Guidance
8. Troubleshooting
9. Related Files

---

## 2. Report vs Documentation

### Reports (Temporary)

**Characteristics**:

- Auto-generated by agents or slash commands
- Time-stamped and dated
- Capture point-in-time state
- Archived after 90 days
- Not committed to git (`.gitignore`)

**Lifecycle**:

1. **Generated**: By `/sync-repo`, `/full-review`, `/security-audit`, etc.
2. **Used**: For immediate action items and tracking
3. **Archived**: Moved to `archive/` after addressed
4. **Deleted**: After 90 days (manual or automated cleanup)

**Examples**:

- Sync reports after repository updates
- Code review reports with specific findings
- Performance optimization reports with metrics
- Security audit reports with vulnerabilities
- Test coverage reports with gaps

### Documentation (Permanent)

**Characteristics**:

- Human-curated and maintained
- Timeless (or updated as needed)
- Describes how things work, not what changed
- Committed to git
- Indexed and searchable

**Lifecycle**:

1. **Created**: When new features/patterns emerge
2. **Updated**: When implementation changes
3. **Refined**: Based on user feedback
4. **Archived**: Only when feature is removed

**Examples**:

- Authentication guide (how to implement auth)
- Database architecture (schema design principles)
- Admin CRUD architecture (configuration-based pattern)
- Backup/restore guide (operational procedures)
- Quick start guides (onboarding new developers)

### Decision Matrix

| Question                          | Report  | Documentation |
| --------------------------------- | ------- | ------------- |
| Does it have a date in filename?  | Yes     | No            |
| Is it auto-generated?             | Usually | Rarely        |
| Does it describe what changed?    | Yes     | No            |
| Does it describe how things work? | No      | Yes           |
| Is it referenced from code?       | No      | Sometimes     |
| Should it be in git?              | No      | Yes           |
| Will it be useful in 6 months?    | Rarely  | Yes           |

---

## 3. CLAUDE.md Standards

### Purpose

CLAUDE.md files provide context for AI assistants (Claude Code) when working in specific modules. They serve as quick references and guidance documents.

### Structure

````markdown
# {Module Name} - Claude Context

Quick reference for working with {module description}.

## Module Overview

**Location**: `path/to/module`
**Purpose**: {One-sentence description}
**Type**: {feature | ui | data-access | util | app}

## Quick Commands

```bash
# Common commands specific to this module
nx test module-name
nx lint module-name
```
````

## Architecture

{Key architectural concepts, patterns, file structure}

## Usage Examples

{Code snippets showing common usage patterns}

## Common Patterns

{Reusable patterns specific to this module}

## Known Issues & TODOs

{Current issues, planned improvements, technical debt}

## Testing

{How to test this module, testing strategies}

## Troubleshooting

{Common problems and solutions}

## Related Files

- Link to other relevant files
- Cross-references to documentation

---

**Last Updated**: YYYY-MM-DD

```

### Best Practices

1. **Conciseness**: Keep under 500 lines (root CLAUDE.md can be longer)
2. **Currency**: Update with `# Last Updated` date
3. **Examples**: Include working code examples
4. **Commands**: List bash commands that work from project root
5. **No Duplication**: Reference root CLAUDE.md instead of duplicating
6. **Context**: Assume reader has read root CLAUDE.md
7. **Specific**: Focus on module-specific information

### Root CLAUDE.md Special Considerations

The root `/CLAUDE.md` is the primary AI context file and can be longer (200-300 lines). It should:

1. **Project Overview**: Brief description, current milestone
2. **Tech Stack Essentials**: Key technologies (full details in `.claude/TECH_STACK.md`)
3. **Critical Standards**: Non-negotiable rules (package manager, TDD, commits)
4. **Quick Commands**: Most common development commands
5. **Expert Agents & Slash Commands**: How to use automation
6. **Common Pitfalls**: Frequent mistakes and how to avoid them
7. **Documentation Index**: Links to detailed documentation

### Module CLAUDE.md Focus

Module-level CLAUDE.md files are more focused:

- `apps/frontend/CLAUDE.md` - Frontend-specific commands, patterns, tech stack
- `libs/backend/auth/CLAUDE.md` - Auth module API, security, usage patterns
- `prisma/CLAUDE.md` - Database commands, schema patterns, query optimization
- `apps/frontend/src/hooks/CLAUDE.md` - Hook patterns, testing, best practices

---

## 4. Directory Structure Standards

### .claude/reports/ (Ignored)

```

.claude/reports/
├── README.md # Directory guide
├── sync-repository-2025-10-11.md # Latest sync report
├── optimization-performance-2025-10-11.md # Latest optimization
├── review-code-quality-2025-10-11.md # Latest review
└── archive/ # Historical reports
├── sync-repository-2025-10-10.md
├── optimization-type-safety-2025-10-11.md
└── review-architecture-2025-10-09.md

```

**Policy**:
- Keep latest report in root
- Archive previous reports
- Delete reports older than 90 days
- Never commit to git (`.gitignore`)

### docs/ (Committed)

```

docs/
├── README.md # Documentation index
├── architecture/ # System design
│ ├── README.md # Architecture overview
│ ├── DATABASE_ARCHITECTURE.md
│ └── ADMIN_CRUD_ARCHITECTURE.md
├── guides/ # How-to guides
│ ├── README.md # Guide index
│ ├── AUTHENTICATION_GUIDE.md
│ ├── BACKUP_RESTORE_GUIDE.md
│ ├── DATABASE_QUICK_REFERENCE.md
│ └── RLS_IMPLEMENTATION_GUIDE.md
├── operations/ # Operational procedures
│ ├── README.md # Operations overview
│ ├── DEPLOYMENT_GUIDE.md
│ └── MONITORING_SETUP_GUIDE.md
├── development/ # Development workflows
│ ├── README.md # Development overview
│ ├── TESTING_STRATEGY.md
│ └── STRATEGIC_ROADMAP_2025.md
└── migration/ # Migration guides
├── README.md # Migration overview
├── CLOUD_MIGRATION_SUMMARY.md
├── CSRF_MIGRATION.md
└── GRAFANA_CLOUD_MIGRATION.md

```

**Policy**:
- Organize by category
- Include README.md in each directory
- Use consistent naming (see Section 1.2)
- Always committed to git
- Update index when adding new docs

### .claude/ (Committed)

```

.claude/
├── CLAUDE.md # Symlink to /CLAUDE.md
├── DOCUMENTATION_STANDARDS.md # This file
├── TECH_STACK.md # Complete tech stack reference
├── AGENT_COMMAND_CATALOG.md # Agent and command reference
├── WORKFLOWS.md # Standard workflows
├── commands/ # Slash commands
│ ├── sync-repo.md
│ ├── full-review.md
│ └── ...
├── agents/ # Subagent configurations
│ ├── senior-architect.md
│ ├── frontend-expert.md
│ └── ...
├── hooks/ # Pre/post-tool hooks
│ ├── validate-bash.py
│ └── validate-nx-library.py
├── reports/ # Generated reports (ignored)
└── settings.json # Claude Code settings

````

**Policy**:
- Configuration files committed to git
- Reports directory ignored (see `.gitignore`)
- Keep organized by type
- Document all slash commands

---

## 5. .gitignore Policy

### Reports Must Be Ignored

```gitignore
# Reports (generated by agents)
.claude/reports/
docs/reports/
**/.reports/

# Keep README files in reports directories
!.claude/reports/README.md
!docs/reports/README.md
````

**Rationale**:

- Reports are auto-generated and temporary
- They create unnecessary git noise
- They contain point-in-time information
- They should not be in version history

### Documentation Must Be Committed

All files in these locations are committed:

- `docs/` (except `docs/reports/`)
- `CLAUDE.md` files
- `.claude/` (except `.claude/reports/`)
- `README.md` files

---

## 6. Maintenance Procedures

### Weekly

1. **Review Reports**: Check `.claude/reports/` for actionable items
2. **Update Index**: Update `docs/README.md` if new docs added
3. **Check Links**: Verify cross-references are valid

### Monthly

1. **Archive Reports**: Move old reports to `archive/`
2. **Update CLAUDE.md**: Update "Last Updated" dates if changed
3. **Review Structure**: Ensure directory structure matches standards

### Quarterly

1. **Delete Old Reports**: Remove reports older than 90 days
2. **Audit Documentation**: Review docs for accuracy and completeness
3. **Consolidate**: Merge related documentation if overlap exists
4. **Update Standards**: Revise this document based on learnings

### When Adding New Features

1. **Create Report**: Use appropriate slash command (e.g., `/implement-feature`)
2. **Update Docs**: Update relevant documentation in `docs/`
3. **Update CLAUDE.md**: Update module CLAUDE.md if architecture changes
4. **Archive Report**: Move implementation report to `.claude/reports/archive/`

---

## 7. Migration Checklist

### Phase 1: Update .gitignore

- [ ] Add `.claude/reports/` to `.gitignore`
- [ ] Add `docs/reports/` to `.gitignore` (optional, already ignored)
- [ ] Keep `!.claude/reports/README.md` exception
- [ ] Commit `.gitignore` changes

### Phase 2: Reorganize Reports

**Move to `.claude/reports/archive/`**:

- [ ] `docs/DOCUMENTATION_UPDATE_REPORT_2025-10-08.md`
- [ ] `docs/ADMIN_GUARD_SCOPING_IMPLEMENTATION.md`
- [ ] `docs/ADMIN_SEEDS_IMPLEMENTATION.md`
- [ ] `docs/ADMIN_INTEGRATION_SUMMARY.md`
- [ ] `docs/ADMIN_TDD_SUMMARY.md`
- [ ] `docs/UNIFIED_ADMIN_API_IMPLEMENTATION.md`
- [ ] `docs/UNIFIED_ADMIN_IMPLEMENTATION_PLAN.md`

**Rename in `.claude/reports/`**:

- [ ] `SYNC_REPORT_2025-10-10.md` → `sync-repository-2025-10-10.md`
- [ ] `CONSOLIDATION_SUMMARY.md` → `sync-consolidation-2025-10-10.md`
- [ ] `type-safety-fix-20251011.md` → `optimization-type-safety-2025-10-11.md`
- [ ] `performance-optimization-2025-10-11.md` ✓ (already correct)

### Phase 3: Organize Documentation

**Create category directories** (if not exist):

- [ ] `docs/architecture/`
- [ ] `docs/guides/`
- [ ] `docs/operations/`
- [ ] `docs/development/`
- [ ] `docs/migration/`

**Move and rename files**:

- [ ] `docs/DATABASE.md` → `docs/architecture/DATABASE_ARCHITECTURE.md`
- [ ] `docs/AUTHENTICATION.md` → `docs/guides/AUTHENTICATION_GUIDE.md`
- [ ] Keep `docs/guides/BACKUP_RESTORE_GUIDE.md` ✓
- [ ] Keep `docs/architecture/ADMIN_CRUD_ARCHITECTURE.md` ✓

### Phase 4: Update Cross-References

- [ ] Update links in root `CLAUDE.md`
- [ ] Update links in module `CLAUDE.md` files
- [ ] Update links in `docs/README.md`
- [ ] Update links in moved documentation files

### Phase 5: Update README Files

- [ ] Update `.claude/reports/README.md` with new naming convention
- [ ] Update `docs/README.md` with new structure
- [ ] Create `docs/architecture/README.md`
- [ ] Create `docs/guides/README.md`
- [ ] Create `docs/operations/README.md`
- [ ] Create `docs/development/README.md`

---

## 8. Tools & Automation

### Automated Report Cleanup

```bash
#!/bin/bash
# .claude/scripts/cleanup-reports.sh

# Delete reports older than 90 days
find .claude/reports/archive/ -name "*.md" -mtime +90 -delete

echo "Cleanup complete: Deleted reports older than 90 days"
```

### Validate File Naming

```bash
#!/bin/bash
# .claude/scripts/validate-naming.sh

# Check for non-standard report names
find .claude/reports/ -maxdepth 1 -name "*.md" ! -name "README.md" | while read file; do
  basename=$(basename "$file")
  if ! echo "$basename" | grep -qE '^[a-z]+-[a-z-]+-[0-9]{4}-[0-9]{2}-[0-9]{2}\.md$'; then
    echo "❌ Non-standard report name: $basename"
  fi
done

echo "✓ Report naming validation complete"
```

### Update Documentation Index

```bash
#!/bin/bash
# .claude/scripts/update-docs-index.sh

# Regenerate docs/README.md index
echo "# Documentation Index" > docs/README.md
echo "" >> docs/README.md

for dir in docs/*/; do
  echo "## $(basename $dir)" >> docs/README.md
  find "$dir" -name "*.md" ! -name "README.md" | sort | while read file; do
    echo "- [$(basename "$file" .md)]($file)" >> docs/README.md
  done
  echo "" >> docs/README.md
done

echo "✓ Documentation index updated"
```

---

## 9. Examples

### Creating a New Report

```bash
# After running a sync
/sync-repo

# Result: .claude/reports/sync-repository-2025-10-11.md
```

### Creating New Documentation

```bash
# Create a new guide
touch docs/guides/DEPLOYMENT_GUIDE.md

# Add to docs/README.md
echo "- [Deployment Guide](guides/DEPLOYMENT_GUIDE.md)" >> docs/README.md

# Commit
git add docs/guides/DEPLOYMENT_GUIDE.md docs/README.md
git commit -m "docs: add deployment guide"
```

### Archiving a Report

```bash
# Move to archive after addressing action items
mv .claude/reports/review-code-quality-2025-10-08.md \
   .claude/reports/archive/

# Update latest report
/full-review  # Generates new report
```

---

## 10. Compliance Checklist

Use this checklist to ensure compliance with documentation standards:

### For Reports

- [ ] Filename follows `{category}-{subcategory}-{date}.md` format
- [ ] Date is in `YYYY-MM-DD` format
- [ ] File is in `.claude/reports/` or `.claude/reports/archive/`
- [ ] File is NOT committed to git (check `.gitignore`)
- [ ] Report includes timestamp and agent information
- [ ] Report includes actionable recommendations

### For Documentation

- [ ] Filename follows `{TOPIC}_{TYPE}.md` format
- [ ] File is in appropriate `docs/` subdirectory
- [ ] File is committed to git
- [ ] Documentation includes table of contents (if >100 lines)
- [ ] Cross-references use correct paths
- [ ] Documentation is indexed in `docs/README.md`
- [ ] Code examples are tested and working

### For CLAUDE.md Files

- [ ] Filename is exactly `CLAUDE.md` (uppercase)
- [ ] File is in module directory
- [ ] File is committed to git
- [ ] Includes "Last Updated" date
- [ ] Includes module overview section
- [ ] Includes quick commands section
- [ ] Includes usage examples
- [ ] References root CLAUDE.md appropriately
- [ ] No duplication with root CLAUDE.md

---

## 11. FAQ

### Q: Should I commit reports to git?

**A: No.** Reports are temporary, auto-generated files that should be in `.gitignore`. Only commit permanent documentation.

### Q: When should I create documentation vs. a report?

**A: Use this guide:**

- **Report**: Captures what was done, findings, metrics, point-in-time state
- **Documentation**: Explains how things work, best practices, patterns

Example: After implementing auth, create a report documenting the implementation process. Then update `docs/guides/AUTHENTICATION_GUIDE.md` to explain how to use auth.

### Q: How long should reports be kept?

**A: 90 days.** Reports are useful for tracking recent changes but become stale quickly. Archive after addressed, delete after 90 days.

### Q: Can CLAUDE.md files be longer than 500 lines?

**A: Root CLAUDE.md can be 200-300 lines.** Module CLAUDE.md files should stay under 500 lines. If longer, extract details to `docs/`.

### Q: Should implementation plans be reports or documentation?

**A: Reports (archived after implementation).** Implementation plans document the _process_ of building something. Once built, update permanent documentation and archive the plan.

### Q: Where do summaries go?

**A: Depends on purpose:**

- Executive summaries for stakeholders → `docs/architecture/`
- Implementation summaries → `.claude/reports/archive/`
- Feature summaries for users → `docs/guides/`

### Q: How do I reference reports from documentation?

**A: Generally, don't.** Documentation should be timeless. If you need to reference a historical report, link to the archived version, but prefer extracting relevant information into the documentation itself.

---

## 12. Related Resources

### Internal

- `/CLAUDE.md` - Root AI context
- `.claude/TECH_STACK.md` - Complete technology reference
- `.claude/AGENT_COMMAND_CATALOG.md` - Agent and command catalog
- `.claude/WORKFLOWS.md` - Standard development workflows
- `docs/README.md` - Documentation index

### External

- [Docs as Code](https://www.writethedocs.org/guide/docs-as-code/)
- [Semantic Line Breaks](https://sembr.org/)
- [GitHub Markdown Guide](https://docs.github.com/en/get-started/writing-on-github)
- [CommonMark Spec](https://commonmark.org/)

---

**Last Updated**: 2025-10-11
**Version**: 1.0.0
**Owner**: Claude Code Optimization Specialist
