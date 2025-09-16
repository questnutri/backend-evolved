import { CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException, mixin } from '@nestjs/common';
import { Observable } from 'rxjs';

export const RoleGuard = (roles: string[]) => {
    class RoleGuardMixin implements CanActivate {
        canActivate(
            context: ExecutionContext,
        ): boolean | Promise<boolean> | Observable<boolean> {
            const headers = context.switchToHttp().getRequest().headers;
            const role: string | undefined = headers['role'];

            if (!role) {
                throw new UnauthorizedException('JWT role missing or user not authenticated')
            }

            if (!roles.includes(role)) {
                throw new ForbiddenException('You do not have permission to access this resource');
            }

            return true;
        }
    }

    return mixin(RoleGuardMixin);
};
