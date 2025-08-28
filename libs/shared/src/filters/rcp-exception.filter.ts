import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { rethrowError } from '../errors/rethrow-error';

@Catch(RpcException)
export class RpcExceptionFilter implements ExceptionFilter {
    catch(exception: RpcException, host: ArgumentsHost) {
        console.log('RpcExceptionFilter caught an exception:', exception);
        const ctx = host.switchToRpc();
        const response = ctx.getContext();
        const error = exception.getError();
        return response.json(rethrowError(error));
    }
}