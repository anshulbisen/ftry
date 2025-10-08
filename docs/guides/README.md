# Guides

Essential documentation for daily development.

## Available Guides

### Authentication & Security

- **[Authentication Guide](./AUTHENTICATION.md)**
  - Complete authentication and authorization implementation
  - HTTP-only cookie authentication with CSRF protection
  - JWT tokens with refresh token rotation
  - Role-based access control (RBAC)
  - Row-level security (RLS) enforcement
  - Account lockout and security features

- **[Frontend API Integration](./FRONTEND_API_INTEGRATION.md)**
  - Frontend development guide for API integration
  - API client usage and patterns
  - CSRF token management
  - Authentication hooks (`useAuth`)
  - Error handling strategies
  - Best practices and security considerations

### Database

- **[Database Quick Reference](./DATABASE_QUICK_REFERENCE.md)**
  - Quick reference for common database operations
  - Prisma commands and examples
  - Query patterns and best practices
  - Migration tips and tricks

- **[Backup & Restore Guide](./BACKUP_RESTORE_GUIDE.md)**
  - Database backup and recovery procedures
  - Automated daily backup strategy
  - Manual backup procedures
  - Point-in-time recovery (PITR)
  - Disaster recovery planning

## Guide Categories

### By Skill Level

**Beginner**

- Start with [Frontend API Integration](./FRONTEND_API_INTEGRATION.md) for API usage
- Review [Database Quick Reference](./DATABASE_QUICK_REFERENCE.md) for common commands

**Intermediate**

- Deep dive into [Authentication Guide](./AUTHENTICATION.md) for security implementation
- Learn backup strategies in [Backup & Restore Guide](./BACKUP_RESTORE_GUIDE.md)

**Advanced**

- Review architecture docs in `../architecture/`
- Explore migration guides in `../migration/`

### By Role

**Frontend Developers**

1. [Frontend API Integration](./FRONTEND_API_INTEGRATION.md)
2. [Authentication Guide](./AUTHENTICATION.md) (authentication flows)

**Backend Developers**

1. [Authentication Guide](./AUTHENTICATION.md) (complete implementation)
2. [Database Quick Reference](./DATABASE_QUICK_REFERENCE.md)
3. [Backup & Restore Guide](./BACKUP_RESTORE_GUIDE.md)

**DevOps Engineers**

1. [Backup & Restore Guide](./BACKUP_RESTORE_GUIDE.md)
2. [Database Quick Reference](./DATABASE_QUICK_REFERENCE.md)

## Related Documentation

- **[Architecture](../architecture/)** - System design and technical decisions
- **[Operations](../operations/)** - DevOps and infrastructure
- **[Migration](../migration/)** - Migration guides for major changes
- **[Development](../development/)** - Project planning and roadmap

## Need Help?

1. Check the relevant guide above
2. Review [CLAUDE.md](../../CLAUDE.md) for development standards
3. Search the repository for similar issues
4. Create a new issue with details

---

**Last Updated**: 2025-10-08
