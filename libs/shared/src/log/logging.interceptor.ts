import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ContextUser, getContextUser, proxyPattern } from '../utils';
import { provideLogProxy } from '../utils/providers';
import { EventOrigin } from '../enums';
import { LogRecord } from '../types/log/log.type';

let logProxy = provideLogProxy();

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const handler = context.getHandler().name;
        const controller = context.getClass().name;
        const req = context.switchToHttp().getRequest();
        const res = context.switchToHttp().getResponse(); // Get the response object
        const method = req.method;
        const path = req.url;
        const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.ip; // Extract the real IP address

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
                    data,
                    user,
                    timestamp: new Date().toISOString()
                };

                try {
                    logProxy.emit(proxyPattern.log.message.key, payload);
                } catch (error) {
                    console.error('[LOGGING] Failed to send log:', error);
                }

                return data;
            })
        );
    }
}