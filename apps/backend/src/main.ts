/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger, ValidationPipe, VersioningType, HttpStatus } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app/app.module';
import { HttpExceptionFilter } from '@ftry/backend/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Apply security headers
  app.use(helmet());

  // Enable cookie parsing for HTTP-only cookies
  app.use(cookieParser());

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

  // Apply global exception filter for consistent error responses
  app.useGlobalFilters(new HttpExceptionFilter());

  // Enable CORS for frontend with cookie support
  app.enableCors({
    origin: process.env['FRONTEND_URL'] || 'http://localhost:3000',
    credentials: true, // CRITICAL: Required for cookies to work cross-origin
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Page-Size'],
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
  Logger.log(`🔧 Environment: ${process.env['NODE_ENV'] || 'development'}`);
}

bootstrap();
