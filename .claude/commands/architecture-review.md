---
description: Conduct deep architectural review with senior specialists for strategic decisions
---

Deploy senior architecture specialists to review and guide your system design:

**Architecture Review Board (sequential deep analysis):**

**Phase 1 - Current State Assessment:**

1. **senior-architect**: Overall architecture evaluation
   - System design patterns
   - Scalability assessment
   - Technical debt analysis
   - Business alignment review

2. **nx-specialist**: Monorepo architecture review
   - Library organization
   - Module boundaries
   - Build optimization
   - Dependency graph analysis

3. **module-boundaries**: Dependency analysis
   - Circular dependency detection
   - Module coupling assessment
   - Tag enforcement review

**Phase 2 - Domain Analysis (parallel):** 4. **frontend-specialist**: Frontend architecture

- Component hierarchy
- State management strategy
- Routing architecture
- Performance patterns

5. **backend-expert**: Backend architecture
   - Service layer design
   - API architecture
   - Microservices readiness
   - Security architecture

6. **database-expert**: Data architecture
   - Schema design review
   - Multi-tenancy strategy
   - Scaling considerations
   - Backup/recovery planning

**Phase 3 - Strategic Recommendations:** 7. **senior-architect**: Architectural roadmap

- Short-term improvements
- Long-term evolution
- Technology migrations
- Risk assessment

The review produces:

- Architectural Decision Records (ADRs)
- Technical debt prioritization
- Scalability roadmap (0-100-1000+ clients)
- Module restructuring plan
- Technology upgrade recommendations
- Security architecture assessment
- Performance architecture review
- Cost optimization opportunities

Output includes:

- Executive summary with scores
- Detailed findings by domain
- Prioritized action items
- Architecture diagrams
- Migration strategies
- Risk mitigation plans

Usage: `/architecture-review [full|frontend|backend|data|security]`
