import {
  IsString,
  IsArray,
  IsEnum,
  IsOptional,
  IsInt,
  MinLength,
  MaxLength,
  Min,
  Max,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for creating a new role
 */
export class CreateRoleDto {
  @ApiProperty({
    description: 'Role name',
    example: 'Salon Manager',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({
    description: 'Role description',
    example: 'Manages salon operations and staff',
    maxLength: 500,
  })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Role type (system or tenant-specific)',
    enum: ['system', 'tenant'],
    example: 'tenant',
  })
  @IsEnum(['system', 'tenant'])
  type!: 'system' | 'tenant';

  @ApiPropertyOptional({
    description: 'Role hierarchy level (higher = more permissions)',
    example: 50,
    minimum: 0,
    maximum: 100,
    default: 50,
  })
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  level?: number;

  @ApiProperty({
    description: 'Array of permission strings',
    example: ['users:read:own', 'users:create:own', 'appointments:read:own'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  permissions!: string[];

  @ApiPropertyOptional({
    description: 'Tenant ID (required for tenant roles, null for system roles)',
    example: 'cm4b1c2d3e4f5g6h7i8j9k0l',
  })
  @IsUUID()
  @IsOptional()
  tenantId?: string | null;
}
