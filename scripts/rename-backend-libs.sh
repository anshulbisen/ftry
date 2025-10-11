#!/bin/bash
# rename-backend-libs.sh
#
# Renames backend libraries to include 'backend-' prefix for consistency
#
# Renames:
#   admin → backend-admin
#   health → backend-health
#   monitoring → backend-monitoring
#   queue → backend-queue
#   redis → backend-redis (if not already renamed)

set -e

echo "======================================"
echo "Backend Library Rename Script"
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

# Libraries to rename (old:new format)
LIBS=(
  "admin:backend-admin"
  "health:backend-health"
  "monitoring:backend-monitoring"
  "queue:backend-queue"
)

# Check if redis exists (might already be renamed in consolidation script)
if [ -d "libs/backend/redis" ]; then
  LIBS+=("redis:backend-redis")
fi

echo "Libraries to rename: ${#LIBS[@]}"
echo ""

for lib in "${LIBS[@]}"; do
  OLD="${lib%%:*}"
  NEW="${lib##*:}"

  echo -e "${YELLOW}Processing: $OLD → $NEW${NC}"

  # Step 1: Rename directory
  if [ -d "libs/backend/$OLD" ]; then
    echo "  - Moving directory..."
    git mv "libs/backend/$OLD" "libs/backend/$NEW"
    echo -e "    ${GREEN}✓ Directory moved${NC}"
  else
    echo -e "    ${YELLOW}⚠ Directory not found (already renamed?)${NC}"
    continue
  fi

  # Step 2: Update project.json name field
  if [ -f "libs/backend/$NEW/project.json" ]; then
    echo "  - Updating project.json..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
      sed -i '' "s/\"name\": \"$OLD\"/\"name\": \"$NEW\"/" "libs/backend/$NEW/project.json"
    else
      sed -i "s/\"name\": \"$OLD\"/\"name\": \"$NEW\"/" "libs/backend/$NEW/project.json"
    fi
    echo -e "    ${GREEN}✓ project.json updated${NC}"
  fi

  # Step 3: Update tsconfig.base.json path mapping
  echo "  - Updating tsconfig.base.json..."
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # Replace old path mapping with new one
    sed -i '' \
      -e "s|\"$OLD\": \\[\"libs/backend/$OLD/src/index.ts\"\\]|\"@ftry/backend/$OLD\": [\"libs/backend/$NEW/src/index.ts\"]|" \
      -e "s|\"@ftry/backend/$OLD\": \\[\"libs/backend/$OLD/src/index.ts\"\\]|\"@ftry/backend/$OLD\": [\"libs/backend/$NEW/src/index.ts\"]|" \
      tsconfig.base.json
  else
    sed -i \
      -e "s|\"$OLD\": \\[\"libs/backend/$OLD/src/index.ts\"\\]|\"@ftry/backend/$OLD\": [\"libs/backend/$NEW/src/index.ts\"]|" \
      -e "s|\"@ftry/backend/$OLD\": \\[\"libs/backend/$OLD/src/index.ts\"\\]|\"@ftry/backend/$OLD\": [\"libs/backend/$NEW/src/index.ts\"]|" \
      tsconfig.base.json
  fi
  echo -e "    ${GREEN}✓ tsconfig.base.json updated${NC}"

  # Step 4: Update imports across codebase
  echo "  - Updating imports..."
  if [[ "$OSTYPE" == "darwin"* ]]; then
    find apps libs -type f \( -name "*.ts" -o -name "*.tsx" \) -not -path "*/node_modules/*" -exec sed -i '' \
      -e "s|from '$OLD'|from '@ftry/backend/$OLD'|g" \
      -e "s|} from '$OLD'|} from '@ftry/backend/$OLD'|g" \
      -e "s|from \"$OLD\"|from \"@ftry/backend/$OLD\"|g" \
      -e "s|} from \"$OLD\"|} from \"@ftry/backend/$OLD\"|g" \
      {} +
  else
    find apps libs -type f \( -name "*.ts" -o -name "*.tsx" \) -not -path "*/node_modules/*" -exec sed -i \
      -e "s|from '$OLD'|from '@ftry/backend/$OLD'|g" \
      -e "s|} from '$OLD'|} from '@ftry/backend/$OLD'|g" \
      -e "s|from \"$OLD\"|from \"@ftry/backend/$OLD\"|g" \
      -e "s|} from \"$OLD\"|} from \"@ftry/backend/$OLD\"|g" \
      {} +
  fi
  echo -e "    ${GREEN}✓ Imports updated${NC}"

  echo ""
done

echo -e "${YELLOW}Running verifications...${NC}"

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
if nx graph --file=/tmp/nx-graph-after-rename.json > /dev/null 2>&1; then
  echo -e "${GREEN}✓${NC}"
  echo "    Graph saved to: /tmp/nx-graph-after-rename.json"
else
  echo -e "${RED}✗ (failed)${NC}"
fi

echo ""
echo -e "${GREEN}======================================"
echo "✓ Rename Complete!"
echo "======================================${NC}"
echo ""
echo "Libraries renamed:"
for lib in "${LIBS[@]}"; do
  echo "  - ${lib%%:*} → ${lib##*:}"
done
echo ""
echo "Next steps:"
echo "  1. Review changes: git status"
echo "  2. Run tests: bun run test"
echo "  3. Commit changes: git add . && git commit -m 'refactor(nx): rename backend libraries for consistency'"
echo ""
