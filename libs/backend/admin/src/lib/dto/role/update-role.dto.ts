import {
  IsString,
  IsArray,
  IsOptional,
  IsInt,
  MinLength,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for updating role information
 * All fields are optional (partial update)
 */
export class UpdateRoleDto {
  @ApiPropertyOptional({
    description: 'Role name',
    example: 'Salon Manager',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Role description',
    example: 'Manages salon operations and staff',
    maxLength: 500,
  })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Role hierarchy level (higher = more permissions)',
    example: 60,
    minimum: 0,
    maximum: 100,
  })
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  level?: number;

  @ApiPropertyOptional({
    description: 'Array of permission strings',
    example: ['users:read:own', 'users:create:own', 'appointments:manage:own'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  permissions?: string[];
}
