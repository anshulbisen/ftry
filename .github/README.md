# GitHub Actions CI/CD

Complete CI/CD pipeline with realistic database testing.

## 📋 Workflows

### RLS Security Tests (`.github/workflows/rls-tests.yml`)

**4 parallel jobs**, each with isolated PostgreSQL 18 container:

1. **Unit Tests** (Mock, No DB) - Fast feedback (~1s)
2. **Integration Tests** (Real PostgreSQL) - Real DB with RLS policies
3. **Security Audit** - Validates RLS configuration
4. **Performance Tests** (PR only) - Benchmarks query performance

## 🛠️ Scripts

- `scripts/seed-performance-test.ts` - Seeds realistic test data
- `scripts/rls-security-audit.ts` - Validates RLS implementation
- `scripts/rls-performance-test.ts` - Benchmarks performance
- `scripts/test-rls-policies.sql` - Direct SQL policy tests

## 📚 Documentation

- Complete Guide: `/docs/CICD_DATABASE_TESTING_STRATEGY.md`
- RLS Implementation: `/docs/RLS_IMPLEMENTATION_GUIDE.md`

**CI/CD Status**: ✅ Production-ready
