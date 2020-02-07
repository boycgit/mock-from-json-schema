import { SchemaLike, parseSchemaToPaths, mock } from '../src/index';

const shortArraySchema = {
    type: 'array',
    items: {
        type: 'object',
        properties: {
            name: {
                description: '选项名称',
                type: 'string',
                required: false
            }
        }
    }
}

const shortSchema: any = {
    type: 'object',
    properties: {
        select: shortArraySchema
    }
}




const testSchema: any = {
    type: 'object',
    properties: {
        'FORM-5': {
            description: '供应商',
            type: 'object',
            required: false,
            properties: {
                city: {
                    description: '地区',
                    type: 'string',
                    required: false
                },
                select: shortArraySchema,
                employee: {
                    description: '联系人',
                    type: 'string',
                    required: false
                },

                textField: {
                    description: '供应商名称',
                    type: 'string',
                    required: false
                },

            }

        }

}
}

describe('parseSchemaToPaths 提取路径', () => {
    test('简单 array 情况', ()=>{
        const scopes = ['type', 'description'];
        const result = parseSchemaToPaths(shortSchema as SchemaLike, scopes);
        expect(result).toEqual({
             ".select": {
                "path": ".select",
                "type": "array",
            },
            ".select.[0].name": {
                "path": ".select.[0].name",
                "type": "string",
                "description": "选项名称"
            }
        })
    });
    test('普通 object，包含 array', () => {
        const result = parseSchemaToPaths(testSchema as SchemaLike, ['type', 'description']);

        expect(mock(testSchema)).toEqual({
            "FORM-5": {
                "city": "string", "select": [{ "name": "string" }], "employee": "string", "textField": "string"}});

        expect(result).toEqual({
            ".FORM-5": {
                "path": ".FORM-5",
                "type": "object",
                "description": "供应商"
            },
            ".FORM-5.city": {
                "path": ".FORM-5.city",
                "type": "string",
                "description": "地区"
            },
            ".FORM-5.select": {
                "path": ".FORM-5.select",
                "type": "array"
            },
            ".FORM-5.employee": {
                "path": ".FORM-5.employee",
                "type": "string",
                "description": "联系人"
            },
            ".FORM-5.textField": {
                "path": ".FORM-5.textField",
                "type": "string",
                "description": "供应商名称"
            },
            ".FORM-5.select.[0].name": {
                "path": ".FORM-5.select.[0].name",
                "type": "string",
                "description": "选项名称"
            }
        });
    });
});

