import { IsArray, IsString, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for assigning permissions to a role
 */
export class AssignPermissionsDto {
  @ApiProperty({
    description: 'Array of permission strings to assign to the role',
    example: ['users:read:own', 'users:create:own', 'roles:read:own'],
    type: [String],
    minItems: 1,
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  permissions!: string[];
}
