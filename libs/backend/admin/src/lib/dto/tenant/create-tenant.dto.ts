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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for creating a new tenant
 * Used by super admins when onboarding new businesses
 */
export class CreateTenantDto {
  @ApiProperty({
    description: 'Tenant name',
    example: 'Elegant Spa & Salon',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({
    description: 'URL-friendly slug for tenant',
    example: 'elegant-spa',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(50)
  slug?: string;

  @ApiPropertyOptional({
    description: 'Tenant description',
    example: 'Premium spa and salon services in Pune',
    maxLength: 500,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
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
    default: 'free',
  })
  @IsEnum(['free', 'basic', 'pro', 'enterprise'])
  @IsOptional()
  subscriptionPlan?: 'basic' | 'enterprise' | 'free' | 'pro';

  @ApiPropertyOptional({
    description: 'Maximum number of users allowed',
    example: 5,
    minimum: 1,
    maximum: 1000,
    default: 5,
  })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(1000)
  maxUsers?: number;
}
