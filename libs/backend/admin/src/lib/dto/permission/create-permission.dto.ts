import { IsString, IsOptional, MinLength } from 'class-validator';

/**
 * DTO for creating a new permission
 * Typically used when adding new features that require new permissions
 */
export class CreatePermissionDto {
  @IsString()
  @MinLength(3)
  name!: string; // e.g., 'users:create:all'

  @IsString()
  description!: string;

  @IsString()
  resource!: string; // e.g., 'users'

  @IsString()
  action!: string; // e.g., 'create:all'

  @IsString()
  @IsOptional()
  category?: string; // e.g., 'admin', 'billing', 'appointments'

  // TODO: Add additional fields as needed
}
