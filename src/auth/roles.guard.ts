import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { PERMISSIONS_KEY } from './permissions.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles && !requiredPermissions) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (requiredRoles && requiredRoles.length > 0) {
      const hasRole = requiredRoles.some(role => 
        user.roles?.some(userRole => userRole.name === role)
      );
      if (!hasRole) {
        throw new ForbiddenException('Insufficient role permissions');
      }
    }

    if (requiredPermissions && requiredPermissions.length > 0) {
      const userPermissions = new Set<string>();
      user.roles?.forEach(role => {
        role.permissions?.forEach(permission => {
          userPermissions.add(`${permission.resource}:${permission.action}`);
        });
      });

      const hasPermission = requiredPermissions.some(permission => 
        userPermissions.has(permission)
      );
      if (!hasPermission) {
        throw new ForbiddenException('Insufficient permissions');
      }
    }

    return true;
  }
}