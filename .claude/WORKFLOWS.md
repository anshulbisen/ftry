# Standard Development Workflows

Step-by-step workflows for common development tasks in the ftry project.

## 1. Feature Implementation (Full TDD Cycle)

### Automated Workflow

```bash
/implement-feature "appointment-booking" fullstack
```

This command orchestrates the complete TDD workflow through specialized agents.

### Manual Steps (if needed)

**Phase 1: Planning (30 min)**

1. Define feature scope

   ```bash
   # Create feature branch
   git checkout -b feature/appointment-booking

   # Document in issue or markdown
   echo "## Appointment Booking Feature" > docs/features/appointment-booking.md
   ```

2. Break down into user stories
   - As a salon manager, I want to book appointments for clients
   - As a client, I want to view available time slots
   - As a staff member, I want to see my schedule

3. Identify technical requirements
   - Backend: Appointment model, booking service, REST endpoints
   - Frontend: Booking form, calendar view, time slot selector
   - Database: appointments table with indexes

**Phase 2: Test-First Development (TDD)**

1. Write tests BEFORE implementation

   ```bash
   # Backend tests
   /test-first AppointmentService unit

   # Frontend tests
   /test-first BookingForm component

   # Verify tests fail
   nx test backend
   nx test frontend
   ```

2. Implement minimal code to pass tests

   ```bash
   # Implement incrementally
   # Run tests continuously
   nx test backend --watch
   ```

3. Commit when tests pass
   ```bash
   git add .
   /commit "feat(appointments): implement booking service with validation"
   ```

**Phase 3: Integration & Quality**

1. Run full quality checks

   ```bash
   bun run check-all
   ```

2. Fix any issues

   ```bash
   # Linting
   bun run lint:fix

   # Type errors
   # Fix manually, then run
   bun run typecheck
   ```

3. Update documentation
   ```bash
   /update-docs appointment-booking
   ```

**Phase 4: Review & Finalize**

1. Run comprehensive review

   ```bash
   /full-review
   ```

2. Address critical and high-priority issues

3. Create pull request
   ```bash
   git push -u origin feature/appointment-booking
   gh pr create --title "feat(appointments): implement booking system" \
     --body "$(cat <<'EOF'
   ```

## Summary

- Appointment booking form with validation
- Calendar view for available slots
- Staff schedule integration

## Testing

- [x] Unit tests (95% coverage)
- [x] Integration tests
- [x] E2E booking flow

Generated with Claude Code
EOF
)"

````

**Timeline**: 2-4 hours for small feature, 1-2 days for complex feature

---

## 2. Test-First Development (Specific Component)

### Quick TDD for Single Component

```bash
/test-first "BookingForm" component
````

### Manual Steps

1. **Write failing test**

   ```typescript
   // apps/frontend/src/components/BookingForm.spec.tsx
   import { render, screen } from '@testing-library/react';
   import { BookingForm } from './BookingForm';

   describe('BookingForm', () => {
     it('should render booking form with required fields', () => {
       render(<BookingForm />);

       expect(screen.getByLabelText('Client Name')).toBeInTheDocument();
       expect(screen.getByLabelText('Service')).toBeInTheDocument();
       expect(screen.getByLabelText('Date & Time')).toBeInTheDocument();
       expect(screen.getByRole('button', { name: 'Book Appointment' })).toBeInTheDocument();
     });

     it('should validate required fields', async () => {
       render(<BookingForm />);

       const submitButton = screen.getByRole('button', { name: 'Book Appointment' });
       fireEvent.click(submitButton);

       expect(await screen.findByText('Client name is required')).toBeInTheDocument();
     });
   });
   ```

2. **Verify test fails**

   ```bash
   nx test frontend
   # Expected: Tests fail (component doesn't exist yet)
   ```

3. **Implement minimal code**

   ```typescript
   // apps/frontend/src/components/BookingForm.tsx
   import { useForm } from 'react-hook-form';
   import { zodResolver } from '@hookform/resolvers/zod';
   import { z } from 'zod';

   const bookingSchema = z.object({
     clientName: z.string().min(1, 'Client name is required'),
     service: z.string().min(1, 'Service is required'),
     dateTime: z.date(),
   });

   export const BookingForm = () => {
     const { register, handleSubmit, formState: { errors } } = useForm({
       resolver: zodResolver(bookingSchema),
     });

     return (
       <form onSubmit={handleSubmit(onSubmit)}>
         <label htmlFor="clientName">Client Name</label>
         <input id="clientName" {...register('clientName')} />
         {errors.clientName && <p>{errors.clientName.message}</p>}

         {/* ... other fields */}

         <button type="submit">Book Appointment</button>
       </form>
     );
   };
   ```

4. **Verify tests pass**

   ```bash
   nx test frontend
   # Expected: Tests pass
   ```

5. **Commit**
   ```bash
   /commit "test(appointments): add BookingForm component with validation"
   ```

**Timeline**: 15-30 minutes per component

---

## 3. Quick Fix Workflow

### For Small Bugs or Improvements

```bash
/quick-fix [performance|security|bug|refactor]
```

### Manual Steps

1. **Reproduce issue**

   ```bash
   # Run specific test or manual reproduction
   nx test backend --testNamePattern="authentication"
   ```

2. **Write test for fix** (if not exists)

   ```typescript
   it('should handle invalid JWT token gracefully', async () => {
     const result = await service.validateToken('invalid-token');
     expect(result).toBeNull();
   });
   ```

3. **Implement fix**

   ```typescript
   async validateToken(token: string) {
     try {
       return this.jwtService.verify(token);
     } catch (error) {
       this.logger.warn('Invalid token', error);
       return null;
     }
   }
   ```

4. **Verify fix**

   ```bash
   nx test backend
   bun run check-all
   ```

5. **Commit**
   ```bash
   /commit "fix(auth): handle invalid JWT tokens gracefully"
   ```

**Timeline**: 10-30 minutes

---

## 4. Code Review Workflow

### When Reviewing Pull Requests

1. **Checkout PR branch**

   ```bash
   gh pr checkout 123
   ```

2. **Run automated review**

   ```bash
   /full-review
   ```

3. **Review agent reports**
   - Check critical and high-priority issues
   - Review performance recommendations
   - Verify security concerns addressed

4. **Run tests locally**

   ```bash
   bun run check-all
   nx affected --target=test
   ```

5. **Comment on PR**
   ```bash
   gh pr review 123 --comment --body "$(cat <<'EOF'
   ```

## Review Summary

**Overall**: Looks good with minor suggestions

**Strengths**:

- Good test coverage (90%)
- Clean component structure
- Proper error handling

**Suggestions**:

- Add loading states to booking form
- Consider memoizing expensive calculations

**Action Required**:

- Fix type error in AppointmentService.ts:45
- Update documentation for new API endpoints

Let me know if you need any clarification!
EOF
)"

````

6. **Request changes or approve**
```bash
# Request changes
gh pr review 123 --request-changes

# Or approve
gh pr review 123 --approve
````

**Timeline**: 30-60 minutes depending on PR size

---

## 5. Hotfix Workflow

### For Critical Production Issues

1. **Create hotfix branch from main**

   ```bash
   git checkout main
   git pull origin main
   git checkout -b hotfix/critical-auth-bug
   ```

2. **Write test reproducing issue**

   ```typescript
   it('should not allow account lockout bypass', async () => {
     // Simulate 5 failed attempts
     for (let i = 0; i < 5; i++) {
       await service.login('test@test.com', 'wrong-password');
     }

     // 6th attempt should be blocked
     await expect(service.login('test@test.com', 'correct-password')).rejects.toThrow(
       'Account locked',
     );
   });
   ```

3. **Implement fix**

   ```typescript
   // Fix account lockout logic
   ```

4. **Run quality checks**

   ```bash
   bun run check-all
   ```

5. **Commit and push**

   ```bash
   /commit "fix(auth): prevent account lockout bypass" --push
   ```

6. **Create urgent PR**

   ```bash
   gh pr create \
     --title "HOTFIX: Prevent account lockout bypass" \
     --label "urgent,security" \
     --body "Critical security fix for account lockout mechanism"
   ```

7. **Deploy after approval**

   ```bash
   # Merge to main
   gh pr merge --squash

   # Deploy
   git checkout main
   git pull
   # ... deployment steps
   ```

**Timeline**: 1-2 hours (prioritize speed and safety)

---

## 6. Documentation Update Workflow

### After Feature Implementation

1. **Run documentation update**

   ```bash
   /update-docs appointment-booking
   ```

2. **Review generated documentation**

   ```bash
   # Check created/updated files
   git status

   # Review changes
   git diff docs/
   ```

3. **Commit documentation**
   ```bash
   git add docs/
   git commit -m "docs(appointments): document booking system"
   ```

**Timeline**: 10-15 minutes

---

## 7. Performance Optimization Workflow

### Systematic Performance Improvements

1. **Run performance audit**

   ```bash
   /optimize-performance
   ```

2. **Review findings**
   - Frontend rendering issues
   - Backend query performance
   - Database N+1 queries
   - Bundle size problems

3. **Implement optimizations**

   ```typescript
   // Example: Memoize expensive computation
   const sortedAppointments = useMemo(
     () => appointments.sort((a, b) => a.startTime - b.startTime),
     [appointments]
   );

   // Example: Add database index
   @@index([tenantId, startTime])
   ```

4. **Measure improvements**

   ```bash
   # Frontend bundle size
   nx build frontend
   # Check dist/ size

   # Backend query performance
   # Check logs for query times
   ```

5. **Commit optimizations**
   ```bash
   /commit "perf(appointments): optimize appointment list rendering"
   ```

**Timeline**: 1-2 hours

---

## 8. Security Audit Workflow

### Comprehensive Security Review

1. **Run security audit**

   ```bash
   /security-audit
   ```

2. **Review findings**
   - Authentication vulnerabilities
   - Input validation issues
   - SQL injection risks
   - CSRF protection gaps
   - Sensitive data exposure

3. **Prioritize fixes**
   - P0: Critical vulnerabilities (immediate fix)
   - P1: High-risk issues (this sprint)
   - P2: Medium-risk issues (next sprint)

4. **Implement fixes**

   ```bash
   # For each issue
   /quick-fix security
   ```

5. **Re-audit**
   ```bash
   /security-audit
   ```

**Timeline**: 2-4 hours for comprehensive audit

---

## 9. Refactoring Workflow

### Large-Scale Code Improvements

1. **Identify refactoring targets**

   ```bash
   # Find large components
   find apps/frontend/src -name "*.tsx" -exec wc -l {} + | sort -rn | head -10

   # Find code duplication
   /use-agent code-duplication-detector "analyze frontend components"
   ```

2. **Run refactoring specialists**

   ```bash
   /refactor-code
   ```

3. **Verify no functionality broken**

   ```bash
   # Run all tests
   nx run-many --target=test --all

   # Manual testing of refactored areas
   ```

4. **Commit refactoring**
   ```bash
   /commit "refactor(ui): extract shared button components"
   ```

**Timeline**: 3-6 hours for major refactoring

---

## 10. Database Migration Workflow

### Safe Database Schema Changes

1. **Update Prisma schema**

   ```prisma
   model Appointment {
     // ... existing fields
     notes String? @db.Text  // New field
   }
   ```

2. **Create migration**

   ```bash
   bunx prisma migrate dev --name add_appointment_notes
   ```

3. **Review generated SQL**

   ```bash
   # Check migration file
   cat prisma/migrations/*/migration.sql

   # Ensure it's safe (nullable field, no data loss)
   ```

4. **Test migration**

   ```bash
   # Apply to dev database
   bunx prisma migrate dev

   # Verify schema
   bunx prisma studio
   ```

5. **Update code to use new field**

   ```typescript
   // Generate Prisma client
   bunx prisma generate

   // Update service
   await prisma.appointment.create({
     data: { notes: 'Important client request' }
   });
   ```

6. **Test affected functionality**

   ```bash
   nx test backend --testPathPattern="appointment"
   ```

7. **Commit migration**
   ```bash
   git add prisma/migrations prisma/schema.prisma
   /commit "feat(db): add notes field to appointments"
   ```

**Timeline**: 30-60 minutes

---

## Context Management Best Practices

### When to Use /clear

- After completing major features (save decisions to docs first)
- Before switching to unrelated tasks (backend → frontend)
- When context feels cluttered
- After architectural discussions (checkpoint to markdown)

### Creating Context Checkpoints

```bash
# Before clearing, save important context
echo "## Authentication Refactor - 2025-10-08" > docs/context/auth-refactor.md
echo "### Key Decisions" >> docs/context/auth-refactor.md
echo "- Using HTTP-only cookies for JWT" >> docs/context/auth-refactor.md
echo "- Implementing refresh token rotation" >> docs/context/auth-refactor.md

# Now safe to clear
/clear
```

---

## Quick Reference

| Workflow               | Command                             | Time   | Complexity |
| ---------------------- | ----------------------------------- | ------ | ---------- |
| Feature Implementation | `/implement-feature "name" [scope]` | 2-4h   | High       |
| Test-First Component   | `/test-first "Component" [type]`    | 15-30m | Low        |
| Quick Fix              | `/quick-fix [type]`                 | 10-30m | Low        |
| Code Review            | `/full-review`                      | 30-60m | Medium     |
| Hotfix                 | Manual (branch → fix → test → PR)   | 1-2h   | High       |
| Documentation          | `/update-docs [feature]`            | 10-15m | Low        |
| Performance            | `/optimize-performance`             | 1-2h   | Medium     |
| Security Audit         | `/security-audit`                   | 2-4h   | High       |
| Refactoring            | `/refactor-code`                    | 3-6h   | High       |
| Database Migration     | Manual (schema → migrate → test)    | 30-60m | Medium     |

---

**Last Updated**: 2025-10-08
**For More Details**: See individual slash command documentation in `.claude/commands/`
