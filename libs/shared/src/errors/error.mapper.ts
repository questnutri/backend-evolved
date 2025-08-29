import { BadRequestException, ConflictException, InternalServerErrorException, NotFoundException, NotImplementedException } from "@nestjs/common";
import { RpcException } from "@nestjs/microservices";
import { QueryFailedError } from "typeorm";

export class ErrorMapper {
    static ConflictException = ConflictException
    static InternalServerErrorException = InternalServerErrorException
    static QueryFailedError = QueryFailedError
    static RpcException = RpcException
    static NotFoundException = NotFoundException

    private static find(error: string) {
        return (ErrorMapper as any)[error];
    }

    static handle(error: unknown, message?: string): any {
        // console.log(`Trying to find error!: ${error}`)
        if (ErrorMapper.isErrorOfType(ConflictException, error)) {
            throw new ConflictException(message || 'Conflict error occurred')
        }

        if (ErrorMapper.isErrorOfType(InternalServerErrorException, error)) {
            throw new InternalServerErrorException(message || 'Internal server error occurred')
        }

        if (ErrorMapper.isErrorOfType(QueryFailedError, error)) {
            const detail = (error as any)?.driverError?.detail || message;
            if (detail) {
                if (detail.includes('already exists')) {
                    throw new ConflictException(detail);
                } else if (detail.includes('invalid')) {
                    throw new BadRequestException(detail);
                }
                else {
                    console.log(`Exception not found for QueryFailedError: `, detail);
                    throw new NotImplementedException(`Not implemented exceptioncheck log for more information`);
                }
            }
        }

        if(ErrorMapper.isErrorOfType(NotFoundException, error)) {
            const detail = (error as NotFoundException).message || message|| 'Not found error';
            throw new NotFoundException(detail);
        }

        if (error instanceof RpcException) {
            const rpcError = error.getError()
            if (this.isRpcError(rpcError)) {
                const FoundErrorClass = this.find(rpcError.source)
                if (FoundErrorClass && FoundErrorClass !== RpcException) {
                    return this.handle(FoundErrorClass, rpcError.detail)
                }
                throw new Error(`Unhandled error source: ${rpcError.source}. Detail: ${rpcError.detail}`)
            }
            return error
        }

        return error
    }

    private static isRpcError(obj: unknown): obj is { source: string; detail: string } {
        return (
            typeof obj === "object" &&
            obj !== null &&
            "source" in obj &&
            "detail" in obj &&
            typeof (obj as any).source === "string" &&
            typeof (obj as any).detail === "string"
        )
    }

    private static isErrorOfType(clazz: any, error: any): boolean {
        return error instanceof clazz || error === clazz;
    }
}
