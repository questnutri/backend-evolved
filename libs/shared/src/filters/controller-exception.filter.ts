import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { ErrorMapper } from '../errors/error.mapper';

@Catch()
export class ControllerExceptionFilter implements ExceptionFilter {
    catch(exception: any, host: ArgumentsHost) {
        const response = host.switchToHttp().getResponse();
        return response.json(ErrorMapper.handle(exception));

        // if (exception instanceof QueryFailedError) {
        //     const detail = exception.driverError?.detail;
        //     if(detail) {
        //         if(detail.includes('already exists')) {
        //             throw new ConflictException(exception.driverError.detail);
        //         } else if(detail.includes('invalid')){
        //             return new BadRequestException(exception.driverError.detail);
        //         }
        //         else {
        //             console.log(detail);
        //             return new NotImplementedException(`Not implemented exception check log for more information`);
        //         }
        //     }
        // }

        // if (exception instanceof RpcException) {
        //     const ctx = host.switchToRpc();
        //     const response = ctx.getContext();
        //     const error = exception.getError();
        //     return response.json(rethrowError(error));
        // }

        // const detail = exception?.message ?? String(exception);
        // const source = exception?.constructor?.name ?? typeof exception;

        // // Re-throw as RpcException in the requested shape
        // return {
        //     error: true,
        //     detail,
        //     source,
        // };
    }
}
