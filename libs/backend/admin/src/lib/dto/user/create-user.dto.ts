import { IsString, IsEmail, IsOptional, IsUUID, MinLength, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for creating a new user via admin interface
 */
export class CreateUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
    minLength: 2,
  })
  @IsString()
  @MinLength(2)
  firstName!: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
    minLength: 2,
  })
  @IsString()
  @MinLength(2)
  lastName!: string;

  @ApiProperty({
    description:
      'User password (min 8 characters, must include uppercase, lowercase, number, special char)',
    example: 'SecurePass123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
  })
  password!: string;

  @ApiProperty({
    description: 'Role ID to assign to user',
    example: 'cm4b1c2d3e4f5g6h7i8j9k0l',
  })
  @IsUUID()
  roleId!: string;

  @ApiPropertyOptional({
    description: 'Tenant ID (optional for super admin, defaults to current users tenant)',
    example: 'cm4b1c2d3e4f5g6h7i8j9k0l',
  })
  @IsUUID()
  @IsOptional()
  tenantId?: string;

  @ApiPropertyOptional({
    description: 'User phone number',
    example: '+91 98765 43210',
  })
  @IsString()
  @IsOptional()
  phone?: string;
}
