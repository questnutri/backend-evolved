export function removePropertiesForMany<T>(objects: T[], removeKeys?: (keyof T)[]): T[] {
    if (removeKeys && removeKeys.length > 0) {
        for (let obj of objects) {
            obj = remove<T>(obj, removeKeys);
        }
    }
    return objects;
}

export function removePropertyForOne<T>(obj: T, removeKeys: (keyof T)[]): T {
    if (removeKeys && removeKeys.length > 0) {
        obj = remove<T>(obj, removeKeys);
    }
    return obj;
}

function remove<T>(obj: T, removeKeys: (keyof T)[]): T {
    for (const key of removeKeys) {
        delete obj[key];
    }
    return obj;
}