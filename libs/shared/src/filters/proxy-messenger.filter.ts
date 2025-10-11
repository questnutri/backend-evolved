import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { ErrorMapper } from '../errors/error.mapper';

@Catch()
export class ProxyMessengerFilter implements ExceptionFilter {
    catch(exception: any, host: ArgumentsHost) {
        // If it's already an RpcException, rethrow so other Rpc-specific filters/handlers handle it
        console.log('ProxyMessengerFilter caught exception:', exception);
        if (exception instanceof RpcException) {
            throw exception;
        }

        return ErrorMapper.capture(exception);
    }
}
