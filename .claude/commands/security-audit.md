---
description: Perform comprehensive security audit across the entire application stack
---

Deploy security specialists to identify and fix vulnerabilities in your application:

**Security Audit Team (coordinated execution):**

1. **backend-expert** (Priority 1):
   - Authentication/authorization implementation
   - JWT token security and rotation
   - Password hashing and storage
   - API rate limiting
   - Input validation and sanitization
   - SQL injection prevention
   - CORS configuration

2. **database-expert** (Priority 1):
   - Data encryption at rest
   - Connection security
   - Access control and permissions
   - Sensitive data exposure
   - Backup security
   - Audit logging

3. **frontend-specialist** (Priority 2):
   - XSS vulnerability scanning
   - CSRF protection
   - Secure cookie handling
   - Content Security Policy
   - Third-party dependency vulnerabilities
   - Client-side data validation

4. **api-standardizer** (Priority 2):
   - API authentication patterns
   - Error message information leakage
   - Rate limiting implementation
   - Request/response validation
   - OpenAPI security definitions

5. **senior-architect** (Priority 3):
   - Overall security architecture review
   - Compliance requirements (GDPR, PCI)
   - Security best practices alignment
   - Threat modeling
   - Incident response planning

The audit produces:

- Critical vulnerabilities (P0) requiring immediate fix
- High-risk issues (P1) to address before production
- Medium-risk issues (P2) for next sprint
- Security checklist for ongoing development
- Compliance assessment for Indian market

Output includes specific fixes with code examples and security testing recommendations.

Usage: `/security-audit [full|api|auth|data]`
