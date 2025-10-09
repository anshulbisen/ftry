#!/bin/bash

# Admin Module Integration Verification Script
# This script verifies that the admin module is properly integrated

echo "========================================="
echo "Admin Module Integration Verification"
echo "========================================="
echo ""

# Check 1: TypeScript compilation
echo "✓ Checking TypeScript compilation..."
if bunx tsc --noEmit --project apps/backend/tsconfig.app.json 2>&1 | grep -q "error TS"; then
  echo "✗ TypeScript errors found"
  bunx tsc --noEmit --project apps/backend/tsconfig.app.json 2>&1 | grep "error TS" | head -5
  exit 1
else
  echo "✓ TypeScript compilation successful"
fi
echo ""

# Check 2: AdminModule import in AppModule
echo "✓ Checking AdminModule import in AppModule..."
if grep -q "import { AdminModule } from 'admin';" /Users/anshulbisen/projects/personal/ftry/apps/backend/src/app/app.module.ts; then
  echo "✓ AdminModule import found"
else
  echo "✗ AdminModule import missing"
  exit 1
fi

if grep -q "AdminModule," /Users/anshulbisen/projects/personal/ftry/apps/backend/src/app/app.module.ts; then
  echo "✓ AdminModule registered in imports"
else
  echo "✗ AdminModule not registered in imports"
  exit 1
fi
echo ""

# Check 3: Controller routes
echo "✓ Checking controller route configurations..."
CORRECT_ROUTES=0
if grep -q "@Controller('v1/admin/tenants')" /Users/anshulbisen/projects/personal/ftry/libs/backend/admin/src/lib/controllers/tenant.controller.ts; then
  ((CORRECT_ROUTES++))
fi
if grep -q "@Controller('v1/admin/users')" /Users/anshulbisen/projects/personal/ftry/libs/backend/admin/src/lib/controllers/user.controller.ts; then
  ((CORRECT_ROUTES++))
fi
if grep -q "@Controller('v1/admin/roles')" /Users/anshulbisen/projects/personal/ftry/libs/backend/admin/src/lib/controllers/role.controller.ts; then
  ((CORRECT_ROUTES++))
fi
if grep -q "@Controller('v1/admin/permissions')" /Users/anshulbisen/projects/personal/ftry/libs/backend/admin/src/lib/controllers/permission.controller.ts; then
  ((CORRECT_ROUTES++))
fi

if [ $CORRECT_ROUTES -eq 4 ]; then
  echo "✓ All controller routes correctly configured ($CORRECT_ROUTES/4)"
else
  echo "✗ Some controller routes incorrectly configured ($CORRECT_ROUTES/4)"
  exit 1
fi
echo ""

# Check 4: Swagger tags
echo "✓ Checking Swagger documentation tags..."
if grep -q "Admin - Tenants" /Users/anshulbisen/projects/personal/ftry/apps/backend/src/bootstrap.ts; then
  echo "✓ Admin Swagger tags configured"
else
  echo "✗ Admin Swagger tags missing"
  exit 1
fi
echo ""

# Check 5: Environment variables
echo "✓ Checking required environment variables..."
if [ -f ".env" ]; then
  MISSING_VARS=0
  if ! grep -q "JWT_SECRET=" .env; then
    echo "✗ JWT_SECRET missing in .env"
    ((MISSING_VARS++))
  fi
  if ! grep -q "DATABASE_URL=" .env; then
    echo "✗ DATABASE_URL missing in .env"
    ((MISSING_VARS++))
  fi
  if ! grep -q "CSRF_SECRET=" .env; then
    echo "✗ CSRF_SECRET missing in .env"
    ((MISSING_VARS++))
  fi
  
  if [ $MISSING_VARS -eq 0 ]; then
    echo "✓ All required environment variables present"
  else
    echo "⚠ Some environment variables missing (check .env.example)"
  fi
else
  echo "⚠ .env file not found (copy from .env.example)"
fi
echo ""

# Check 6: Integration test exists
echo "✓ Checking integration test..."
if [ -f "/Users/anshulbisen/projects/personal/ftry/apps/backend/src/app/admin-module-integration.spec.ts" ]; then
  echo "✓ Integration test file exists"
else
  echo "✗ Integration test file missing"
  exit 1
fi
echo ""

# Check 7: Documentation
echo "✓ Checking documentation..."
if [ -f "/Users/anshulbisen/projects/personal/ftry/libs/backend/admin/INTEGRATION.md" ]; then
  echo "✓ Integration documentation exists"
else
  echo "⚠ Integration documentation missing"
fi
echo ""

echo "========================================="
echo "✓ Verification Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Start backend: nx serve backend"
echo "2. Check Swagger docs: http://localhost:3001/api/docs"
echo "3. Test admin endpoints using the documented routes"
echo ""
echo "Admin endpoints available at:"
echo "  - /api/v1/admin/tenants"
echo "  - /api/v1/admin/users"
echo "  - /api/v1/admin/roles"
echo "  - /api/v1/admin/permissions"
echo ""
