import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import type { Role } from '../user.entity.js';

// What JwtStrategy puts on request.user
export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

export const IS_PUBLIC_KEY = 'isPublic';
// Skips the global JwtAuthGuard
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const ROLES_KEY = 'roles';
// Checked by the global RolesGuard
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => ctx.switchToHttp().getRequest().user,
);
