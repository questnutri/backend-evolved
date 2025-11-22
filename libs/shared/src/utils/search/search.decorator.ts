import 'reflect-metadata';

export const FILTERABLE_KEY = Symbol('filterable');

export function Filterable() {
    return (target: any, propertyKey: string) => {
        Reflect.defineMetadata(FILTERABLE_KEY, true, target, propertyKey);
    };
}

export function isFilterable(target: any, propertyKey: string) {
    return Reflect.getMetadata(FILTERABLE_KEY, target, propertyKey) === true;
}