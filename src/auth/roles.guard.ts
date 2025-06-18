import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
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
    
    if (requiredRoles) {
      const hasRole = requiredRoles.some(role => 
        user.roles?.some(userRole => userRole.name === role)
      );
      if (!hasRole) return false;
    }

    if (requiredPermissions) {
      const userPermissions = new Set<string>();
      user.roles?.forEach(role => {
        role.permissions?.forEach(permission => {
          userPermissions.add(`${permission.resource}:${permission.action}`);
        });
      });

      const hasPermission = requiredPermissions.some(permission => 
        userPermissions.has(permission)
      );
      if (!hasPermission) return false;
    }

    return true;
  }
}