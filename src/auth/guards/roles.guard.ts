import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [
        context.getHandler(),
        context.getClass(),
      ],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    const user = request.user;

    if (!user) {
      throw new ForbiddenException(
        'No se encontró información del usuario autenticado',
      );
    }

    if (!user.role) {
      throw new ForbiddenException(
        'El usuario no tiene un rol asignado',
      );
    }

    const hasPermission = requiredRoles.includes(user.role);

    if (!hasPermission) {
      throw new ForbiddenException(
        'No tienes permisos para realizar esta operación',
      );
    }

    return true;
  }
}