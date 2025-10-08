---
description: Visualize Nx dependency graph and affected projects
---

Visualize the Nx project dependency graph, analyze affected projects, and understand monorepo architecture.

## Usage

```bash
# Interactive project graph (opens in browser)
/nx-graph

# Show only affected projects
/nx-graph affected

# Focus on specific project
/nx-graph focus frontend

# Show critical path
/nx-graph critical-path

# Export graph as JSON
/nx-graph export

# Analyze circular dependencies
/nx-graph circular
```

## What It Does

### Interactive Graph

```bash
nx graph
# Opens http://localhost:4211
```

**Features:**

- Visual dependency graph
- Click to explore projects
- Filter by type/scope
- Search projects
- Zoom and pan
- Export as image

### Affected Analysis

```bash
nx affected:graph
```

**Shows:**

- Projects changed since base branch
- Downstream dependencies affected
- Test/build targets to run
- Deployment impact

## Graph Views

### Full Project Graph

**Shows all projects:**

- Applications (circles)
- Libraries (rectangles)
- Dependencies (arrows)
- Tags and scopes (colors)

**Use for:**

- Understanding architecture
- Planning refactoring
- Identifying bottlenecks
- Finding circular deps

### Affected Graph

**Shows only changed:**

- Modified projects (highlighted)
- Dependent projects (connected)
- Tasks to run (targets)

**Use for:**

- CI/CD optimization
- Testing strategy
- Deployment planning
- Impact analysis

### Task Graph

**Shows task dependencies:**

- Build order
- Test dependencies
- Parallel execution
- Critical path

**Use for:**

- Build optimization
- Parallel execution
- Understanding caching
- Performance tuning

## Project Structure Visualization

### By Scope

```
frontend scope:
  ├── apps/frontend
  └── libs/frontend/*

backend scope:
  ├── apps/backend
  └── libs/backend/*

shared scope:
  └── libs/shared/*
```

### By Type

```
feature libraries:
  ├── libs/frontend/feature-*
  └── libs/backend/feature-*

ui libraries:
  └── libs/frontend/ui-*

data-access libraries:
  ├── libs/frontend/data-access
  └── libs/backend/data-access

util libraries:
  └── libs/shared/util-*
```

## Dependency Analysis

### Valid Dependencies

```mermaid
feature → ui
feature → data-access
feature → util
ui → util
data-access → util
```

### Invalid Dependencies (Blocked by ESLint)

```mermaid
ui → feature ❌
util → data-access ❌
data-access → feature ❌
```

## Use Cases

### Planning New Feature

```bash
# 1. Visualize current graph
/nx-graph

# 2. Plan new library placement
/use-agent nx-specialist

# 3. Create library
/add-library feature appointments booking

# 4. Verify new structure
/nx-graph focus appointments
```

### Refactoring

```bash
# 1. Identify circular dependencies
/nx-graph circular

# 2. Analyze affected projects
/nx-graph affected

# 3. Plan extraction
/use-agent module-boundaries

# 4. Verify after refactor
/nx-graph
```

### CI/CD Optimization

```bash
# 1. See affected projects
/nx-graph affected

# 2. Analyze critical path
/nx-graph critical-path

# 3. Optimize parallelization
# Run independent tasks in parallel

# 4. Cache computation
nx run-many --target=test --parallel=3
```

### Debugging Build Issues

```bash
# 1. Visualize task graph
/nx-graph task-graph build

# 2. Find dependency issues
/nx-graph circular

# 3. Check module boundaries
/use-agent module-boundaries

# 4. Fix and verify
/nx-graph affected
```

## Graph Insights

### Healthy Architecture

- **Layered**: Clear separation by type
- **Acyclic**: No circular dependencies
- **Focused**: Libraries have single responsibility
- **Bounded**: Proper tag enforcement
- **Balanced**: Not too many/too few libraries

### Warning Signs

- **Circular dependencies**: Refactor needed
- **Too many dependencies**: Library too large
- **No dependencies**: Might not be needed
- **Wrong direction**: Violates layer rules
- **Orphaned libraries**: Dead code

## Nx Tags Visualization

### Scope Tags

- `scope:frontend` - Blue
- `scope:backend` - Green
- `scope:shared` - Orange

### Type Tags

- `type:app` - Circle (large)
- `type:feature` - Square (medium)
- `type:ui` - Rounded square
- `type:data-access` - Diamond
- `type:util` - Small circle

### Custom Tags

- `platform:web` - Web-specific
- `platform:mobile` - Mobile (future)
- `domain:appointments` - Business domain
- `domain:billing` - Business domain

## Affected Detection

### How It Works

```bash
# Compare against base branch
nx affected:graph --base=main --head=HEAD

# Shows projects with:
# 1. Direct file changes
# 2. Dependency changes (package.json)
# 3. Downstream dependencies
```

### Use in CI/CD

```yaml
# GitHub Actions
- name: Test affected
  run: nx affected --target=test --base=origin/main

- name: Build affected
  run: nx affected --target=build --base=origin/main
```

## Performance Optimization

### Computation Caching

**Nx caches:**

- Task results
- Test outputs
- Build artifacts

**Cache invalidation:**

- File changes
- Dependency changes
- Task input changes

### Parallel Execution

```bash
# Run 3 tasks in parallel
nx run-many --target=test --all --parallel=3

# Automatic parallelization
nx affected --target=build --parallel=3
```

## Integration with Agents

### Analyze with Agents

```bash
# Architectural review
/use-agent senior-architect
# Then run /nx-graph for visual confirmation

# Module boundary issues
/use-agent module-boundaries
# Then /nx-graph circular to verify

# Nx-specific guidance
/use-agent nx-specialist
# Then /nx-graph to plan changes
```

## Export Options

### JSON Export

```bash
nx graph --file=graph.json
```

**Contains:**

- All projects
- Dependencies
- Tags
- Metadata

**Use for:**

- Custom analysis
- Automation
- Reporting
- Documentation

### Image Export

```bash
# From web UI
# Click "Export" → Download PNG
```

**Use for:**

- Documentation
- Presentations
- Architecture reviews
- Onboarding

## Common Patterns

### Adding New Domain

```bash
# 1. Visualize current state
/nx-graph

# 2. Plan structure
# appointments/
#   ├── feature-booking
#   ├── feature-calendar
#   └── data-access

# 3. Create libraries
/add-library feature appointments booking
/add-library feature appointments calendar
/add-library data-access appointments

# 4. Verify structure
/nx-graph focus appointments
```

### Extracting Shared Code

```bash
# 1. Identify duplication
/use-agent code-duplication-detector

# 2. Plan extraction
/nx-graph  # See current dependencies

# 3. Create shared library
/add-library util shared validation

# 4. Verify new structure
/nx-graph
```

## Technology Stack

- **Nx**: 21.6.3
- **Visualization**: D3.js (via Nx)
- **Server**: Express (graph server)
- **Export**: JSON, PNG

## Configuration

**nx.json:**

```json
{
  "affected": {
    "defaultBase": "main"
  },
  "tasksRunnerOptions": {
    "default": {
      "runner": "nx/tasks-runners/default",
      "options": {
        "cacheableOperations": ["build", "test", "lint"]
      }
    }
  }
}
```

## See Also

- `/add-library` - Create new Nx library
- `/use-agent nx-specialist` - Nx architecture guidance
- `/use-agent module-boundaries` - Dependency analysis
- `.nx/NX_ARCHITECTURE.md` - Monorepo standards
- `docs/ARCHITECTURE.md` - System architecture
