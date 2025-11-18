import { BadRequestException, ConflictException, ForbiddenException, HttpException, InternalServerErrorException, NotFoundException, NotImplementedException, UnauthorizedException } from "@nestjs/common";
import { RpcException } from "@nestjs/microservices";
import { EntityPropertyNotFoundError, QueryFailedError } from "typeorm";

export interface CapturedError {
    error: true;
    detail: string;
    source: string;
    original: any;
}

export class ErrorMapper {
    static ConflictException = ConflictException
    static InternalServerErrorException = InternalServerErrorException
    static QueryFailedError = QueryFailedError
    static RpcException = RpcException
    static NotFoundException = NotFoundException
    static BadRequestException = BadRequestException
    static UnauthorizedException = UnauthorizedException
    static ForbiddenException = ForbiddenException
    static HttpException = HttpException
    static TypeError = TypeError
    static EntityPropertyNotFoundError = EntityPropertyNotFoundError

    private static find(error: string) {
        return (ErrorMapper as any)[error];
    }

    static handle(error: unknown, captured?: CapturedError): any {
        console.log(`handling error:`, error);
        if(ErrorMapper.isErrorOfType(BadRequestException, error)) {
            const capturedError = captured || ErrorMapper.capture(error);
            throw new BadRequestException(capturedError.original.response.message || 'Bad request error occurred')
        }
        
        if(ErrorMapper.isErrorOfType(UnauthorizedException, error)) {
            const capturedError = captured || ErrorMapper.capture(error);
            throw new UnauthorizedException(capturedError.original.response.message || 'Unauthorized error occurred')
        }

        if(ErrorMapper.isErrorOfType(ForbiddenException, error)) {
            const capturedError = captured || ErrorMapper.capture(error);
            throw new ForbiddenException(capturedError.original.response.message || 'Forbidden error occurred')
        }

        if(ErrorMapper.isErrorOfType(NotFoundException, error)) {
            const capturedError = captured || ErrorMapper.capture(error);
            throw new NotFoundException(capturedError.original.response.message || 'Not found error occurred')
        }

        if(ErrorMapper.isErrorOfType(HttpException, error)) {
            const capturedError = captured || ErrorMapper.capture(error);
            throw new HttpException(capturedError.original.message, capturedError.original.status);
        }

        if (ErrorMapper.isErrorOfType(ConflictException, error)) {
            throw new ConflictException(captured?.detail || 'Conflict error occurred')
        }

        if (ErrorMapper.isErrorOfType(InternalServerErrorException, error)) {
            throw new InternalServerErrorException(captured?.detail || 'Internal server error occurred')
        }

        if(ErrorMapper.isErrorOfType(TypeError, error)) {
            const capturedError = captured || ErrorMapper.capture(error);
            throw new InternalServerErrorException(`Internal server error occurred. ${capturedError.detail}`);
        }

        if (ErrorMapper.isErrorOfType(QueryFailedError, error)) {
            // console.log("QueryFailed captured");
            const capturedError = captured || ErrorMapper.capture(error);
            const { code, detail, table, column } = capturedError.original;
            switch (code) {
                case '23502': // not null violation
                    throw new BadRequestException(
                        `Field "${column}" cannot be null`
                    );
                case '23505': // unique violation
                    throw new ConflictException(
                        `Unique constraint violation in table "${table}". Detail: ${detail}`
                    );
                case '22P02': { // invalid_text_representation
                    const routine = capturedError.original?.driverError?.routine;
                    const where = capturedError.original?.driverError?.where;
                    switch (routine) {
                        case 'string_to_uuid':
                            throw new BadRequestException(
                                `Invalid input syntax for type UUID. Check every UUID sent.`
                            );
                        default:
                            throw new BadRequestException(
                                `Invalid input syntax (${routine || 'unknown type'}). Context: ${where || 'N/A'}`
                            );
                    }
                }
                default:
                    console.error(`Unhandled captured: `, capturedError);
                    throw new NotImplementedException(
                        `Unhandled database error (code ${code}). Check logs for more details.`
                    );
            }
        }

        // if (ErrorMapper.isErrorOfType(NotFoundException, error)) {
        //     const detail = (error as NotFoundException).message || captured?.detail || 'Not found error';
        //     throw new NotFoundException(detail);
        // }

        if (error instanceof RpcException) {
            const rpcError = error.getError() as CapturedError
            const FoundErrorClass = this.find(rpcError.source)
            if (FoundErrorClass && FoundErrorClass !== RpcException) {
                return this.handle(FoundErrorClass, rpcError)
            }
            console.error(error);
            throw new Error(`Unhandled error source: ${rpcError.source}. Check log for more details.`)
        }

        throw error
    }

    static capture(exception: any): CapturedError {
        // console.log("Trying to capture: ", exception)
        if (exception instanceof ErrorMapper.QueryFailedError) {
            const driverError = exception.driverError;
            return {
                error: true,
                source: exception.constructor.name,
                detail: driverError?.detail,
                original: exception
            }
        }

        const detail = exception?.message ?? String(exception);
        const source = exception?.constructor?.name ?? typeof exception;

        return {
            error: true,
            detail,
            source,
            original: exception
        };

    }

    private static isErrorOfType(clazz: any, error: any): boolean {
        return error instanceof clazz || error === clazz;
    }
}
