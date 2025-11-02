import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole } from "@backend-evolved/shared";
import { ContextUserDecoratorData, ensureUserRelatedOrThrow } from './relate.util';

export interface ContextUser {
    id: string;
    role: UserRole;
}

export const ContextUser = createParamDecorator(
    (data: ContextUserDecoratorData, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const rawId = request.headers?.['user-id'] ?? request.user?.id;
        const rawRole = request.headers?.['role'] ?? request.user?.role;

        const user: ContextUser = {
            id: String(rawId ?? ''),
            role: (rawRole as UserRole) as UserRole
        };

        // no relation check requested
        if (!data || !data.isRelated) {
            return user;
        }

        const opts = data.isRelated;

        ensureUserRelatedOrThrow(user, request, opts);

        // allowed
        return user;
    },
);