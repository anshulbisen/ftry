---
description: Maintain and update Docusaurus documentation using the docs-maintainer specialist
---

Deploy the **docs-maintainer** specialist to keep Docusaurus documentation (`apps/docs/`) synchronized with the codebase.

**CRITICAL**: All documentation MUST be in Docusaurus. This command enforces the Docusaurus-first policy.

**Documentation Maintenance Tasks:**

**/update-docs** - Full Docusaurus documentation audit and update

- Scan codebase for recent changes
- Identify outdated documentation in `apps/docs/docs/`
- Update affected docs with current implementation
- Validate code examples and links
- Update `apps/docs/sidebars.ts` navigation
- Run `nx build docs` to validate
- Generate comprehensive update report

**/update-docs [feature-name]** - Update Docusaurus docs for specific feature

- Focus on documentation in `apps/docs/docs/` for specified feature
- Update technical details and API changes
- Refresh code examples
- Update `apps/docs/sidebars.ts` if needed
- Add cross-references
- Validate with `nx build docs`

**/update-docs new [feature-name]** - Create new feature documentation in Docusaurus

- Create new doc in `apps/docs/docs/guides/[feature-name].md`
- Use feature documentation template
- Extract API signatures and models from code
- Create usage examples
- Add to `apps/docs/sidebars.ts` navigation
- Cross-reference with related docs
- Validate with `nx build docs`

**/update-docs validate** - Validate all Docusaurus documentation

- Check for broken internal links
- Validate code examples compile/run
- Find TODO/FIXME/OUTDATED markers in `apps/docs/docs/`
- Run `nx build docs` (fails on broken links)
- Check formatting consistency
- Generate validation report

**/update-docs metrics** - Generate Docusaurus documentation health metrics

- Total docs in `apps/docs/docs/`
- Documentation coverage percentage
- Outdated docs count (>30 days)
- Broken links count (from build)
- TODO markers count
- Code examples tested count

**The docs-maintainer agent will:**

1. **Analyze codebase changes** - Identify what has changed
2. **Review Docusaurus docs** - Find affected documentation in `apps/docs/docs/`
3. **Update content** - Sync technical details with implementation
4. **Update sidebar** - Maintain `apps/docs/sidebars.ts` navigation
5. **Validate quality** - Run `nx build docs` to check links
6. **Create new docs** - Generate documentation in Docusaurus
7. **Generate report** - Provide summary of changes made

**Output includes:**

- Updated documentation files in `apps/docs/docs/`
- Updated `apps/docs/sidebars.ts` if navigation changed
- List of changes made
- New files created
- Build validation results (`nx build docs`)
- Documentation metrics
- Recommendations for improvement

**Best for:**

- After merging features or major changes
- Before releases to ensure docs are current
- Before creating PRs (documentation required)
- Regular maintenance (weekly/monthly)
- Creating documentation for new features
- Validating documentation quality

**Commands:**

```bash
/update-docs                      # Full audit
/update-docs authentication       # Update specific feature
/update-docs new booking-flow     # Create new doc
/update-docs validate             # Check health
/update-docs metrics              # Get statistics
```

**Note**: Consider using `/sync-docs` instead - it's the newer, recommended command for automatic documentation synchronization.

Usage: `/update-docs [feature-name|new feature-name|validate|metrics]`

The docs-maintainer ensures your Docusaurus documentation is always synchronized with your code, maintaining it as the single source of truth.
