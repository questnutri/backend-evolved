import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole } from "@backend-evolved/shared";
import { ContextUserDecoratorData, ensureUserRelatedOrThrow } from './relate.util';

export interface ContextUser {
    id: string;
    role: UserRole;
}

// Utility function to extract ContextUser from a request
export function getContextUser(request: any): ContextUser {
    const rawId = request.headers?.['user-id'] ?? request.user?.id;
    const rawRole = request.headers?.['role'] ?? request.user?.role;

    return {
        id: String(rawId ?? ''),
        role: (rawRole as UserRole) as UserRole
    };
}

export const ContextUser = createParamDecorator(
    (data: ContextUserDecoratorData, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const user = getContextUser(request);

        if (!data || !data.isRelated) {
            return user;
        }

        const opts = data.isRelated;

        ensureUserRelatedOrThrow(user, request, opts);

        // Allowed
        return user;
    },
);