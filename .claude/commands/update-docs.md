---
description: Maintain and update documentation using the docs-maintainer specialist
---

Deploy the **docs-maintainer** specialist to keep documentation synchronized with the codebase.

**Documentation Maintenance Tasks:**

**/update-docs** - Full documentation audit and update

- Scan codebase for recent changes
- Identify outdated documentation
- Update affected docs with current implementation
- Validate code examples and links
- Update navigation and cross-references
- Generate comprehensive update report

**/update-docs [feature-name]** - Update docs for specific feature

- Focus on documentation related to specified feature
- Update technical details and API changes
- Refresh code examples
- Update related documentation
- Add cross-references

**/update-docs new [feature-name]** - Create new feature documentation

- Use feature documentation template
- Extract API signatures and models from code
- Create usage examples
- Add to documentation navigation
- Cross-reference with related docs

**/update-docs validate** - Validate all documentation

- Check for broken internal links
- Validate code examples compile/run
- Find TODO/FIXME/OUTDATED markers
- Check formatting consistency
- Generate validation report

**/update-docs metrics** - Generate documentation health metrics

- Documentation coverage percentage
- Outdated docs count (>30 days)
- Broken links count
- TODO markers count
- Code examples tested count

**The docs-maintainer agent will:**

1. **Analyze codebase changes** - Identify what has changed
2. **Review existing docs** - Find affected documentation
3. **Update content** - Sync technical details with implementation
4. **Validate quality** - Ensure consistency and accuracy
5. **Create new docs** - Generate documentation for new features
6. **Archive obsolete content** - Move outdated docs to archive/
7. **Generate report** - Provide summary of changes made

**Output includes:**

- Updated documentation files
- List of changes made
- New files created
- Validation results
- Documentation metrics
- Recommendations for improvement

**Best for:**

- After merging features or major changes
- Before releases to ensure docs are current
- Regular maintenance (weekly/monthly)
- Creating documentation for new features
- Validating documentation quality

Usage: `/update-docs [feature-name|new feature-name|validate|metrics]`

The docs-maintainer ensures your documentation is always synchronized with your code, making onboarding and maintenance easier.
