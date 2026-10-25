import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRED_PERMISSION_KEY } from '../decorators/require-permission.decorator';

interface AuthenticatedAdmin {
  id: string;
  role: 'OWNER' | 'ADMIN';
  permissions: string[];
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const permission = this.reflector.getAllAndOverride<string>(
      REQUIRED_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!permission) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      user?: AuthenticatedAdmin;
    }>();

    const admin = request.user;

    if (!admin) {
      throw new ForbiddenException('Admin context is missing.');
    }

    if (admin.role === 'OWNER') {
      return true;
    }

    if (!admin.permissions?.includes(permission)) {
      throw new ForbiddenException(
        'You do not have permission to access this module.',
      );
    }

    return true;
  }
}
