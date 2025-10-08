import { plainToInstance } from 'class-transformer';
import { IsString, IsNumber, IsOptional, Min, Max, validateSync, MinLength } from 'class-validator';

/**
 * Environment variable validation schema
 * Ensures all required environment variables are set before the application starts
 */
export class EnvironmentVariables {
  // JWT Configuration
  @IsString()
  @MinLength(32, {
    message: 'JWT_SECRET must be at least 32 characters. Generate with: openssl rand -base64 64',
  })
  JWT_SECRET!: string;

  @IsOptional()
  @IsString()
  JWT_ACCESS_EXPIRY?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(30)
  JWT_REFRESH_EXPIRY_DAYS?: number;

  // Database Configuration
  @IsString()
  DATABASE_URL!: string;

  // Server Configuration
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(65535)
  PORT?: number;

  @IsOptional()
  @IsString()
  NODE_ENV?: string;

  // Security Configuration
  @IsString()
  @MinLength(32, {
    message: 'CSRF_SECRET must be at least 32 characters. Generate with: openssl rand -base64 64',
  })
  CSRF_SECRET!: string;

  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(15)
  BCRYPT_SALT_ROUNDS?: number;

  @IsOptional()
  @IsNumber()
  @Min(3)
  @Max(10)
  MAX_LOGIN_ATTEMPTS?: number;

  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(60)
  LOCK_DURATION_MINUTES?: number;

  // CORS Configuration
  @IsOptional()
  @IsString()
  CORS_ORIGIN?: string;
}

/**
 * Validates environment variables at application startup
 * Throws an error if any required variable is missing or invalid
 */
export function validateEnvironment(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
    whitelist: true,
    forbidNonWhitelisted: false,
  });

  if (errors.length > 0) {
    const errorMessages = errors
      .map((error) => {
        const constraints = error.constraints ? Object.values(error.constraints) : [];
        return `${error.property}: ${constraints.join(', ')}`;
      })
      .join('\n');

    throw new Error(`Environment validation failed:\n${errorMessages}`);
  }

  return validatedConfig;
}
