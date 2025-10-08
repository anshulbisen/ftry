import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  // Read replica client (optional)
  private replicaClient: PrismaClient | null = null;

  constructor() {
    super({
      log: process.env['NODE_ENV'] === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

    // Initialize read replica if configured
    if (process.env['DATABASE_REPLICA_URL']) {
      this.replicaClient = new PrismaClient({
        datasources: {
          db: {
            url: process.env['DATABASE_REPLICA_URL'],
          },
        },
        log: process.env['NODE_ENV'] === 'development' ? ['query', 'error', 'warn'] : ['error'],
      });

      this.logger.log(
        'Read replica configured at ' + this.maskDatabaseUrl(process.env['DATABASE_REPLICA_URL']),
      );
    } else {
      this.logger.log('No read replica configured - all queries will use primary database');
    }
  }

  async onModuleInit() {
    await this.connectWithRetry();

    if (this.replicaClient) {
      await this.connectReplicaWithRetry();
    }
  }

  /**
   * Connect to database with retry logic
   * Prevents overwhelming Docker with aggressive connection attempts
   */
  private async connectWithRetry(maxRetries = 5, delayMs = 2000): Promise<void> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.$connect();
        this.logger.log('✅ Database connection established');
        return;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        if (attempt === maxRetries) {
          this.logger.error(
            `❌ Failed to connect to database after ${maxRetries} attempts: ${errorMessage}`,
          );
          throw error;
        }

        this.logger.warn(
          `⚠️  Database connection attempt ${attempt}/${maxRetries} failed. Retrying in ${delayMs}ms...`,
        );
        await this.sleep(delayMs);

        // Exponential backoff with max 10s
        delayMs = Math.min(delayMs * 1.5, 10000);
      }
    }
  }

  /**
   * Connect to read replica with retry logic
   */
  private async connectReplicaWithRetry(maxRetries = 3, delayMs = 1000): Promise<void> {
    if (!this.replicaClient) return;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.replicaClient.$connect();
        this.logger.log('✅ Read replica connection established');
        return;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        if (attempt === maxRetries) {
          this.logger.warn(
            `⚠️  Read replica connection failed after ${maxRetries} attempts. Using primary database only.`,
          );
          this.replicaClient = null; // Fallback to primary
          return;
        }

        this.logger.warn(
          `⚠️  Read replica connection attempt ${attempt}/${maxRetries} failed. Retrying in ${delayMs}ms...`,
        );
        await this.sleep(delayMs);
        delayMs = Math.min(delayMs * 1.5, 5000);
      }
    }
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async onModuleDestroy() {
    await this.$disconnect();

    if (this.replicaClient) {
      await this.replicaClient.$disconnect();
      this.logger.log('Read replica connection closed');
    }
  }

  /**
   * Get write connection (always primary)
   *
   * Use this for all write operations (INSERT, UPDATE, DELETE)
   *
   * @example
   * ```typescript
   * await this.prisma.write.user.create({ data: { ... } });
   * await this.prisma.write.user.update({ where: { id }, data: { ... } });
   * ```
   */
  get write(): PrismaClient {
    return this;
  }

  /**
   * Get read connection (replica if available, otherwise primary)
   *
   * Use this for read-only operations (SELECT)
   *
   * @example
   * ```typescript
   * const users = await this.prisma.read.user.findMany();
   * const user = await this.prisma.read.user.findUnique({ where: { id } });
   * ```
   */
  get read(): PrismaClient {
    return this.replicaClient || this;
  }

  /**
   * Mask sensitive parts of database URL for logging
   */
  private maskDatabaseUrl(url: string): string {
    try {
      const parsed = new URL(url);
      return `${parsed.protocol}//${parsed.username}:***@${parsed.host}${parsed.pathname}`;
    } catch {
      return '***';
    }
  }

  /**
   * Set tenant context for Row-Level Security (RLS)
   * CRITICAL: This MUST be called on every authenticated request to enforce tenant isolation
   *
   * @param tenantId - Tenant ID to set context for, or null for super admin access
   * @throws Error if tenant ID format is invalid
   *
   * @example
   * // Set tenant context for regular user
   * await prisma.setTenantContext('tenant-123');
   *
   * // Clear tenant context for super admin
   * await prisma.setTenantContext(null);
   *
   * // Clear tenant context for seeding/migrations
   * await prisma.setTenantContext(null);
   */
  async setTenantContext(tenantId: string | null): Promise<void> {
    try {
      // Use the database function which validates tenant ID format
      await this.$executeRaw`SELECT set_tenant_context(${tenantId})`;

      // Log for debugging (helps trace RLS issues)
      if (process.env['NODE_ENV'] === 'development') {
        this.logger.debug(
          `Tenant context set: ${tenantId ? `tenantId=${tenantId}` : 'SUPER_ADMIN'}`,
        );
      }
    } catch (error) {
      this.logger.error(`Failed to set tenant context: ${tenantId}`, error);
      throw new Error(
        `Failed to set tenant context. This is a critical security failure.${error instanceof Error ? ` Cause: ${error.message}` : ''}`,
      );
    }
  }

  /**
   * Get current tenant context (for debugging)
   * @returns Current tenant ID or empty string if not set
   */
  async getTenantContext(): Promise<string> {
    try {
      const result = await this.$queryRaw<Array<{ current_setting: string }>>`
        SELECT current_setting('app.current_tenant_id', true) as current_setting
      `;
      return result[0]?.current_setting || '';
    } catch (error) {
      this.logger.error('Failed to get tenant context', error);
      return '';
    }
  }

  /**
   * Clear all data from the database (useful for testing)
   */
  async clearDatabase() {
    if (process.env['NODE_ENV'] === 'production') {
      throw new Error('clearDatabase is not allowed in production');
    }

    // CRITICAL: Clear tenant context before truncating (bypass RLS for admin operation)
    await this.setTenantContext(null);

    const tablenames = await this.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables WHERE schemaname='public'
    `;

    const tables = tablenames
      .map(({ tablename }) => tablename)
      .filter((name) => name !== '_prisma_migrations')
      .map((name) => `"public"."${name}"`)
      .join(', ');

    if (tables) {
      await this.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
    }
  }
}
