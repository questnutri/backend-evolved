import { Body, Headers } from "@nestjs/common";

export interface ControllerContract<T> {
    // postOne(body: Partial<T>, headers: any): Promise<T>;
    // getAll(params: {[key in keyof T]?: any}): Promise<T[]>;
    // getOneById(id: string): Promise<T | null>;
    // updateOneById(id: string, item: Partial<T>): Promise<T | null>;
    // deleteOneById(id: string): Promise<void>;
}