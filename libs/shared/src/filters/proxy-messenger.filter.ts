import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

@Catch()
export class ProxyMessengerFilter implements ExceptionFilter {
    catch(exception: any, host: ArgumentsHost) {
        // If it's already an RpcException, rethrow so other Rpc-specific filters/handlers handle it
        if (exception instanceof RpcException) {
            throw exception;
        }

        const detail = exception?.message ?? String(exception);
        const source = exception?.constructor?.name ?? typeof exception;

        // Re-throw as RpcException in the requested shape
        return {
            error: true,
            detail,
            source,
        };
    }
}
