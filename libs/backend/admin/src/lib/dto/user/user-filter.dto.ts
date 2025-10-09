import { IsOptional, IsInt, IsEnum, IsString, IsUUID, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for filtering and paginating user list
 */
export class UserFilterDto {
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
    description: 'Filter by tenant ID',
    example: 'cm4b1c2d3e4f5g6h7i8j9k0l',
  })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional({
    description: 'Filter by role ID',
    example: 'cm4b1c2d3e4f5g6h7i8j9k0l',
  })
  @IsOptional()
  @IsUUID()
  roleId?: string;

  @ApiPropertyOptional({
    description: 'Filter by user status',
    enum: ['active', 'inactive', 'suspended'],
  })
  @IsOptional()
  @IsEnum(['active', 'inactive', 'suspended'])
  status?: 'active' | 'inactive' | 'suspended';

  @ApiPropertyOptional({
    description: 'Search users by email, first name, or last name',
    example: 'john',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
