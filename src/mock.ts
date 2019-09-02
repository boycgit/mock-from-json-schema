import { OpenAPIV3 } from 'openapi-types';

export type SchemaLike = OpenAPIV3.SchemaObject;

const clamp = (num: number, clamp: number, higher: number) =>
  higher ? Math.min(Math.max(num, clamp), higher) : Math.min(num, clamp)

/**
* Simple object check.
* @param item
* @returns {boolean}
*/
export function isObject(item: any) {
  return (item && typeof item === 'object' && !Array.isArray(item));
}

interface IObject {
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

export function mock(schema: SchemaLike): any {
  // allOf, merge all subschemas
  if (schema.allOf && schema.allOf[0]) {
    schema = schema.allOf.reduce((combined: any, subschema: SchemaLike) => {
      return mergeDeep(combined, subschema)
    }, schema);
  }

  // use specified example
  if (schema.example !== undefined) {
    return schema.example;
  }

  // use default
  if (schema.default !== undefined) {
    return schema.default;
  }

  // oneOf, use first
  if (schema.oneOf && schema.oneOf[0]) {
    return mock(schema.oneOf[0] as SchemaLike);
  }

  // anyOf, use first
  if (schema.anyOf && schema.anyOf[0]) {
    return mock(schema.anyOf[0] as SchemaLike);
  }

  // get type, use first if array
  const type = Array.isArray(schema) ? schema.type[0] : schema.type;

  if (type === 'object') {
    const obj = schema as OpenAPIV3.NonArraySchemaObject;
    const { properties } = obj;
    if (!properties) {
      return {};
    }

    // mapValues
    const newObj: {[key: string]: any} = {}
    for (const key in properties) {
      if (properties.hasOwnProperty(key)) {
        const ele = properties[key];
        newObj[key] = mock(ele as any)
      }
    }

    return newObj;

    // return _.mapValues(properties, mock);
  }

  if (type === 'array') {
    const array = schema as OpenAPIV3.ArraySchemaObject;
    const items = array.items as SchemaLike;
    if (!items) {
      return [];
    }
    const examples = [];
    let example = ((items.oneOf && items.oneOf[0]) || items) as SchemaLike;
    if (items.anyOf) {
      // include one of each example for anyOf and allOf
      for (const option of items.anyOf) {
        example = option as SchemaLike;
        examples.push(mock(example));
      }
    }
    // if minItems is set make sure we have at least that many items
    const minItems = array.minItems || 1;
    while (examples.length < minItems) {
      examples.push(mock(example));
    }
    // limit to max items if applicable
    return array.maxItems ? examples.slice(0, array.maxItems) : examples;
  }

  if (Array.isArray(schema.enum)) {
    return schema.enum[0];
  }

  if (type === 'string') {
    const { format } = schema;
    const formatExamples: { [format: string]: string } = {
      email: 'user@example.com',
      hostname: 'example.com',
      ipv4: '8.8.8.8',
      ipv6: '2001:4860:4860::8888',
      uri: 'https://example.com/path',
      'uri-reference': '/path#anchor',
      'uri-template': '/path/{param}',
      'json-pointer': '/foo/bar',
      'date-time': new Date('1970-01-01').toJSON(),
      _default: 'string',
    };
    const val = formatExamples[format!] || formatExamples._default;
    const minln = schema.minLength != null ? schema.minLength : 0;
    const maxln = schema.maxLength != null ? schema.maxLength : val.length;
    if (val === formatExamples._default && val.length < minln) {
      return val.padEnd(minln, val);
    }
    return val.substr(0, clamp(val.length, minln, maxln));
  }

  if (type === 'number') {
    let min = schema.minimum ? schema.minimum : -Number.MAX_VALUE;
    let max = schema.maximum ? schema.maximum : Number.MAX_VALUE;
    if (schema.multipleOf) {
      min = Math.ceil(min / schema.multipleOf) * schema.multipleOf;
      max = Math.floor(max / schema.multipleOf) * schema.multipleOf;
    }
    return clamp(0, min, max);
  }

  if (type === 'integer') {
    const schemaMin = schema.minimum && schema.exclusiveMinimum ? schema.minimum + 1 : schema.minimum;
    const schemaMax = schema.maximum && schema.exclusiveMaximum ? schema.maximum - 1 : schema.maximum;
    let min = schemaMin != null ? schemaMin : Number.MIN_SAFE_INTEGER;
    let max = schemaMax != null ? schemaMax : Number.MAX_SAFE_INTEGER;
    if (schema.multipleOf) {
      min = Math.ceil(min / schema.multipleOf) * schema.multipleOf;
      max = Math.floor(max / schema.multipleOf) * schema.multipleOf;
    }
    return clamp(0, min, max);
  }

  if (type === 'null') {
    return null;
  }

  if (type === 'boolean') {
    return true;
  }

  // unknown type
  return {};
}
