# Environment Variables

Complete reference for environment variables in ftry application.

**Last Updated**: 2025-10-11

## Quick Start

```bash
# Copy example file
cp .env.example .env

# Generate secure secrets
openssl rand -base64 64  # For JWT_SECRET
openssl rand -base64 64  # For CSRF_SECRET
```

## Database

### DATABASE_URL

**Required**: Yes | **Type**: PostgreSQL connection string

```bash
# Development
DATABASE_URL="postgresql://ftry:ftry@localhost:5432/ftry"

# Production
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require&connection_limit=10&pool_timeout=20"
```

**Important**: Include `sslmode=require` for cloud databases, set `connection_limit=10` to prevent pool exhaustion.

## Authentication & Security

### JWT_SECRET

**Required**: Yes | **Type**: String (base64) | **Min Length**: 32 characters

**Generate**:

```bash
openssl rand -base64 64
```

**Security**:

- ⚠️ NEVER use default in production
- ⚠️ NEVER commit to version control
- ⚠️ Rotate quarterly

### JWT_ACCESS_TOKEN_EXPIRY

**Required**: No | **Default**: `15m`

**Format**: `<number><unit>` (s=seconds, m=minutes, h=hours, d=days)

**Examples**:

```bash
JWT_ACCESS_TOKEN_EXPIRY="15m"   # Recommended for production
JWT_ACCESS_TOKEN_EXPIRY="1h"    # Development only
```

**Recommendation**: Never exceed `1h` for security.

### JWT_REFRESH_TOKEN_EXPIRY

**Required**: No | **Default**: `7d`

**Examples**:

```bash
JWT_REFRESH_TOKEN_EXPIRY="7d"   # Web apps
JWT_REFRESH_TOKEN_EXPIRY="30d"  # Mobile apps
```

**Recommendation**: Never exceed `90d`.

### CSRF_SECRET

**Required**: Yes | **Type**: String (base64) | **Min Length**: 32 characters

**Generate**:

```bash
openssl rand -base64 64
```

**Important**: Different from JWT_SECRET, rotate when JWT_SECRET is rotated.

## Redis (Caching)

### REDIS_HOST

**Required**: Yes (if using Redis) | **Default**: `localhost`

```bash
REDIS_HOST="localhost"                                    # Development
REDIS_HOST="redis-17992.redns.redis-cloud.com"           # Production
```

### REDIS_PORT

**Required**: Yes (if using Redis) | **Default**: `6379`

### REDIS_PASSWORD

**Required**: Yes (for production) | **Type**: String

**Security**: Always set in production, NEVER commit to version control.

### REDIS_TTL

**Required**: No | **Default**: `300` (5 minutes) | **Type**: Integer (seconds)

**Important**: Must be LESS than `JWT_ACCESS_TOKEN_EXPIRY`.

## Application

### NODE_ENV

**Required**: Yes | **Default**: `development`
**Type**: Enum: `development` | `production` | `test`

**Effects**:

- `development`: Detailed logging, relaxed CORS, debug mode
- `production`: Minimal logging, strict CORS, optimizations
- `test`: Test-specific configuration

### PORT

**Required**: No | **Default**: `3001` (backend), `4200` (frontend)

### FRONTEND_URL

**Required**: Yes | **Default**: `http://localhost:4200`

```bash
FRONTEND_URL="http://localhost:4200"              # Development
FRONTEND_URL="https://app.ftry.com"               # Production
```

**Important**: Must match actual frontend URL for CORS.

### VITE_API_URL

**Required**: Yes (frontend) | **Default**: `http://localhost:3001/api`

```bash
VITE_API_URL="http://localhost:3001/api"          # Development
VITE_API_URL="https://api.ftry.com/api"           # Production
```

**Note**: Vite requires `VITE_` prefix for frontend-accessible variables.

## Monitoring (Grafana Cloud)

### GRAFANA_CLOUD_ENABLED

**Required**: No | **Default**: `false` | **Type**: Boolean string

### GRAFANA_CLOUD_OTLP_ENDPOINT

**Required**: Yes (if enabled) | **Type**: URL string

```bash
GRAFANA_CLOUD_OTLP_ENDPOINT="https://otlp-gateway-prod-ap-south-1.grafana.net"
```

### GRAFANA_CLOUD_INSTANCE_ID

**Required**: Yes (if enabled) | **Type**: String (numeric)

### GRAFANA_CLOUD_API_TOKEN

**Required**: Yes (if enabled) | **Type**: String (Bearer token)

**Security**: NEVER commit to version control, rotate if compromised.

### GRAFANA_CLOUD_ZONE

**Required**: Yes (if enabled) | **Type**: String

```bash
GRAFANA_CLOUD_ZONE="prod-ap-south-1"      # Asia Pacific
GRAFANA_CLOUD_ZONE="prod-us-east-0"       # US East
```

## Development Only

### DEMO_PASSWORD

**Required**: No | **Default**: `DevPassword123!@#`

**Usage**: Password for demo users created by `prisma/seed.ts`.

**Security**: ⚠️ NEVER use in production, only for local development.

### DEVELOPER_NAME

**Required**: No | **Type**: String

**Usage**: Developer identifier for telemetry and logging.

## Checklists

### Development Setup

```bash
# Required
- [ ] DATABASE_URL (local PostgreSQL)
- [ ] JWT_SECRET (generate with openssl)
- [ ] CSRF_SECRET (generate with openssl)

# Optional (recommended)
- [ ] NODE_ENV=development
- [ ] FRONTEND_URL=http://localhost:4200
- [ ] VITE_API_URL=http://localhost:3001/api
```

### Production Setup

```bash
# Critical
- [ ] DATABASE_URL (with SSL and pooling)
- [ ] JWT_SECRET (strong, unique, never default)
- [ ] CSRF_SECRET (strong, unique, different from JWT)
- [ ] NODE_ENV=production
- [ ] FRONTEND_URL (HTTPS)
- [ ] VITE_API_URL (HTTPS)

# Monitoring (recommended)
- [ ] GRAFANA_CLOUD_ENABLED=true
- [ ] GRAFANA_CLOUD_OTLP_ENDPOINT
- [ ] GRAFANA_CLOUD_INSTANCE_ID
- [ ] GRAFANA_CLOUD_API_TOKEN
- [ ] GRAFANA_CLOUD_ZONE
```

## Validation

Environment variables are validated on startup using Zod schema in `apps/backend/src/config/env.validation.ts`.

**Validation Rules**:

- JWT_SECRET: minimum 32 characters
- CSRF_SECRET: minimum 32 characters
- DATABASE_URL: valid PostgreSQL URL
- JWT_ACCESS_TOKEN_EXPIRY: valid time format
- NODE_ENV: must be 'development', 'production', or 'test'

**Startup Behavior**:

- ✅ All required variables present → Application starts
- ❌ Missing required variables → Application fails with detailed error
- ⚠️ Invalid format → Application fails with validation error

## Security Best Practices

### Secret Generation

```bash
# Generate strong secrets
openssl rand -base64 64 > jwt_secret.txt
openssl rand -base64 64 > csrf_secret.txt
```

### Secret Storage

- ✅ Use `.env` file (gitignored)
- ✅ Use secret management services (AWS Secrets Manager, Vault)
- ❌ NEVER commit `.env` to version control
- ❌ NEVER hardcode secrets in code
- ❌ NEVER share secrets via email/Slack

### Secret Rotation

**Frequency**:

- JWT_SECRET: Quarterly
- CSRF_SECRET: Quarterly (with JWT)
- REDIS_PASSWORD: Annually
- GRAFANA_CLOUD_API_TOKEN: Annually or if compromised

**Process**:

1. Generate new secret
2. Update environment variables
3. Deploy new version
4. Monitor for errors
5. Document rotation date

## Troubleshooting

### Application Won't Start

**Error**: "JWT_SECRET is required"
**Solution**: Add JWT_SECRET to .env file

**Error**: "Database connection failed"
**Solution**: Verify DATABASE_URL and database is running

### Authentication Not Working

**Issue**: 401 Unauthorized errors
**Check**:

1. JWT_SECRET matches between environments
2. JWT token expiry is appropriate
3. System time is synchronized

### CSRF Errors

**Issue**: 403 Forbidden on POST requests
**Check**:

1. CSRF_SECRET is set
2. FRONTEND_URL matches actual frontend domain
3. Cookies are being sent (credentials: 'include')

## Related Documentation

- [Authentication Guide](./authentication)
- [Database Setup](../architecture/database)
- [Frontend API Integration](./frontend-api-integration)
