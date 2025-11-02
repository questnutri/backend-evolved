import { CanActivate, ExecutionContext, mixin, Type } from '@nestjs/common';
import { UserRole } from '@backend-evolved/shared';
import { ensureUserRelatedOrThrow, IsRelatedOptions } from './relate.util';


export function IsRelatedGuard(opts: IsRelatedOptions): Type<CanActivate> {
    class MixinRelatedGuard implements CanActivate {
        canActivate(ctx: ExecutionContext): boolean {
            const req = ctx.switchToHttp().getRequest();
            const user = {
                id: String(req.headers?.['user-id'] ?? req.user?.id),
                role: (req.headers?.['role'] ?? req.user?.role) as UserRole
            };

            // will throw ForbiddenException when not allowed
            ensureUserRelatedOrThrow(user, ctx, opts);
            return true;
        }
    }

    return mixin(MixinRelatedGuard);
}