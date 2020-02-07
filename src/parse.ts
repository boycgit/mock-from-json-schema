import { OpenAPIV3 } from 'openapi-types';
import { SchemaLike, IObject, getRootSchema } from "./util";

/**
 * 从对象中生成子对象
 * @param object 源对象
 * @param paths 要获取的字段列表
 */
function pickProperties(object: IObject, paths: string[]) {
    const obj: IObject = {};
    for (const path of paths) {
        if (typeof object[path] !== 'undefined') {
            obj[path] = object[path];
        }
    }
    return obj;
}


interface IQueueItem {
    children: IObject;
    basePath: string;
    isArrayType?: boolean;
}

/**
 * 入栈操作，解析 schema 时辅助方法
 * @param queue 生成队列
 * @param schema schema 对象
 * @param config 配置项
 */
const enqueuItem = (queue: IQueueItem[], schema: SchemaLike, config: { basePath: string }) => {
    const { basePath = '' } = config;
    const { type } = schema;

    switch (type) {
        case 'object':
            const { properties } = schema;
            if (properties) {
                queue.push({ children: properties, basePath });
            }
            break;

        case 'array':
            const { items } = schema as OpenAPIV3.ArraySchemaObject;

            if (items) {
                queue.push({ children: items, basePath, isArrayType: true });
            }
            break;
    }
    return queue;
}

export const ARRAY_SUFFIX = '[0]';
export const EXP_ARRAY_SUFFIX = `.${ARRAY_SUFFIX}`;
/**
 * 生成新 basePath
 * @param basePath 当前 basePath
 * @param keyName 当前 key 值
 * @param isArray 是否是 array 类型
 */
export const genNewBasePath = (basePath: string, keyName: string, isArray?: boolean) =>{
    if(isArray) {
        return basePath + EXP_ARRAY_SUFFIX;
    } else {
        return basePath + '.' + keyName
    }
}

// 生成路径解析
export const parseSchemaToPaths = (schema: SchemaLike, scopes: string[] = []) => {

    const queue: IQueueItem[] = [];
    const resultPaths: IObject = {};

    enqueuItem(queue, schema, {
        basePath: ''
    });

    let currentItem = queue.shift();

    while (currentItem) {
        const { children, basePath, isArrayType } = currentItem;

        // 预处理 schema 的 allOf、oneOf、anyOf 情况
        const currentSchema = getRootSchema(children as SchemaLike);
        if (isArrayType) {
            // 更改 basePath 路径
            enqueuItem(queue, currentSchema as SchemaLike, {
                basePath: genNewBasePath(basePath, '', true)
            });
        } else {
            Object.keys(currentSchema).forEach((keyName: string) => {
                // 更改 basePath 路径
                const newBasePath = genNewBasePath(basePath, keyName);

                // 生成路径信息
                resultPaths[newBasePath] = { path: newBasePath, ...pickProperties(currentSchema[keyName], scopes) };
                enqueuItem(queue, currentSchema[keyName] as SchemaLike, {
                    basePath: newBasePath
                });
            })
        }

        // 进行下一轮迭代
        currentItem = queue.shift();
    }

    return resultPaths;
}


// export const jsonPaths: any = (schema: any, scopes: string[] = []) => {
//   const { properties } = schema;

//   return Object.keys(properties).reduce((acc: IObject, key: string) => {
//     acc[key] = {
//       path: ''
//     }
//     return acc.concat(properties[key].type !== 'object' ? key :
//       jsonPaths(properties[key]).map((p: string) => `${key}.${p}`))
//   }, {});
// }