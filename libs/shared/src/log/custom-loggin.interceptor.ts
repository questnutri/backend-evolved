import { Injectable, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ContextUser, getContextUser, proxyPattern } from '../utils';
import { LoggingInterceptor } from './logging.interceptor';
import { provideLogProxy } from '../utils/providers';
import { EventOrigin } from '../enums';

let logProxy = provideLogProxy();

export type TransformArgs<T> = {
    handler: string
    controller: string
    method: string
    path: string
    ip: string
    statusCode: number
    user: ContextUser | null
    data: T
    payload: (patched: any) => void
}

@Injectable()
export class CustomLoggingInterceptor<T = any> extends LoggingInterceptor {
    transform: (args: TransformArgs<T>) => void;

    constructor(options: { transform: (args: TransformArgs<T>) => void }) {
        super();
        this.transform = options.transform;
    }

    override intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const handler = context.getHandler().name;
        const controller = context.getClass().name;
        const req = context.switchToHttp().getRequest();
        const res = context.switchToHttp().getResponse();

        const method = req.method;
        const path = req.url;
        const ip = req.ip;

        let user: ContextUser | null = getContextUser(req);
        if (user.id.trim().length === 0) user = null;

        let patchedResult: any = null;

        return next.handle().pipe(
            map(data => {
                const statusCode = res.statusCode;

                const defaultPayload = {
                    handler,
                    controller,
                    method,
                    path,
                    ip,
                    statusCode,
                    user,
                    data,
                    timestamp: new Date().toISOString()
                };

                const args: TransformArgs<T> = {
                    ...defaultPayload,
                    payload: patched => {
                        patchedResult = patched
                    }
                };

                try {
                    this.transform(args);
                } catch { }

                try {
                    logProxy.emit(proxyPattern.log.message.key, { origin: EventOrigin.CONTROLLER, ...defaultPayload, ...patchedResult });
                } catch { }

                return data;
            })
        )
    }
}
