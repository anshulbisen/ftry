import { Logger, ValidationPipe, VersioningType, HttpStatus } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { doubleCsrf } from 'csrf-csrf';
import { AppModule } from './app/app.module';
import { CsrfService, HttpExceptionFilter, ThrottlerExceptionFilter } from '@ftry/backend/common';
import { MetricsInterceptor } from '@ftry/backend/monitoring';

export async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Apply security headers
  app.use(helmet());

  // Enable cookie parsing for HTTP-only cookies (required for CSRF)
  app.use(cookieParser());

  // CSRF Protection - Double Submit Cookie Pattern (stateless)
  const isProduction = process.env.NODE_ENV === 'production';
  const { doubleCsrfProtection, generateCsrfToken } = doubleCsrf({
    getSecret: () => {
      const secret = process.env['CSRF_SECRET'];
      if (!secret) {
        throw new Error('CSRF_SECRET is required. Generate with: openssl rand -base64 64');
      }
      return secret;
    },
    getSessionIdentifier: (req) => req.ip || 'unknown', // Session identifier (IP for stateless apps)
    // __Host- prefix requires secure: true (HTTPS), so only use in production
    cookieName: isProduction ? '__Host-csrf' : 'csrf',
    cookieOptions: {
      httpOnly: true,
      secure: isProduction,
      // SameSite 'strict' blocks cross-origin cookies (different ports in dev)
      // Use 'lax' in dev (localhost:3000 → localhost:3001), 'strict' in prod
      sameSite: isProduction ? 'strict' : 'lax',
      path: '/',
    },
    size: 64, // Token size in bytes
    ignoredMethods: ['GET', 'HEAD', 'OPTIONS'], // Don't protect safe methods
    getCsrfTokenFromRequest: (req) => {
      // Accept token from header or body (NOT from cookie - security!)
      return req.headers['x-csrf-token'] || req.body?.csrfToken;
    },
  });

  // Apply CSRF protection globally (after cookie-parser, before routes)
  app.use(doubleCsrfProtection);

  // Make token generator available to controllers
  CsrfService.setTokenGenerator(generateCsrfToken);

  // Enable API versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    prefix: 'v',
  });

  // Configure global validation pipe with detailed error messages
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
      transform: true, // Automatically transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Enable type conversion based on TS types
      },
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY, // Use 422 for validation errors
      exceptionFactory: (errors) => {
        // Format validation errors for better client understanding
        const formattedErrors = errors.map((error) => ({
          field: error.property,
          constraints: error.constraints,
          children: error.children?.length ? error.children : undefined,
        }));
        return {
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          message: 'Validation failed',
          validationErrors: formattedErrors,
          timestamp: new Date().toISOString(),
        };
      },
    }),
  );

  // Apply global exception filters for consistent error responses
  app.useGlobalFilters(new HttpExceptionFilter(), new ThrottlerExceptionFilter());

  // Apply metrics interceptor for automatic HTTP request tracking
  app.useGlobalInterceptors(app.get(MetricsInterceptor));

  // Enable CORS for frontend with cookie support
  app.enableCors({
    origin: process.env['FRONTEND_URL'] || 'http://localhost:3000',
    credentials: true, // CRITICAL: Required for cookies to work cross-origin
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
    exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Page-Size', 'X-CSRF-Token'],
  });

  // Setup Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Ftry API')
    .setDescription('Salon & Spa Management Platform API Documentation')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Authentication', 'User authentication and authorization')
    .addTag('Users', 'User management endpoints')
    .addTag('Appointments', 'Appointment management')
    .addTag('Clients', 'Client management')
    .addTag('Billing', 'Billing and invoicing')
    .addTag('Admin - Tenants', 'Tenant administration (permission-based)')
    .addTag('Admin - Users', 'User administration (permission-based)')
    .addTag('Admin - Roles', 'Role management (permission-based)')
    .addTag('Admin - Permissions', 'Permission viewing and role assignment')
    .addServer('http://localhost:3001', 'Development server')
    .addServer('https://api.ftry.in', 'Production server')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    deepScanRoutes: true,
    operationIdFactory: (controllerKey: string, methodKey: string) =>
      `${controllerKey}_${methodKey}`,
  });

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
    customSiteTitle: 'Ftry API Documentation',
    customfavIcon: 'https://nestjs.com/img/logo_text.svg',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin-bottom: 40px }
      .swagger-ui .scheme-container { margin: 20px 0 }
    `,
  });

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  const port = process.env['PORT'] || 3001;
  await app.listen(port);

  Logger.log(`🚀 Application is running on: http://localhost:${port}/${globalPrefix}`);
  Logger.log(`📚 API Documentation available at: http://localhost:${port}/api/docs`);
  Logger.log(`📊 Metrics endpoint available at: http://localhost:${port}/api/metrics`);
  Logger.log(`🔧 Environment: ${process.env['NODE_ENV'] || 'development'}`);
}
