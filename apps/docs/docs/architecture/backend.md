# Backend Architecture

NestJS 11 application running on Bun runtime with modular architecture and Row-Level Security integration.

## Tech Stack

- **Framework**: NestJS 11
- **Runtime**: Bun 1.3.0 (not Node.js)
- **ORM**: Prisma 6.16.3
- **Database**: PostgreSQL 18
- **Authentication**: JWT + Passport.js
- **Testing**: Jest

## Module Structure

```
apps/backend/src/
├── app/
│   ├── app.module.ts       # Root module
│   └── app.controller.ts   # Health check
└── main.ts                 # Entry point with Bun

libs/backend/
├── auth/                   # Authentication module
│   ├── controllers/        # AuthController
│   ├── services/           # AuthService, UserValidationService
│   ├── strategies/         # JwtStrategy, LocalStrategy
│   ├── guards/             # JwtAuthGuard, PermissionsGuard
│   ├── decorators/         # @CurrentUser, @Permissions
│   └── auth.module.ts
│
├── admin/                  # Admin CRUD module
│   ├── controllers/        # UserController, RoleController, etc.
│   ├── services/           # UserAdminService, RoleService, etc.
│   ├── guards/             # AdminPermissionGuard
│   ├── decorators/         # @RequirePermissions
│   └── admin.module.ts
│
├── health/                 # Health check module
├── monitoring/             # Metrics and observability
└── common/                 # Shared guards, interceptors, decorators
```

## Core Modules

### Auth Module (`libs/backend/auth/`)

**Responsibilities**:

- JWT-based authentication
- Refresh token management
- Password hashing and validation
- Account lockout protection
- RLS tenant context integration

**Key Services**:

- `AuthService`: Login, registration, token generation
- `UserValidationService`: User status checks

**Key Guards**:

- `JwtAuthGuard`: Protect routes requiring authentication
- `PermissionsGuard`: RBAC enforcement

**See**: [Authentication Architecture](./authentication.md)

### Admin Module (`libs/backend/admin/`)

**Responsibilities**:

- CRUD operations for users, roles, permissions, tenants
- Permission-based access control
- Automatic tenant scoping (via RLS)
- Soft delete support

**Controllers**:

```
UserController      - /api/v1/admin/users
RoleController      - /api/v1/admin/roles
PermissionController- /api/v1/admin/permissions
TenantController    - /api/v1/admin/tenants
```

**Permission Scoping**:

```typescript
@Controller('admin/users')
@UseGuards(JwtAuthGuard, AdminPermissionGuard)
export class UserController {
  @Get()
  @RequirePermissions(['users:read:all', 'users:read:own'])
  async findAll(@CurrentUser() user: UserWithPermissions) {
    // Automatic tenant scoping via RLS
    return this.userService.findAll(user, filters);
  }
}
```

## Request Lifecycle

```
1. HTTP Request
   ↓
2. Global Guards (CORS, Rate Limiting)
   ↓
3. Route Guards (JwtAuthGuard)
   ↓
4. JWT Strategy validate()
   ├─> Verify JWT signature
   ├─> Set RLS tenant context (CRITICAL)
   ├─> Load user with permissions
   └─> Attach to req.user
   ↓
5. Permission Guards (PermissionsGuard)
   ├─> Check @Permissions decorator
   └─> Validate user has required permissions
   ↓
6. Controller Method
   ↓
7. Service Layer
   ├─> Business logic
   └─> Database queries (tenant-scoped by RLS)
   ↓
8. Interceptors (Logging, Response Formatting)
   ↓
9. HTTP Response
```

## RLS Integration

Every authenticated request sets tenant context automatically:

```typescript
// jwt.strategy.ts
async validate(payload: JwtPayload): Promise<UserWithPermissions> {
  // CRITICAL: Set RLS context BEFORE any queries
  await this.prisma.setTenantContext(payload.tenantId);

  // All queries now tenant-scoped
  const user = await this.prisma.user.findUnique({
    where: { id: payload.sub },
  });

  return user;
}
```

**Benefits**:

- Zero-trust security (database enforces isolation)
- No manual WHERE clauses needed
- Super admin support (NULL tenant)

**See**: [Database Architecture - RLS](./database.md#row-level-security-rls)

## API Versioning

```typescript
// main.ts
app.setGlobalPrefix('api');
app.enableVersioning({
  type: VersioningType.URI,
  defaultVersion: '1',
});

// Controller
@Controller('auth')
export class AuthController {
  @Post('login')
  @Version('1') // /api/v1/auth/login
  async login() {}
}
```

## Error Handling

```typescript
import { HttpException, HttpStatus } from '@nestjs/common';

// Standard exceptions
throw new UnauthorizedException('Invalid credentials');
throw new ForbiddenException('Insufficient permissions');
throw new NotFoundException('User not found');

// Custom exception
throw new HttpException(
  {
    success: false,
    message: 'Custom error',
    statusCode: 400,
  },
  HttpStatus.BAD_REQUEST,
);
```

## Validation

```typescript
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}

// Controller
async login(@Body() dto: LoginDto) {
  // DTO automatically validated
}
```

## Database Access

**Always use PrismaService** (includes RLS integration):

```typescript
import { PrismaService } from '@ftry/shared/prisma';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findAll(user: UserWithPermissions) {
    // RLS automatically filters by tenant
    const users = await this.prisma.user.findMany({
      where: { isDeleted: false },
      include: { role: true },
    });
    return users;
  }
}
```

## Logging

```typescript
import { Logger } from '@nestjs/common';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  async login(dto: LoginDto) {
    this.logger.log(`Login attempt: ${dto.email}`);

    try {
      const tokens = await this.generateTokens(user);
      this.logger.log(`Login successful: ${user.id}`);
      return tokens;
    } catch (error) {
      this.logger.error(`Login failed: ${error.message}`, error.stack);
      throw error;
    }
  }
}
```

## Testing

```bash
# Unit tests
nx test backend-auth

# Integration tests
nx test backend-auth-integration

# E2E tests
nx e2e backend-e2e
```

**Example Unit Test**:

```typescript
describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should hash password on registration', async () => {
    const dto = { email: 'test@example.com', password: 'Pass123!' };
    const user = await service.register(dto);

    expect(user.password).not.toBe(dto.password);
  });
});
```

## Performance: JWT Caching Issue

**Current**: Database queried on EVERY authenticated request

**Impact**: Will not scale beyond ~50 concurrent users

**Solution**: Redis caching (pending)

```typescript
// Future implementation
async validate(payload: JwtPayload) {
  await this.prisma.setTenantContext(payload.tenantId);

  // Check cache first
  const cacheKey = `user:${payload.sub}`;
  let user = await this.redis.get(cacheKey);

  if (!user) {
    user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    await this.redis.set(cacheKey, user, 'EX', 600);  // 10 min TTL
  }

  return user;
}
```

## Next Steps

- [API Reference](../api/overview.md) - Detailed endpoint documentation
- [Authentication Architecture](./authentication.md) - JWT flow
- [Database Architecture](./database.md) - Prisma and RLS

---

**Last Updated**: 2025-10-11
**NestJS Version**: 11.x
**Runtime**: Bun 1.3.0
