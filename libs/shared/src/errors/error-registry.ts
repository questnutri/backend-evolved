import { ConflictException, InternalServerErrorException } from "@nestjs/common";
import { QueryFailedError } from "typeorm";

export const ErrorRegistry: Record<string, new (...args: any[]) => Error> = {
    ConflictException: ConflictException,
    InternalServerErrorException: InternalServerErrorException,
    QueryFailedError: ConflictException,
};