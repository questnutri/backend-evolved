import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const contextType = context.getType();
        const isHttp = contextType === 'http';
        const isRpc = contextType === 'rpc';

        // Log request details
        if (isHttp) {
            const request = context.switchToHttp().getRequest();
            const userId = request.headers['user-id'];
            const role = request.headers['role'];
            
            console.log(`[HTTP Request] ${request.method} ${request.url}`);
            if (userId && role) {
                console.log(`[JWT Auth] User ID: ${userId}, Role: ${role}`);
            }
        }

        const now = Date.now();

        return next.handle().pipe(
            tap(() => {
                const duration = Date.now() - now;
                if (isHttp) {
                    const response = context.switchToHttp().getResponse();
                    console.log(`[HTTP Response] Status: ${response.statusCode} - Duration: ${duration}ms`);
                }
            })
        );
    }
}