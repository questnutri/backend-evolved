import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole } from '../../enums';

export interface ContextUser {
    id: string;
    role: UserRole;
}

export const ContextUser = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        return {
            id: request.headers['user-id'],
            role: request.headers['role']
        } as ContextUser;
    },
);