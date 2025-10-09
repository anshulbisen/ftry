import { IsOptional, IsInt, IsEnum, IsString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for filtering and paginating tenant list
 */
export class TenantFilterDto {
  @ApiPropertyOptional({
    description: 'Number of records to return',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 50,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Number of records to skip',
    example: 0,
    minimum: 0,
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  offset?: number;

  @ApiPropertyOptional({
    description: 'Filter by tenant status',
    enum: ['active', 'suspended', 'inactive'],
  })
  @IsOptional()
  @IsEnum(['active', 'suspended', 'inactive'])
  status?: 'active' | 'suspended' | 'inactive';

  @ApiPropertyOptional({
    description: 'Filter by subscription plan',
    enum: ['free', 'basic', 'pro', 'enterprise'],
  })
  @IsOptional()
  @IsEnum(['free', 'basic', 'pro', 'enterprise'])
  subscriptionPlan?: 'free' | 'basic' | 'pro' | 'enterprise';

  @ApiPropertyOptional({
    description: 'Search tenants by name (partial match)',
    example: 'Spa',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
