import { getMetadataArgsStorage } from 'typeorm';

type Where<T> = Partial<Record<keyof T, any>>;

export class FilterQuery {
    static forClass<T>(clazz: Function) {
        const available = getMetadataArgsStorage()
            .columns
            .filter(col => col.target === clazz)
            .map(col => col.propertyName as keyof T);

        return {
            filter(filter?: string): { filter: Where<T> } {
                const where: Where<T> = {};
                if (!filter) return { filter: where };

                const parts = filter.split(',');

                for (const part of parts) {
                    const [key, value] = part.split(':');
                    if (available.includes(key as keyof T)) {
                        where[key as keyof T] = value;
                    }
                }

                return { filter: where };
            },
            withKeys(keys: any[]) {
                const allowed = available.filter(key => keys.includes(key));

                return {
                    filter(filter?: string): { filter: Where<T> } {
                        const where: Where<T> = {};
                        if (!filter) return { filter: where };

                        const parts = filter.split(',');

                        for (const part of parts) {
                            const [key, value] = part.split(':');
                            if (allowed.includes(key as keyof T)) {
                                where[key as keyof T] = value;
                            }
                        }

                        return { filter: where };
                    }
                };
            }
        };
    }
}
