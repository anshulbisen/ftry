import {
  IsString,
  IsOptional,
  IsEnum,
  MinLength,
  MaxLength,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for updating an existing tenant
 * All fields are optional (partial update)
 */
export class UpdateTenantDto {
  @ApiPropertyOptional({
    description: 'Tenant name',
    example: 'Elegant Spa & Salon',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'URL-friendly slug for tenant',
    example: 'elegant-spa',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({
    description: 'Tenant description',
    example: 'Premium spa and salon services in Pune',
    maxLength: 500,
  })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Tenant website URL',
    example: 'https://elegantspa.com',
  })
  @IsString()
  @IsOptional()
  website?: string;

  @ApiPropertyOptional({
    description: 'Subscription plan',
    enum: ['free', 'basic', 'pro', 'enterprise'],
  })
  @IsEnum(['free', 'basic', 'pro', 'enterprise'])
  @IsOptional()
  subscriptionPlan?: 'basic' | 'enterprise' | 'free' | 'pro';

  @ApiPropertyOptional({
    description: 'Maximum number of users allowed',
    example: 10,
    minimum: 1,
    maximum: 1000,
  })
  @IsInt()
  @Min(1)
  @Max(1000)
  @IsOptional()
  maxUsers?: number;
}
