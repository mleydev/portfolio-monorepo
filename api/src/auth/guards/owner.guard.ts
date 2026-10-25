import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

interface AuthenticatedAdmin {
  id: string;
  role: 'OWNER' | 'ADMIN';
}

@Injectable()
export class OwnerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      user?: AuthenticatedAdmin;
    }>();

    if (!request.user || request.user.role !== 'OWNER') {
      throw new ForbiddenException('Owner access required.');
    }

    return true;
  }
}
