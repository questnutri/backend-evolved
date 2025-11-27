import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { ClientProxy, ClientProxyFactory, ClientOptions } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ContextUser, getContextUser, provideRabbitMqConnection } from '../utils';
import { LoggingInterceptor } from './logging.interceptor';

let loggingProxy: ClientProxy | null = null;

function getLoggingProxy(): ClientProxy {
    if (!loggingProxy) {
        loggingProxy = ClientProxyFactory.create(
            provideRabbitMqConnection('log_queue') as ClientOptions
        );
    }
    return loggingProxy;
}

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
        const method = req.method;
        const path = req.url;
        const ip = req.ip; // Extract the IP address

        let user: ContextUser | null = getContextUser(req);
        if (user.id.trim().length === 0) {
            user = null;
        }

        return next.handle().pipe(
            map(data => {
                const payload = {
                    controller,
                    handler,
                    method,
                    path,
                    ip,
                    response: this.transform(data),
                    user,
                    timestamp: new Date().toISOString()
                };

                try {
                    const logProxy = getLoggingProxy();
                    logProxy.emit('log.message', payload);
                } catch (error) {
                    console.error('[LOGGING] Failed to send log:', error);
                }

                return data;
            })
        );
    }
}