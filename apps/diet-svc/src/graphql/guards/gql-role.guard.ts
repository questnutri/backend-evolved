import { CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException, mixin } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Observable } from 'rxjs';

export const GqlRoleGuard = (roles: string[]) => {
  class GqlRoleGuardMixin implements CanActivate {
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
      const ctx = GqlExecutionContext.create(context);
      const req = ctx.getContext()?.req;
      const headers = req?.headers || {};
      const role: string | undefined = headers['role'];

      if (!role) {
        throw new UnauthorizedException('Authorization header is missing');
      }

      if (!roles.includes(role)) {
        throw new ForbiddenException('You do not have permission to access this resource');
      }

      return true;
    }
  }

  return mixin(GqlRoleGuardMixin);
};
