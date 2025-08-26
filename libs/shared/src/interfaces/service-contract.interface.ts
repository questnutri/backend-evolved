export interface ServiceContract<T = any> {
    create(data: Partial<T>): Promise<T>;
    findAll(query?: { [key in keyof T]?: any }): Promise<T[]>;
    findById(id: string): Promise<T | null>;
    update(id: string, data: Partial<T>): Promise<T | null>;
    delete(id: string): Promise<void>;
}