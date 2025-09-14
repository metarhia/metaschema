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
$ npm i metaschema
```

## Examples

### Basic Schema Usage

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
// Output: ValidationResult { errors: [], valid: true }
```

### Schema Constructor

```js
const { Schema } = require('metaschema');

const schema = new Schema('User', {
  name: 'string',
  email: 'string',
  age: 'number',
  active: 'boolean',
});

console.log(schema.name); // 'User'
console.log(schema.kind); // 'struct'
console.log(schema.scope); // 'local'
```

### Model Usage

```js
const { Model } = require('metaschema');

const types = {
  string: { metadata: { pg: 'varchar' } },
  number: { metadata: { pg: 'integer' } },
  boolean: { metadata: { pg: 'boolean' } },
};

const entities = new Map();
entities.set('User', {
  Entity: { scope: 'application', store: 'persistent' },
  name: 'string',
  email: { type: 'string', unique: true },
  age: 'number',
});

const model = new Model(types, entities);
console.log(model.dts); // Generated TypeScript definitions
```

### Loader Functions

```js
const { createSchema, loadSchema, loadModel } = require('metaschema');

// Create schema from string
const schema1 = createSchema('User', "({ name: 'string', age: 'number' })");

// Load schema from file
const schema2 = await loadSchema('./schemas/user.js');

// Load entire model from directory
const model = await loadModel('./schemas');
```

### Schema Kinds and Metadata

```js
const { Schema, KIND, SCOPE, STORE } = require('metaschema');

console.log(KIND); // ['struct', 'scalar', 'form', 'projection', ...]
console.log(SCOPE); // ['application', 'global', 'local']
console.log(STORE); // ['persistent', 'memory']

const entitySchema = new Schema('Company', {
  Entity: { scope: 'application', store: 'persistent' },
  name: 'string',
  address: 'string',
});
```

## License & Contributors

Copyright (c) 2017-2025 [Metarhia contributors](https://github.com/metarhia/metaschema/graphs/contributors).
Metaschema is [MIT licensed](./LICENSE).\
Metaschema is a part of [Metarhia](https://github.com/metarhia) technology stack.
