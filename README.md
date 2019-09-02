# mock-from-json-schema

[![Build Status](https://travis-ci.org/boycgit/mock-from-json-schema.svg?branch=master)](https://travis-ci.org/boycgit/mock-from-json-schema) [![Coverage Status](https://coveralls.io/repos/github/boycgit/mock-from-json-schema/badge.svg?branch=master)](https://coveralls.io/github/boycgit/mock-from-json-schema?branch=master) [![MIT Licence](https://badges.frapsoft.com/os/mit/mit.svg?v=103)](https://opensource.org/licenses/mit-license.php) [![npm version](https://badge.fury.io/js/mock-from-json-schema.svg)](https://badge.fury.io/js/mock-from-json-schema)

Simple utility to mock example objects based on JSON schema definitions. Copy from [mock-json-schema](https://github.com/anttiviljami/mock-json-schema), but not use lodash (less bundle size)


## Installation

### Node.js / Browserify

```bash
npm install mock-from-json-schema --save
```

```javascript
import mock from "mock-from-json-schema";

var schema = {
    "title": "配置",
    "description": "",
    "type": "object",
    "properties": {
        "name": {
            "type": "string",
            "description": "商品名称",
            "title": "name"
        },
        "list": {
            "type": "array",
            "title": "list",
            "description": "列表",
            "items": {
                "title": "",
                "description": "",
                "type": "object",
                "properties": {
                    "itemName": {
                        "type": "string",
                        "description": "子项名称",
                        "title": "itemName"
                    }
                },
                "required": [
                    "itemName"
                ]
            }
        }
    },
    "required": [
        "name"
    ]
};

console.log(555, mock(schema));

// 输出：
// {
//     "name": "string",
//     "list": [
//         {
//             "itemName": "string"
//         }
//     ]
// }

```


## Build & test

```bash
npm run build
```

```bash
npm test
```

```bash
npm run doc
```

then open the generated `out/index.html` file in your browser.

## License

[MIT](LICENSE).
