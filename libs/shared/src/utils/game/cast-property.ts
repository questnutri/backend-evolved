import { PropertyType } from "../../entities";

export function castProperty<T>(value: any, type: PropertyType): T {
    console.log(`[castProperty] Casting value "${value}" to type "${type}"`);
    if (value === null || value === undefined) return value as T
    switch (type) {
        case PropertyType.STRING:
            return String(value) as unknown as T
        case PropertyType.NUMBER:
            return Number(value) as unknown as T
        case PropertyType.BOOLEAN:
            return (value === "true" || value === true) as unknown as T
        case PropertyType.DATE:
            return new Date(value) as unknown as T
        default:
            return value as unknown as T
    }
}