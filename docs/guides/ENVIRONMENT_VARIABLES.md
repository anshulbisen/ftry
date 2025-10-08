# Environment Variables Reference

**Last Updated**: 2025-10-08
**Status**: Complete Reference

Complete reference for all environment variables used in the ftry application.

## Quick Start

```bash
# Copy example file
cp .env.example .env

# Generate secure secrets
openssl rand -base64 64  # For JWT_SECRET
openssl rand -base64 64  # For CSRF_SECRET
```

## Database Configuration

### DATABASE_URL

**Required**: Yes
**Type**: PostgreSQL connection string
**Default**: None
**Example**: `postgresql://user:password@host:5432/database`

**Description**: PostgreSQL database connection URL. Must include authentication credentials.

**Development**:

```bash
DATABASE_URL="postgresql://ftry:ftry@localhost:5432/ftry"
```

**Production**:

```bash
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require&connection_limit=10&pool_timeout=20"
```

**Important**:

- Include `sslmode=require` for cloud databases (Neon, AWS RDS)
- Set `connection_limit=10` to prevent connection pool exhaustion
- Set `pool_timeout=20` for connection retry timeout

---

## Authentication & Security

### JWT_SECRET

**Required**: Yes
**Type**: String (base64)
**Default**: None (fails if not set)
**Minimum Length**: 32 characters

**Description**: Secret key used to sign and verify JWT access tokens.

**Generate**:

```bash
openssl rand -base64 64
```

**Example**:

```bash
JWT_SECRET="8a7f6e5d4c3b2a1f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f"
```

**Security**:

- ⚠️ NEVER use default in production
- ⚠️ NEVER commit to version control
- ⚠️ Rotate quarterly
- ⚠️ Use environment-specific secrets

---

### JWT_ACCESS_TOKEN_EXPIRY

**Required**: No
**Type**: String (time format)
**Default**: `15m`

**Description**: Access token expiration time. Short-lived for security.

**Format**: `<number><unit>` where unit is:

- `s` - seconds
- `m` - minutes
- `h` - hours
- `d` - days

**Examples**:

```bash
JWT_ACCESS_TOKEN_EXPIRY="15m"   # 15 minutes (recommended)
JWT_ACCESS_TOKEN_EXPIRY="1h"    # 1 hour (for development)
JWT_ACCESS_TOKEN_EXPIRY="30m"   # 30 minutes
```

**Recommendations**:

- Development: `15m` to `1h`
- Production: `15m` (security best practice)
- Never exceed `1h` for security reasons

---

### JWT_REFRESH_TOKEN_EXPIRY

**Required**: No
**Type**: String (time format)
**Default**: `7d`

**Description**: Refresh token expiration time. Long-lived for user convenience.

**Examples**:

```bash
JWT_REFRESH_TOKEN_EXPIRY="7d"   # 7 days (recommended)
JWT_REFRESH_TOKEN_EXPIRY="30d"  # 30 days (for mobile apps)
JWT_REFRESH_TOKEN_EXPIRY="14d"  # 14 days
```

**Recommendations**:

- Web apps: `7d` to `14d`
- Mobile apps: `30d` to `90d`
- Never exceed `90d` for security

---

### CSRF_SECRET

**Required**: Yes
**Type**: String (base64)
**Default**: None (fails if not set)
**Minimum Length**: 32 characters

**Description**: Secret key for CSRF token generation using Double Submit Cookie pattern.

**Generate**:

```bash
openssl rand -base64 64
```

**Example**:

```bash
CSRF_SECRET="qVAsTKxtlf91hLj75aq3Eab3+Cgq1tXO988cxm5SHheemVpOOjOBOFjE3hzRUdTqOVtNyOTh87WLiIc64U9lCA=="
```

**Security**:

- ⚠️ NEVER use default in production
- ⚠️ Different from JWT_SECRET
- ⚠️ Rotate when JWT_SECRET is rotated

---

## Redis Configuration

### REDIS_HOST

**Required**: Yes (if using Redis)
**Type**: String (hostname or IP)
**Default**: `localhost`

**Examples**:

```bash
REDIS_HOST="localhost"                                    # Development
REDIS_HOST="redis-17992.redns.redis-cloud.com"           # Redis Cloud
```

---

### REDIS_PORT

**Required**: Yes (if using Redis)
**Type**: Integer
**Default**: `6379`

**Examples**:

```bash
REDIS_PORT=6379                   # Default
REDIS_PORT=17992                  # Redis Cloud custom port
```

---

### REDIS_PASSWORD

**Required**: Yes (for production)
**Type**: String
**Default**: None

**Examples**:

```bash
REDIS_PASSWORD="your-redis-password"
```

**Security**:

- ⚠️ Always set in production
- ⚠️ NEVER commit to version control

---

### REDIS_USERNAME

**Required**: No
**Type**: String
**Default**: `default`

**Description**: Redis username for ACL authentication (Redis 6+).

**Examples**:

```bash
REDIS_USERNAME="default"
REDIS_USERNAME="ftry-app"
```

---

### REDIS_DB

**Required**: No
**Type**: Integer (0-15)
**Default**: `0`

**Description**: Redis database number to use.

**Examples**:

```bash
REDIS_DB=0    # Default database
REDIS_DB=1    # Separate database for testing
```

---

### REDIS_TTL

**Required**: No
**Type**: Integer (seconds)
**Default**: `300` (5 minutes)

**Description**: Default TTL (Time To Live) for cached values.

**Examples**:

```bash
REDIS_TTL=300      # 5 minutes (default)
REDIS_TTL=900      # 15 minutes
REDIS_TTL=60       # 1 minute (for frequently changing data)
```

**Important**: Must be LESS than `JWT_ACCESS_TOKEN_EXPIRY` to ensure cached user data expires before JWT token.

---

## Application Configuration

### NODE_ENV

**Required**: Yes
**Type**: Enum: `development` | `production` | `test`
**Default**: `development`

**Description**: Application environment.

**Effects**:

- `development`: Detailed logging, CORS relaxed, debug mode
- `production`: Minimal logging, strict CORS, optimizations enabled
- `test`: Test-specific configuration

**Examples**:

```bash
NODE_ENV="development"    # Local development
NODE_ENV="production"     # Production deployment
NODE_ENV="test"           # Running tests
```

---

### PORT

**Required**: No
**Type**: Integer
**Default**: `3001` (backend), `4200` (frontend via Nx)

**Description**: Port for backend server.

**Examples**:

```bash
PORT=3001    # Default backend port
PORT=8080    # Alternative port
```

---

### FRONTEND_URL

**Required**: Yes
**Type**: URL string
**Default**: `http://localhost:4200`

**Description**: Frontend application URL for CORS and redirects.

**Examples**:

```bash
FRONTEND_URL="http://localhost:4200"              # Development
FRONTEND_URL="https://app.ftry.com"               # Production
```

**Important**: Must match actual frontend URL for CORS to work.

---

## Frontend Configuration

### VITE_API_URL

**Required**: Yes (frontend)
**Type**: URL string
**Default**: `http://localhost:3001/api`

**Description**: Backend API base URL for frontend requests.

**Examples**:

```bash
VITE_API_URL="http://localhost:3001/api"          # Development
VITE_API_URL="https://api.ftry.com/api"           # Production
```

**Important**: Vite requires `VITE_` prefix for environment variables accessible in frontend code.

---

## Monitoring (Grafana Cloud)

### GRAFANA_CLOUD_ENABLED

**Required**: No
**Type**: Boolean string
**Default**: `false`

**Examples**:

```bash
GRAFANA_CLOUD_ENABLED=true     # Enable telemetry
GRAFANA_CLOUD_ENABLED=false    # Disable telemetry
```

---

### GRAFANA_CLOUD_OTLP_ENDPOINT

**Required**: Yes (if Grafana enabled)
**Type**: URL string
**Default**: None

**Description**: OpenTelemetry endpoint for Grafana Cloud.

**Examples**:

```bash
GRAFANA_CLOUD_OTLP_ENDPOINT="https://otlp-gateway-prod-ap-south-1.grafana.net"
```

---

### GRAFANA_CLOUD_INSTANCE_ID

**Required**: Yes (if Grafana enabled)
**Type**: String (numeric)
**Default**: None

**Examples**:

```bash
GRAFANA_CLOUD_INSTANCE_ID="823734"
```

---

### GRAFANA_CLOUD_API_TOKEN

**Required**: Yes (if Grafana enabled)
**Type**: String (Bearer token)
**Default**: None

**Examples**:

```bash
GRAFANA_CLOUD_API_TOKEN="glc_eyJvIjoiMTAyMjI3MiIsIm4iOiJmdHJ5..."
```

**Security**:

- ⚠️ NEVER commit to version control
- ⚠️ Rotate if compromised

---

### GRAFANA_CLOUD_ZONE

**Required**: Yes (if Grafana enabled)
**Type**: String
**Default**: None

**Description**: Grafana Cloud zone/region.

**Examples**:

```bash
GRAFANA_CLOUD_ZONE="prod-ap-south-1"      # Asia Pacific
GRAFANA_CLOUD_ZONE="prod-us-east-0"       # US East
```

---

### DEVELOPER_NAME

**Required**: No
**Type**: String
**Default**: None

**Description**: Developer identifier for telemetry and logging.

**Examples**:

```bash
DEVELOPER_NAME="anshul"
```

---

## Development Only

### DEMO_PASSWORD

**Required**: No (development only)
**Type**: String
**Default**: `DevPassword123!@#`

**Description**: Password used for demo users created by `prisma/seed.ts`.

**Examples**:

```bash
DEMO_PASSWORD="DevPassword123!@#"
```

**Security**:

- ⚠️ NEVER use in production
- ⚠️ Only for local development and seeding

---

## Environment Variables Checklist

### Development Setup

```bash
# Required
- [ ] DATABASE_URL (local PostgreSQL)
- [ ] JWT_SECRET (generate with openssl)
- [ ] CSRF_SECRET (generate with openssl)

# Optional (recommended)
- [ ] REDIS_HOST (if using Redis)
- [ ] REDIS_PORT
- [ ] REDIS_PASSWORD
- [ ] NODE_ENV=development
- [ ] FRONTEND_URL=http://localhost:4200
- [ ] VITE_API_URL=http://localhost:3001/api
```

### Production Setup

```bash
# Critical
- [ ] DATABASE_URL (with SSL and connection pooling)
- [ ] JWT_SECRET (strong, unique, never default)
- [ ] CSRF_SECRET (strong, unique, different from JWT)
- [ ] REDIS_HOST (production Redis instance)
- [ ] REDIS_PORT
- [ ] REDIS_PASSWORD (strong password)
- [ ] NODE_ENV=production
- [ ] FRONTEND_URL (production domain with HTTPS)
- [ ] VITE_API_URL (production API with HTTPS)

# Monitoring (recommended)
- [ ] GRAFANA_CLOUD_ENABLED=true
- [ ] GRAFANA_CLOUD_OTLP_ENDPOINT
- [ ] GRAFANA_CLOUD_INSTANCE_ID
- [ ] GRAFANA_CLOUD_API_TOKEN
- [ ] GRAFANA_CLOUD_ZONE

# Optional
- [ ] PORT (if not using default 3001)
- [ ] DEVELOPER_NAME
```

---

## Validation

Environment variables are validated on application startup using Zod schema in `apps/backend/src/config/env.validation.ts`.

**Validation Rules**:

- JWT_SECRET: minimum 32 characters
- CSRF_SECRET: minimum 32 characters
- DATABASE_URL: valid PostgreSQL URL format
- JWT_ACCESS_TOKEN_EXPIRY: valid time format
- JWT_REFRESH_TOKEN_EXPIRY: valid time format
- NODE_ENV: must be 'development', 'production', or 'test'

**Startup Behavior**:

- ✅ All required variables present → Application starts
- ❌ Missing required variables → Application fails with detailed error message
- ⚠️ Invalid format → Application fails with validation error

**Example Error**:

```
Error: Environment validation failed:
  - JWT_SECRET is required
  - CSRF_SECRET must be at least 32 characters
  - DATABASE_URL must be a valid PostgreSQL URL
```

---

## Security Best Practices

### 1. Secret Generation

```bash
# Generate strong secrets
openssl rand -base64 64 > jwt_secret.txt
openssl rand -base64 64 > csrf_secret.txt

# Copy to .env (never commit these files)
```

### 2. Secret Storage

- ✅ Use `.env` file (gitignored)
- ✅ Use environment-specific secrets
- ✅ Use secret management services (AWS Secrets Manager, HashiCorp Vault)
- ❌ NEVER commit `.env` to version control
- ❌ NEVER hardcode secrets in code
- ❌ NEVER share secrets via email/Slack

### 3. Secret Rotation

**Frequency**:

- JWT_SECRET: Quarterly
- CSRF_SECRET: Quarterly (same time as JWT)
- REDIS_PASSWORD: Annually
- GRAFANA_CLOUD_API_TOKEN: Annually or if compromised

**Process**:

1. Generate new secret
2. Update environment variables
3. Deploy new version
4. Monitor for errors
5. Document rotation date

### 4. Production Deployment

```bash
# Example production .env (use secret manager instead)
DATABASE_URL="postgresql://prod-user:REDACTED@host:5432/ftry?sslmode=require&connection_limit=10"
JWT_SECRET="REDACTED"
CSRF_SECRET="REDACTED"
REDIS_HOST="REDACTED"
REDIS_PORT=6379
REDIS_PASSWORD="REDACTED"
NODE_ENV="production"
FRONTEND_URL="https://app.ftry.com"
VITE_API_URL="https://api.ftry.com/api"
```

---

## Troubleshooting

### Application Won't Start

**Error**: "JWT_SECRET is required"
**Solution**: Add JWT_SECRET to .env file

**Error**: "Database connection failed"
**Solution**: Verify DATABASE_URL is correct and database is running

**Error**: "Redis connection failed"
**Solution**: Check REDIS_HOST, REDIS_PORT, REDIS_PASSWORD are correct

### Authentication Not Working

**Issue**: 401 Unauthorized errors
**Check**:

1. JWT_SECRET matches between environments
2. JWT token expiry is appropriate
3. System time is synchronized (JWT uses timestamps)

### CSRF Errors

**Issue**: 403 Forbidden on POST requests
**Check**:

1. CSRF_SECRET is set
2. FRONTEND_URL matches actual frontend domain
3. Cookies are being sent (credentials: 'include')

### Redis Errors

**Issue**: Cache not working
**Check**:

1. All REDIS\_\* variables are set
2. REDIS_TTL is less than JWT_ACCESS_TOKEN_EXPIRY
3. Redis server is running and accessible

---

## Related Documentation

- **Authentication**: [/docs/guides/AUTHENTICATION.md](./AUTHENTICATION.md)
- **Database Setup**: [/docs/architecture/DATABASE.md](../architecture/DATABASE.md)
- **Security Configuration**: [/docs/guides/AUTHENTICATION.md](./AUTHENTICATION.md)
- **.env.example**: [/.env.example](../../.env.example)

---

**Last Updated**: 2025-10-08
**Maintained By**: docs-maintainer agent
