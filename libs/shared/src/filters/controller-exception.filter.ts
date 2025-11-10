import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { ErrorMapper } from '../errors/error.mapper';

@Catch()
export class ControllerExceptionFilter implements ExceptionFilter {
    catch(exception: any, host: ArgumentsHost) {
        const response = host.switchToHttp().getResponse();
        return response.json(ErrorMapper.handle(exception));
    }
}