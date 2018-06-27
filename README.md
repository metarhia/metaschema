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

## Interface: metaschema

### Introspect interface
`metaschema.introspect(namespace)`
- `namespace:hash of interfaces`
Returns: hash of hash of record, { method, title, parameters }

### Parse function signature
`metaschema.parseSignature(fn)`
- `fn:function` - method
Returns: { title, parameters }

### Generate md from interfaces inventory
`metaschema.generateMd(inventory)`
- `inventory:hash of hash of record` - { method, title, parameters }
Returns: string, md document

## Contributors

  - Timur Shemsedinov (marcusaurelius)
  - See github for full [contributors list](https://github.com/metarhia/metaschema/graphs/contributors)
