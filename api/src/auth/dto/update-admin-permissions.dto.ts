import { ArrayMaxSize, ArrayUnique, IsArray, IsIn } from 'class-validator';
import { ADMIN_PERMISSIONS } from '../permissions';

export class UpdateAdminPermissionsDto {
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(ADMIN_PERMISSIONS.length)
  @IsIn(ADMIN_PERMISSIONS, { each: true })
  permissions!: string[];
}
