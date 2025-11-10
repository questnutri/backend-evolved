import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface ContextLog {
    id: string;
}

export const ContextLog = createParamDecorator(
    (ignored: unknown, context: ExecutionContext) => {
        if (context.getType() === 'rpc') {
            return {
                id: context.getArgByIndex(0)['log-id']
            } as ContextLog;
        } else if (context.getType() === 'http') {
            return {
                id: context.switchToHttp().getRequest().headers['log-id']
            } as ContextLog;
        }
        // const request = context.switchToHttp().getRequest();

        // const user: ContextUser = {
        //     id: String(rawId ?? ''),
        //     role: (rawRole as UserRole) as UserRole
        // };

        // return request.headers['log-id'] || null;
        return null;
    },
);