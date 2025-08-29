import { ConflictException, InternalServerErrorException, IntrinsicException } from "@nestjs/common";
import { QueryFailedError } from "typeorm";

export class QueryFailedWrapper extends IntrinsicException {
    constructor(detail: string, source: QueryFailedError) {
        super(detail);
        this.source = source;
    }
    detail: string;
    source: QueryFailedError;
    error = true;
}

export const ErrorRegistry: Record<string, new (...args: any[]) => Error> = {
    ConflictException: ConflictException,
    InternalServerErrorException: InternalServerErrorException,
    QueryFailedError: QueryFailedWrapper,
};