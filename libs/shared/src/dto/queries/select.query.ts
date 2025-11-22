import { getMetadataArgsStorage } from 'typeorm';

export class SelectQuery<T> {
    static forClass<T>(clazz: Function): {
        select(select: string | undefined): { select: (keyof T)[] } | {};
    } {
        const available = getMetadataArgsStorage()
            .columns
            .filter(col => col.target === clazz)
            .map(col => col.propertyName);


        return {
            select(select: string | undefined) {
                if (!select) {
                    return {};
                }
                const check = select.split(',') as (keyof T)[];
                const usedKeys = check.filter(key => available.includes(key as string));
                return { select: usedKeys };
            }
        }
    }
}

