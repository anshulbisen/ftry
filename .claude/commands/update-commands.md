---
description: Automatically sync slash commands with repository changes and agent configurations
---

Analyze the current state of the repository and update all slash commands to ensure they remain synchronized with:

## Synchronization Scope

### 1. Agent Discovery

- Scan `.claude/agents/` for all agent configurations
- Identify agents without corresponding commands
- Create commands for newly added agents
- Update commands for modified agents
- Remove commands for deleted agents

### 2. Technology Updates

- Analyze `package.json` for version changes
- Update commands with new package versions
- Identify new dependencies requiring commands
- Update build/test/dev commands accordingly

### 3. Script Analysis

- Review `package.json` scripts section
- Ensure commands align with available scripts
- Create commands for complex script combinations
- Update command documentation with script changes

### 4. Workflow Patterns

- Analyze recent git commits for workflow patterns
- Identify repetitive command sequences
- Create composite commands for common workflows
- Optimize command chaining and parallelization

### 5. MCP Integration

- Check available MCP servers
- Create commands leveraging MCP capabilities
- Update existing commands to use MCP when beneficial
- Document MCP-powered enhancements

### 6. Documentation Sync

- Update `.claude/SLASH_COMMANDS.md`
- Ensure all commands have descriptions
- Add usage examples from recent history
- Create quick reference tables

## Auto-Generated Commands

The following types of commands are automatically created/updated:

### Agent Commands

- `/use-[agent-name]` - Individual agent usage
- `/review-with-[agent-name]` - Targeted review
- `/optimize-with-[agent-name]` - Specific optimization

### Workflow Commands

- `/workflow-[pattern]` - Common workflow automation
- `/fix-all-[issue-type]` - Batch fixing commands
- `/validate-[aspect]` - Validation commands

### Integration Commands

- `/mcp-[server]-[action]` - MCP server operations
- `/nx-[target]` - Nx-specific operations
- `/test-[scope]` - Testing commands

## Usage

```bash
# Full synchronization
/update-commands

# Focus on specific area
/update-commands agents     # Only sync agent commands
/update-commands scripts    # Only sync script commands
/update-commands workflows  # Only sync workflow commands
/update-commands docs       # Only update documentation

# Dry run to preview changes
/update-commands --dry-run

# Force recreation of all commands
/update-commands --force
```

## Process Flow

1. **Discovery Phase**
   - Scan repository structure
   - Analyze configurations
   - Identify patterns

2. **Analysis Phase**
   - Compare current vs desired state
   - Identify gaps and redundancies
   - Plan updates

3. **Generation Phase**
   - Create new commands
   - Update existing commands
   - Remove obsolete commands

4. **Documentation Phase**
   - Update SLASH_COMMANDS.md
   - Generate usage examples
   - Create quick reference

5. **Validation Phase**
   - Test generated commands
   - Verify no breaking changes
   - Ensure backwards compatibility

## Expected Outputs

- **Command Report**: List of added/updated/removed commands
- **Usage Guide**: Updated documentation with examples
- **Migration Notes**: Breaking changes and how to adapt
- **Optimization Suggestions**: Workflow improvements identified
- **Statistics**: Command usage analytics and patterns

## Intelligent Features

### Pattern Recognition

- Identifies frequently used command sequences
- Suggests composite commands for efficiency
- Detects inefficient workflows

### Version Awareness

- Updates version numbers in descriptions
- Maintains compatibility notes
- Suggests deprecation timelines

### Context Learning

- Learns from commit messages
- Adapts to team conventions
- Improves command descriptions

### Safety Checks

- Preserves user customizations
- Backs up existing commands
- Provides rollback capability

## Configuration

Commands respect configuration in:

- `.claude/commands.config.json` (if exists)
- User preferences for naming conventions
- Team-specific workflow patterns

The synchronization ensures your slash commands always reflect the current state of your repository, making Claude Code integration seamless and up-to-date.
