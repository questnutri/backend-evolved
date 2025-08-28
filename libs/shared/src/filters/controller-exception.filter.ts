import { ArgumentsHost, Catch, ExceptionFilter, ConflictException } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { rethrowError } from '../errors/rethrow-error';
import { QueryFailedError } from 'typeorm';

@Catch()
export class ControllerExceptionFilter implements ExceptionFilter {
    catch(exception: any, host: ArgumentsHost) {
        if (exception instanceof QueryFailedError) {
            throw new ConflictException(exception.driverError.detail);
        }

        if (exception instanceof RpcException) {
            const ctx = host.switchToRpc();
            const response = ctx.getContext();
            const error = exception.getError();
            return response.json(rethrowError(error));
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
