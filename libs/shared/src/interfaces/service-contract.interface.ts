export type KeysOf<T> = {[key in keyof T]: T[key]}

export interface ServiceContract<T = any> {
    findAll(query?: Partial<KeysOf<T>>): Promise<T[]>;
    findOne(query?: Partial<KeysOf<T>>): Promise<T | null>;
    createOne(data: Partial<T>): Promise<T>;
    updateOne(query: Partial<KeysOf<T>>, data: Partial<T>): Promise<T | null>;
    deleteOne(query: Partial<KeysOf<T>>): Promise<void>;
}