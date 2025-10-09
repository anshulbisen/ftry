import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from './app.module';

/**
 * Integration test to verify AdminModule is correctly integrated into AppModule
 * This ensures all controllers, services, and guards are properly registered.
 */
describe('AppModule Integration (AdminModule)', () => {
  let app: INestApplication;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Module Registration', () => {
    it('should compile AppModule successfully', () => {
      expect(module).toBeDefined();
      expect(app).toBeDefined();
    });

    it('should have AdminModule registered', () => {
      // AdminModule services should be available in the DI container
      const tenantService = module.get('TenantService', { strict: false });
      const userAdminService = module.get('UserAdminService', { strict: false });
      const roleService = module.get('RoleService', { strict: false });
      const permissionService = module.get('PermissionService', { strict: false });

      expect(tenantService).toBeDefined();
      expect(userAdminService).toBeDefined();
      expect(roleService).toBeDefined();
      expect(permissionService).toBeDefined();
    });
  });

  describe('Controller Registration', () => {
    it('should have admin controllers registered', () => {
      const controllers =
        module
          .get('HttpAdapterHost')
          .httpAdapter.getInstance()
          ._router?.stack?.filter((layer: any) => layer.route) || [];

      // Note: Routes will be registered as '/api/v1/admin/*' due to global prefix
      const routes = controllers.map((layer: any) => layer.route?.path).filter(Boolean);

      // Verify at least one admin route exists (exact paths depend on versioning)
      const hasAdminRoutes = routes.some((route: string) => route.includes('admin'));
      expect(hasAdminRoutes).toBe(true);
    });
  });

  describe('Dependency Resolution', () => {
    it('should resolve PrismaService for AdminModule', () => {
      const prismaService = module.get('PrismaService', { strict: false });
      expect(prismaService).toBeDefined();
    });

    it('should resolve AuthModule guards', () => {
      const jwtAuthGuard = module.get('JwtAuthGuard', { strict: false });
      expect(jwtAuthGuard).toBeDefined();
    });
  });
});
