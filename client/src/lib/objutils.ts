export function mergeWithDefault<T extends Record<string, any>>(source: T, defaults: T): T {
    if (
        typeof source !== "object" ||
        source === null ||
        typeof defaults !== "object" ||
        defaults === null
    ) {
        return (source ?? defaults) as T;
    }

    const result: Record<string, any> = Array.isArray(defaults) ? [...defaults] : { ...defaults };
    for (const key of Object.keys(source)) {
        if (
            typeof source[key] === "object" &&
            source[key] !== null &&
            typeof defaults[key] === "object" &&
            defaults[key] !== null
        ) {
            result[key] = mergeWithDefault(source[key], defaults[key]);
        } else {
            result[key] = source[key];
        }
    }
    return result as T;
}