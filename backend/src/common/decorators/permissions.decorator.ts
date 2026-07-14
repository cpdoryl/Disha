import { SetMetadata } from '@nestjs/common';
import { Permission } from '../constants/permissions';

export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata('permissions', permissions);
