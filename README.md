# Metaschema

Metadata schema and interface (contract) definition language

[![ci](https://github.com/metarhia/metaschema/workflows/Testing%20CI/badge.svg)](https://github.com/metarhia/metaschema/actions?query=workflow%3A%22Testing+CI%22+branch%3Amaster)
[![snyk](https://snyk.io/test/github/metarhia/metaschema/badge.svg)](https://snyk.io/test/github/metarhia/metaschema)
[![npm version](https://badge.fury.io/js/metaschema.svg)](https://badge.fury.io/js/metaschema)
[![npm downloads/month](https://img.shields.io/npm/dm/metaschema.svg)](https://www.npmjs.com/package/metaschema)
[![npm downloads](https://img.shields.io/npm/dt/metaschema.svg)](https://www.npmjs.com/package/metaschema)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/metarhia/metaschema/blob/master/LICENSE)

## Installation

```bash
$ npm install metaschema
```

## Examples

```js
const { Schema } = require('metaschema');

const schema = Schema.from({
  name: {
    first: 'string',
    last: 'string',
    third: '?string',
  },
  age: 'number',
  levelOne: {
    levelTwo: {
      levelThree: { type: 'enum', enum: [1, 2, 3] },
    },
  },
  collection: { array: { array: 'number' } },
});

const data = {
  name: {
    first: 'a',
    last: 'b',
  },
  age: 5,
  levelOne: { levelTwo: { levelThree: 1 } },
  collection: [
    [1, 2, 3],
    [3, 5, 6],
  ],
};

console.log(schema.check(data));

// Output:
// ValidationResult { errors: [], valid: true }
```

## License & Contributors

Copyright (c) 2017-2024 [Metarhia contributors](https://github.com/metarhia/metaschema/graphs/contributors).
Metaschema is [MIT licensed](./LICENSE).\
Metaschema is a part of [Metarhia](https://github.com/metarhia) technology stack.
