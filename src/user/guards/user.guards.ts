import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class UserOwnershipGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const resourceId = parseInt(request.params.id);

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const isAdmin = user.roles?.some(role => role.name === 'admin');
    const isOwner = user.id === resourceId;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('Access denied: You can only access your own resources');
    }

    return true;
  }
}