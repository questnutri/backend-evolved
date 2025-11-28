import { Injectable, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ContextUser, getContextUser } from '../utils';
import { LoggingInterceptor } from './logging.interceptor';
import { provideLogProxy } from '../providers';
import { EventOrigin } from '../enums';
import { LogRecord } from '../types';

let logProxy = provideLogProxy();

@Injectable()
export class CustomLoggingInterceptor extends LoggingInterceptor {
    transform = (data: any) => {
        return data;
    }

    constructor(options: {
        transform: (data: any) => any
    }) {
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
        if (user.id.trim().length === 0) {
            user = null;
        }

        return next.handle().pipe(
            map(data => {
                const payload: LogRecord = {
                    origin: EventOrigin.CONTROLLER,
                    controller,
                    handler,
                    method,
                    path,
                    ip,
                    statusCode: res.statusCode,
                    response: this.transform(data),
                    user,
                    timestamp: new Date().toISOString()
                };

                try {
                    logProxy.emit('log.message', payload);
                } catch (error) {
                    console.error('[LOGGING] Failed to send log:', error);
                }

                return data;
            })
        );
    }
}