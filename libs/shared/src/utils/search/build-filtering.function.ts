import { Like } from 'typeorm';

type WhereLike<T> = {
    [K in keyof T]?: ReturnType<typeof Like>
};

export function buildFiltering<T extends Record<string, string>>(obj: T): WhereLike<T> {
    const where: Record<string, ReturnType<typeof Like>> = {};

    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            where[key] = Like(`%${obj[key]}%`);
        }
    }

    return where as WhereLike<T>;
}
