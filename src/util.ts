import { OpenAPIV3 } from 'openapi-types';

export type SchemaLike = OpenAPIV3.SchemaObject;


export const clamp = (num: number, clamp: number, higher: number) =>
    higher ? Math.min(Math.max(num, clamp), higher) : Math.min(num, clamp)

/**
* Simple object check.
* @param item
* @returns {boolean}
*/
export function isObject(item: any) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}

export interface IObject {
    [key: string]: any
}
/**
 * Deep merge two objects.
 * @param target
 * @param ...sources
 */
export function mergeDeep(target: IObject, ...sources: IObject[]): IObject {
    if (!sources.length) return target;
    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!target[key]) Object.assign(target, { [key]: {} });
                mergeDeep(target[key], source[key]);
            } else {
                Object.assign(target, { [key]: source[key] });
            }
        }
    }

    return mergeDeep(target, ...sources);
}

// 预处理 schema 的 allOf、oneOf、anyOf 情况
export function getRootSchema(schema: SchemaLike) {

    // allOf, merge all subschemas
    if (schema.allOf && schema.allOf[0]) {
        return schema.allOf.reduce((combined: any, subschema: SchemaLike) => {
            return mergeDeep(combined, subschema)
        }, schema);
    }

    // oneOf, use first
    if (schema.oneOf && schema.oneOf[0]) {
        return schema.oneOf[0] as SchemaLike;
    }

    // anyOf, use first
    if (schema.anyOf && schema.anyOf[0]) {
        return schema.anyOf[0] as SchemaLike;
    }

    return schema;
}