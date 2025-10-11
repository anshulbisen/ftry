# Development Workflows

Step-by-step workflows for common development tasks.

**Last Updated**: 2025-10-11

## Quick Command Reference

| Workflow           | Command                             | Time   |
| ------------------ | ----------------------------------- | ------ |
| Feature (Full TDD) | `/implement-feature "name" [scope]` | 2-4h   |
| Test-First         | `/test-first "Component" [type]`    | 15-30m |
| Quick Fix          | `/quick-fix [type]`                 | 10-30m |
| Code Review        | `/full-review`                      | 30-60m |
| Documentation      | `/update-docs [feature]`            | 10-15m |
| Performance        | `/optimize-performance`             | 1-2h   |
| Security Audit     | `/security-audit`                   | 2-4h   |
| Database Migration | Manual (schema → migrate → test)    | 30-60m |
| Admin Resource     | Manual (hooks → form → config)      | 30m    |
| Repository Sync    | `/sync-repo`                        | 3-5m   |

## 1. Feature Implementation (TDD)

### Automated

```bash
/implement-feature "appointment-booking" fullstack
```

### Manual Steps

**Phase 1: Planning (30 min)**

```bash
# Create branch
git checkout -b feature/appointment-booking

# Define scope (in issue or markdown)
# - User stories
# - Technical requirements
# - Database changes
```

**Phase 2: Test-First (TDD)**

```bash
# Write tests BEFORE implementation
/test-first AppointmentService unit

# Verify tests fail
nx test backend

# Implement minimal code
# Run tests continuously
nx test backend --watch

# Commit when green
/commit "feat(appointments): implement booking service"
```

**Phase 3: Integration & Quality**

```bash
# Quality checks
bun run check-all

# Update documentation
/update-docs appointment-booking
```

**Phase 4: Review & PR**

```bash
# Comprehensive review
/full-review

# Create PR
git push -u origin feature/appointment-booking
gh pr create --title "feat: appointment booking" \
  --body "## Summary
- Booking form with validation
- Calendar view
- Staff integration

## Testing
- [x] Unit tests (95% coverage)
- [x] Integration tests
- [x] E2E booking flow"
```

## 2. Test-First Development

### Quick TDD

```bash
/test-first "BookingForm" component
```

### Manual

**1. Write failing test**:

```typescript
// BookingForm.spec.tsx
describe('BookingForm', () => {
  it('should render with required fields', () => {
    render(<BookingForm />);

    expect(screen.getByLabelText('Client Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Service')).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    render(<BookingForm />);
    fireEvent.click(screen.getByRole('button', { name: 'Book' }));

    expect(await screen.findByText('Client name required')).toBeInTheDocument();
  });
});
```

**2. Verify failure**:

```bash
nx test frontend
# Expected: Tests fail
```

**3. Implement**:

```typescript
// BookingForm.tsx
export const BookingForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(bookingSchema)
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('clientName')} />
      {errors.clientName && <p>{errors.clientName.message}</p>}
      <button type="submit">Book</button>
    </form>
  );
};
```

**4. Verify pass**:

```bash
nx test frontend
# Expected: Tests pass
```

**5. Commit**:

```bash
/commit "test(appointments): add BookingForm validation"
```

## 3. Database Migration

**1. Update schema**:

```prisma
// prisma/schema.prisma
model Appointment {
  // ... existing fields
  notes String? @db.Text  // New field
}
```

**2. Create migration**:

```bash
bunx prisma migrate dev --name add_appointment_notes
```

**3. Review SQL**:

```bash
cat prisma/migrations/*/migration.sql
# Ensure safe (nullable, no data loss)
```

**4. Test**:

```bash
# Apply
bunx prisma migrate dev

# Verify
bunx prisma studio

# Generate client
bunx prisma generate
```

**5. Update code**:

```typescript
await prisma.appointment.create({
  data: { notes: 'Important request' },
});
```

**6. Commit**:

```bash
git add prisma/
/commit "feat(db): add notes to appointments"
```

## 4. Admin Resource Creation

**See [Admin CRUD Quick Start](./admin-crud-quick-start) for 30-minute guide.**

Quick summary:

1. Create TanStack Query hooks (5 min)
2. Create form component (10 min)
3. Create configuration (10 min)
4. Create page component (2 min)
5. Add to routing (3 min)
6. Test (5 min)

**Result**: 30 minutes, 93% less code than legacy approach.

## 5. Code Review

### Automated

```bash
/full-review
```

### Manual

**1. Checkout PR**:

```bash
gh pr checkout 123
```

**2. Run checks**:

```bash
bun run check-all
nx affected --target=test
```

**3. Review with agents**:

```bash
/full-review
# Deploys: senior-architect, frontend-expert, backend-expert,
#          database-expert, code-quality-enforcer, performance-optimizer
```

**4. Comment on PR**:

```bash
gh pr review 123 --comment --body "
## Review Summary
**Overall**: Looks good with minor suggestions

**Strengths**:
- Good test coverage
- Clean structure

**Suggestions**:
- Add loading states
- Memoize calculations

**Action Required**:
- Fix type error in AppointmentService.ts:45
"
```

**5. Approve or request changes**:

```bash
gh pr review 123 --approve
# or
gh pr review 123 --request-changes
```

## 6. Hotfix

**For critical production issues**

**1. Create branch from main**:

```bash
git checkout main
git pull
git checkout -b hotfix/critical-auth-bug
```

**2. Write test reproducing issue**:

```typescript
it('should not allow lockout bypass', async () => {
  // Simulate 5 failed attempts
  for (let i = 0; i < 5; i++) {
    await service.login('test@test.com', 'wrong');
  }

  // 6th should be blocked
  await expect(service.login('test@test.com', 'correct')).rejects.toThrow('Account locked');
});
```

**3. Fix and verify**:

```bash
# Implement fix
# ...

# Quality checks
bun run check-all
```

**4. Deploy urgently**:

```bash
/commit "fix(auth): prevent lockout bypass" --push

gh pr create \
  --title "HOTFIX: Prevent lockout bypass" \
  --label "urgent,security"

# After approval
gh pr merge --squash
```

## 7. Performance Optimization

**1. Run audit**:

```bash
/optimize-performance
```

**2. Implement optimizations**:

```typescript
// Memoize expensive computations
const sorted = useMemo(
  () => appointments.sort((a, b) => a.time - b.time),
  [appointments]
);

// Add database index
@@index([tenantId, startTime])
```

**3. Measure**:

```bash
# Frontend bundle
nx build frontend

# Backend query times
# Check logs
```

**4. Commit**:

```bash
/commit "perf(appointments): optimize list rendering"
```

## 8. Security Audit

**1. Run audit**:

```bash
/security-audit
```

**2. Prioritize fixes**:

- P0: Critical (immediate)
- P1: High-risk (this sprint)
- P2: Medium-risk (next sprint)

**3. Fix issues**:

```bash
/quick-fix security
```

**4. Re-audit**:

```bash
/security-audit
```

## 9. Documentation Update

**1. After feature**:

```bash
/update-docs appointment-booking
```

**2. Review**:

```bash
git diff apps/docs/
```

**3. Commit**:

```bash
git add apps/docs/
git commit -m "docs(appointments): document booking system"
```

## 10. Repository Synchronization

**Run after completing any feature**:

```bash
/sync-repo
```

**What it does**:

1. **Quality Gate** (sequential, must pass):
   - `/check-all` - Format, lint, typecheck, test

2. **Maintenance** (parallel, independent):
   - `/update-docs` - Documentation sync
   - `/update-agents` - Agent config sync
   - `/update-commands` - Command sync
   - `/full-review` - Code review
   - `/security-audit` - Security scan
   - `/fix-boundaries` - Module boundaries

**Performance**: ~3-5 minutes (parallel execution)

## Context Management

### When to Use /clear

- After completing major features (save to docs first)
- Before switching tasks (backend → frontend)
- When context feels cluttered
- After architectural discussions

### Creating Checkpoints

```bash
# Save context before clearing
echo "## Auth Refactor - 2025-01-11" > docs/context/auth.md
echo "### Decisions" >> docs/context/auth.md
echo "- HTTP-only cookies" >> docs/context/auth.md

# Now safe to clear
/clear
```

## Best Practices

1. **TDD First**: Always `/test-first` before implementing
2. **Quality Gates**: Run `/check-all` before every commit
3. **Atomic Commits**: Use `/commit` with conventional format
4. **Review Often**: `/full-review` before PRs
5. **Document Changes**: `/update-docs` after features
6. **Monitor Performance**: `/optimize-performance` periodically
7. **Security First**: `/security-audit` before production
8. **Sync Repository**: `/sync-repo` after features

## Related Documentation

- [Contributing Guide](./contributing)
- [Claude Code Setup](./claude-code)
- [Testing Guide](./testing)
- [Admin CRUD Quick Start](./admin-crud-quick-start)
