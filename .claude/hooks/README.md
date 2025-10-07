# Claude Code Hooks

This directory contains Claude Code hooks that enforce project standards and provide helpful context.

## Configured Hooks

### 1. Bash Command Validator (`validate-bash.py`)

**Event**: `PreToolUse` (Bash tool)
**Purpose**: Validates bash commands before execution to ensure project standards

**Blocks**:

- Using npm, yarn, pnpm, or node instead of bun
- Wrong package manager commands

**Warns About**:

- Using `bun nx` instead of just `nx`
- Using bash commands when specialized tools are better (grep → Grep tool, find → Glob tool, cat → Read tool, sed/awk → Edit tool)
- Git anti-patterns (--no-verify, --force without lease)

**Example Output**:

```
🚫 Command Blocked - Project Standards Violation:
   ⚠️ Use 'bun' instead of npm/yarn/pnpm/node. This project exclusively uses Bun.

📋 Recommendations:
   ℹ️ Use the Grep tool instead of 'grep' command for better performance
```

### 2. Tooling Context Injector (`add-tooling-context.py`)

**Event**: `SessionStart`
**Purpose**: Injects project tooling standards into every new Claude session

**Provides**:

- Package manager reminders (bun exclusively)
- Nx command patterns
- Available npm scripts
- Code quality tool information
- Commit message format
- Testing framework details

This ensures Claude is always aware of project standards without manual reminders.

### 3. Code Quality Reminder (`check-code-quality.py`)

**Event**: `PostToolUse` (Write, Edit, MultiEdit tools)
**Purpose**: Reminds about quality checks after file modifications

**Triggers For**:

- TypeScript/JavaScript files (.ts, .tsx, .js, .jsx, .mjs, .cjs)
- Config files (.json, .yml, .yaml)
- Test files (.spec.ts, .test.ts, etc.)

**Suggests**:

- Running formatters (`bun run format`)
- Linting (`bun run lint`)
- Type checking (`bun run typecheck`)
- Testing (`nx affected --target=test`)
- All-in-one check (`bun run check-all`)

## Configuration

Hooks are configured in `.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [...],
    "PostToolUse": [...],
    "SessionStart": [...]
  }
}
```

### Environment Variables

All hooks have access to:

- `CLAUDE_PROJECT_DIR`: Absolute path to project root

## Testing Hooks

To manually test a hook:

```bash
# Test bash validator
echo '{"tool_name":"Bash","tool_input":{"command":"npm install"}}' | .claude/hooks/validate-bash.py

# Test tooling context
echo '{"hook_event_name":"SessionStart"}' | .claude/hooks/add-tooling-context.py

# Test quality reminder
echo '{"tool_name":"Write","tool_input":{"file_path":"src/test.ts"}}' | .claude/hooks/check-code-quality.py
```

## Debugging

Use `claude --debug` to see detailed hook execution:

```bash
claude --debug
```

This shows:

- Which hooks are triggered
- Command being executed
- Exit codes and output
- Timing information

## Modifying Hooks

1. Edit the Python script in `.claude/hooks/`
2. Ensure it's executable: `chmod +x .claude/hooks/script.py`
3. Test manually with sample input
4. Reload Claude Code or review in `/hooks` menu

**Note**: Changes to hooks don't apply to the current session immediately. Review them in the `/hooks` menu or restart Claude Code.

## Security

All hooks:

- ✅ Validate and sanitize inputs
- ✅ Use proper shell quoting
- ✅ Have execution timeouts (5 seconds)
- ✅ Check for path traversal attempts
- ✅ Use absolute paths via `$CLAUDE_PROJECT_DIR`

## Best Practices

1. **Keep hooks fast**: All hooks have 5-second timeouts
2. **Be specific**: Only validate what matters for project standards
3. **Provide helpful feedback**: Clear error messages with actionable advice
4. **Don't block unnecessarily**: Use warnings for suggestions, blocks for violations
5. **Test thoroughly**: Always test hooks manually before committing

## Troubleshooting

### Hook not running?

1. Check `/hooks` menu in Claude Code to verify configuration
2. Verify script is executable: `ls -l .claude/hooks/`
3. Test manually with sample input
4. Check `claude --debug` output

### Hook timing out?

- Default timeout is 5 seconds
- Increase in settings.json if needed
- Optimize script for performance

### Hook blocking incorrectly?

- Review validation patterns in the script
- Test with the exact command being blocked
- Adjust regex patterns if needed

## References

- [Claude Code Hooks Documentation](https://docs.claude.com/en/docs/claude-code/hooks-reference)
- [Project Standards](../../CLAUDE.md)
- [Code Quality Setup](../../CLAUDE.md#code-quality--standards)
