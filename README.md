# metaschema
Metadata Schema and Interface Definition Language (IDL)

[![TravisCI](https://travis-ci.org/metarhia/metaschema.svg?branch=master)](https://travis-ci.org/metarhia/metaschema)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/0a526fd6dda54e5c9d494848415926b8)](https://www.codacy.com/app/metarhia/metaschema)
[![NPM Version](https://badge.fury.io/js/metaschema.svg)](https://badge.fury.io/js/metaschema)
[![NPM Downloads/Month](https://img.shields.io/npm/dm/metaschema.svg)](https://www.npmjs.com/package/metaschema)
[![NPM Downloads](https://img.shields.io/npm/dt/metaschema.svg)](https://www.npmjs.com/package/metaschema)

## Installation

```bash
$ npm install metaschema
```

### Interface: metaschema

#### create(schemas)

  - `schemas: `[`<Iterable>`] schemas in form [name, schema, source] (the
        'source' is optional)

*Returns:* `[ `[`<MetaschemaError>`]`, `[`<Metaschema>`]` ]`


Creates Metaschema instance


#### extractDecorator(schema)

  - `schema: `[`<Object>`]

*Returns:* [`<string>`]


Extracts schema decorator


## Contributors

  - Timur Shemsedinov (marcusaurelius)
  - See github for full [contributors list](https://github.com/metarhia/metaschema/graphs/contributors)

[`<Metaschema>`]: lib/schema.js
[`<MetaschemaError>`]: lib/schema.js
[`<Object>`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object
[`<string>`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type
[`<Iterable>`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols
