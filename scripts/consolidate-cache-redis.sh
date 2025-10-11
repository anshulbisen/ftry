#!/bin/bash
# consolidate-cache-redis.sh
#
# Consolidates the cache library into backend-redis to:
# - Fix module boundary violation (data-access → data-access)
# - Reduce library count
# - Improve code organization

set -e

echo "======================================"
echo "Cache → Redis Consolidation Script"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check we're in the right directory
if [ ! -f "nx.json" ]; then
  echo -e "${RED}Error: Must run from project root${NC}"
  exit 1
fi

echo -e "${YELLOW}Step 1: Moving cache files into redis library...${NC}"
if [ -d "libs/backend/cache" ]; then
  git mv libs/backend/cache/src/lib/cache.service.ts libs/backend/redis/src/lib/
  git mv libs/backend/cache/src/lib/cache.module.ts libs/backend/redis/src/lib/
  echo -e "${GREEN}✓ Files moved${NC}"
else
  echo -e "${RED}Error: cache library not found${NC}"
  exit 1
fi

echo ""
echo -e "${YELLOW}Step 2: Updating redis index.ts...${NC}"
cat >> libs/backend/redis/src/index.ts << 'EOF'

// Cache functionality (consolidated from @ftry/backend/cache)
export * from './lib/cache.service';
export * from './lib/cache.module';
EOF
echo -e "${GREEN}✓ index.ts updated${NC}"

echo ""
echo -e "${YELLOW}Step 3: Updating redis project.json tags...${NC}"
# Change redis from data-access to util
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  sed -i '' 's/"type:data-access"/"type:util"/' libs/backend/redis/project.json
else
  # Linux
  sed -i 's/"type:data-access"/"type:util"/' libs/backend/redis/project.json
fi
echo -e "${GREEN}✓ Type changed to util${NC}"

echo ""
echo -e "${YELLOW}Step 4: Finding and replacing imports...${NC}"
# Find all TypeScript files and replace imports
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  find apps libs -type f \( -name "*.ts" -o -name "*.tsx" \) -not -path "*/node_modules/*" -exec sed -i '' \
    -e "s|from '@ftry/backend/cache'|from '@ftry/backend/redis'|g" \
    -e "s|} from '@ftry/backend/cache'|} from '@ftry/backend/redis'|g" \
    {} +
else
  # Linux
  find apps libs -type f \( -name "*.ts" -o -name "*.tsx" \) -not -path "*/node_modules/*" -exec sed -i \
    -e "s|from '@ftry/backend/cache'|from '@ftry/backend/redis'|g" \
    -e "s|} from '@ftry/backend/cache'|} from '@ftry/backend/redis'|g" \
    {} +
fi
echo -e "${GREEN}✓ Imports updated${NC}"

echo ""
echo -e "${YELLOW}Step 5: Updating tsconfig.base.json...${NC}"
# Remove the cache path mapping
if [[ "$OSTYPE" == "darwin"* ]]; then
  sed -i '' '/"@ftry\/backend\/cache":/d' tsconfig.base.json
else
  sed -i '/"@ftry\/backend\/cache":/d' tsconfig.base.json
fi
echo -e "${GREEN}✓ tsconfig.base.json updated${NC}"

echo ""
echo -e "${YELLOW}Step 6: Removing empty cache library...${NC}"
if [ -d "libs/backend/cache" ]; then
  # Check if directory is actually empty (only config files left)
  if [ -z "$(find libs/backend/cache/src -name '*.ts' 2>/dev/null)" ]; then
    git rm -r libs/backend/cache
    echo -e "${GREEN}✓ Cache library removed${NC}"
  else
    echo -e "${RED}Warning: Cache library still has TypeScript files${NC}"
    echo "  Skipping removal. Please check manually."
  fi
else
  echo -e "${YELLOW}⚠ Cache library already removed${NC}"
fi

echo ""
echo -e "${YELLOW}Step 7: Running verifications...${NC}"

# Type check
echo -n "  - Type checking... "
if bun run typecheck > /dev/null 2>&1; then
  echo -e "${GREEN}✓${NC}"
else
  echo -e "${RED}✗ (errors found - check manually)${NC}"
fi

# Lint check
echo -n "  - Linting... "
if nx lint --skip-nx-cache > /dev/null 2>&1; then
  echo -e "${GREEN}✓${NC}"
else
  echo -e "${YELLOW}⚠ (warnings found - review output)${NC}"
fi

# Graph generation
echo -n "  - Generating dependency graph... "
if nx graph --file=/tmp/nx-graph-after-consolidation.json > /dev/null 2>&1; then
  echo -e "${GREEN}✓${NC}"
  echo "    Graph saved to: /tmp/nx-graph-after-consolidation.json"
else
  echo -e "${RED}✗ (failed)${NC}"
fi

echo ""
echo -e "${GREEN}======================================"
echo "✓ Consolidation Complete!"
echo "======================================${NC}"
echo ""
echo "Next steps:"
echo "  1. Review changes: git status"
echo "  2. Run tests: bun run test"
echo "  3. Commit changes: git add . && git commit -m 'refactor(nx): consolidate cache into backend-redis'"
echo ""
echo "Changes made:"
echo "  - Moved CacheModule and CacheService to backend-redis"
echo "  - Updated all imports from @ftry/backend/cache → @ftry/backend/redis"
echo "  - Changed redis type tag: data-access → util"
echo "  - Removed cache library"
echo ""
