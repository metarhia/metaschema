# Metaschema

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

## API

### class Metaschema

#### Metaschema.create(schemas, config)

- `schemas`: `<Schema[]>`
  - `type`: [`<string>`][string]
  - `module`: [`<string>`][string]
  - `name`: [`<string>`][string]
  - `definition`: [`<Object>`][object]
  - `source`: [`<string>`][string]
- `config`: [`<Object>`][object]
  - `prepare`: [`<Function>`][function]
    - `ms`: [`<Metaschema>`][metaschema]
  - `resolve`: [`<Function>`][function]
    - `ms`: [`<Metaschema>`][metaschema]
    - `type`: [`<string>`][string]
    - `name`: [`<string>`][string]
    - _Returns:_ `<Schema>`
  - `processors`: [`<Object>`][object]
    - `[type]`: [`<Object>`][object]
      - `preprocess`: [`<Function[]>`][function] optional
        - `schema`: `<Schema>`
        - _Returns:_ [`<Error[]>`][error]
      - `validateSchema`: [`<Function[]>`][function] optional
        - `schema`: `<Schema>`
        - _Returns:_ [`<Error[]>`][error]
      - `add`: [`<Function[]>`][function]
        - `schema`: `<Schema>`
        - `ms`: [`<Metaschema>`][metaschema]
        - _Returns:_ [`<Error[]>`][error]
      - `postprocess`: [`<Function[]>`][function] optional
        - `schema`: `<Schema>`
        - `ms`: [`<Metaschema>`][metaschema]
        - _Returns:_ [`<Error[]>`][error]
      - `serialize`: [`<Function>`][function] optional
        - `schema`: `<Schema>`
        - `ms`: [`<Metaschema>`][metaschema]
        - _Returns:_ [`<string>`][string]
      - `validateInstance`: [`<Function>`][function] optional
        - `ms`: [`<Metaschema>`][metaschema]
        - `schema`: `<Schema>`
        - `instance`: `<any>`
        - `options`: [`<Object>`][object]
        - _Returns:_ [`<Error[]>`][error]
      - `creator`: [`<Function>`][function] optional
        - `ms`: [`<Metaschema>`][metaschema]
        - `schema`: `<Schema>`
        - `args`: `<any>`
        - `options`: [`<Object>`][object]
        - _Returns:_ [ [`<Error[]>`][error], `<any>` ]
  - `processOrder:`: [`<Function>`][function]|[`<Object>`][object] function is
    passed to Array.prototype.sort (a: `<Schema>`, b: `<Schema>`) =>
    [`<number>`][number]. If [`<Object>`][object] is provided it would be used
    as map from schema type ([`<string>`][string]) to order value
    ([`<number>`][number]), types with lower values are processed earlier.

_Returns:_ [`<Metaschema>`][metaschema]

Creates Metaschema object and fills it with schemas

#### Metaschema.prototype.constructor(config)

#### Metaschema.prototype.validate(type, schema, instance, options)

- `type`: [`<string>`][string]
- `schema`: [`<string>`][string]|`<Schema>` schema or path, that can be resolved
  by config.resolve
- `instance`: `<any>`
- `options`: [`<Object>`][object]

_Returns:_ [`<Error>`][error]|[`<null>`][null]

Validates an instance of a given type against a schema

#### Metaschema.prototype.create(type, schema, instance, options)

- `type`: [`<string>`][string]
- `schema`: [`<string>`][string]|`<Schema>` schema or path, that can be resolved
  by config.resolve
- `instance`: `<any>`
- `options`: [`<Object>`][object]

_Returns:_ `<any>`

Creates an instance of given schema

#### Metaschema.prototype.addSchemas(schemas)

- `schemas`: `<Schema>`|`<Schema[]>`

Adds multiple schemas

### async fs.load(dir, options, config)

- `dir`: [`<string>`][string]|[`<string[]>`][string]
- `options`: [`<Object>`][object]
  - `context`: [`<Object>`][object]
  - `decorators`: [`<Object>`][object]
  - `localDecorators`: [`<Object>`][object] optional
    - `[type]`: [`<Object>`][object] decorators specific for this schema type
  - `pathToType`: [`<Object>`][object]
    - `[ext]`: [`<string>`][string]
  - `pathToType`: [`<Function>`][function]
    - `path`: [`<string>`][string]
  - _Returns:_ [`<string>`][string]
  - `preprocessor:`: [`<Function>`][function] optional
    - `schemas`: `<Schema[]>`
  - _Returns:_ `<Schema[]>`
- `config`: [`<Object>`][object]
  - `prepare`: [`<Function>`][function]
    - `ms`: [`<Metaschema>`][metaschema]
  - `resolve`: [`<Function>`][function]
    - `ms`: [`<Metaschema>`][metaschema]
    - `path`: [`<string>`][string]
    - _Returns:_ `<Schema>`
  - `processors`: [`<Object>`][object]
    - `[type]`: [`<Object>`][object]
      - `preprocess`: [`<Function[]>`][function] optional
        - `schema`: `<Schema>`
        - _Returns:_ [`<Error[]>`][error]
      - `validateSchema`: [`<Function[]>`][function] optional
        - `schema`: `<Schema>`
        - _Returns:_ [`<Error[]>`][error]
      - `add`: [`<Function>`][function]
        - `schema`: `<Schema>`
        - `ms`: [`<Metaschema>`][metaschema]
        - _Returns:_ [`<Error[]>`][error]
      - `postprocess`: [`<Function[]>`][function] optional
        - `schema`: `<Schema>`
        - `ms`: [`<Metaschema>`][metaschema]
        - _Returns:_ [`<Error[]>`][error]
      - `serialize`: [`<Function>`][function] optional
        - `schema`: `<Schema>`
        - `ms`: [`<Metaschema>`][metaschema]
        - _Returns:_ [`<string>`][string]
      - `validateInstance`: [`<Function>`][function] optional
        - `ms`: [`<Metaschema>`][metaschema]
        - `schema`: `<Schema>`
        - `instance`: `<any>`
        - `options`: [`<Object>`][object]
        - _Returns:_ [`<Error[]>`][error]
      - `creator`: [`<Function>`][function] optional
        - `ms`: [`<Metaschema>`][metaschema]
        - `schema`: `<Schema>`
        - `args`: `<any>`
        - `options`: [`<Object>`][object]
        - _Returns:_ [ [`<Error[]>`][error], `<any>` ]
  - `processOrder:`: [`<Function>`][function]|[`<Object>`][object] function is
    passed to Array.prototype.sort (a: `<Schema>`, b: `<Schema>`) =>
    [`<number>`][number]. If [`<Object>`][object] is provided it would be used
    as map from schema type ([`<string>`][string]) to order value
    ([`<number>`][number]), types with lower values are processed earlier.

_Returns:_ [`<Metaschema>`][metaschema]

Creates Metaschema object and fills it with schemas

### class default.decorators.classes.ValuesDecorator

#### default.decorators.classes.ValuesDecorator.prototype.constructor(values)

### class default.decorators.classes.Enum extends ValuesDecorator

#### default.decorators.classes.Enum.prototype.constructor()

### class default.decorators.classes.Flags extends ValuesDecorator

#### default.decorators.classes.Flags.prototype.constructor({ values = \[\], enumDomain })

#### default.decorators.classes.Flags.prototype.parse(value)

### class default.decorators.classes.Validate

#### default.decorators.classes.Validate.prototype.constructor(fn)

### class default.decorators.classes.List

#### default.decorators.classes.List.prototype.constructor(def)

### default.decorators.functions.Enum(...values)

### default.decorators.functions.Flags(...args)

#### default.decorators.functions.Flags.of(enumDomain)

### default.decorators.functions.Validate(fn)

Function decorators

### default.decorators.functions.List(def)

### default.options.decorators.Validate(fn)

Function decorators

### default.options.localDecorators.domains.Enum(...values)

### default.options.localDecorators.domains.Flags(...args)

#### default.options.localDecorators.domains.Flags.of(enumDomain)

### default.options.localDecorators.category.List(def)

### default.config.prepare(ms)

### default.config.resolve(ms, type, name)

### default.config.processors.domains.add\[0\](domains, ms)

### default.config.processors.domains.postprocess\[0\](domains, ms)

### default.config.processors.domains.validateInstance(ms, domain, instance, { path = '' } = {})

### default.config.processors.category.add\[0\](category, ms)

### default.config.processors.category.postprocess\[0\](category, ms)

### default.config.processors.category.validateInstance(ms, { definition: schema }, instance, options = {})

### processSchema(name, source, options, evaluator)

- `name`: [`<string>`][string] schema name
- `source`: [`<string>`][string] schema source
- `options`: [`<Object>`][object]
  - `context`: [`<Object>`][object] object to be assigned to global during
    loading
  - `decorators`: [`<Object>`][object] decorators available during schema
    processing
  - `localDecorators`: [`<Object>`][object] type specific decorators available
    during schema processing
- `evaluator`: [`<Function>`][function] function to be used to evaluate schema

_Returns:_ [`<Object>`][object] processed schema

Process schema source

### extractDecorator(schema)

- `schema`: [`<Object>`][object]

_Returns:_ [`<string>`][string]

Extracts schema decorator

### extractByPath(definition, path, ms, source)

- `definition`: [`<Object>`][object] schema definition in a form similar to
  category
- `path`: [`<string>`][string] path to a a nested property, if it starts with
  `::` substring between `::` and `.` would be treated as category name
- `ms`: [`<Metaschema>`][metaschema]
- `source`: [`<string>`][string] source for error reporting

_Returns:_ [`<Object>`][object]

Extract definition of a nested property

### class errors.SchemaValidationError extends [Error][error]

#### errors.SchemaValidationError.prototype.constructor(type, source, info)

#### errors.SchemaValidationError.prototype.toString()

### class errors.ValidationError extends [Error][error]

#### errors.ValidationError.prototype.constructor(type, property, info)

#### errors.ValidationError.prototype.toString()

### class errors.MetaschemaError extends [Error][error]

#### errors.MetaschemaError.prototype.constructor(errors)

#### errors.MetaschemaError.prototype.toString()

## Contributors

- Timur Shemsedinov (marcusaurelius)
- See github for full [contributors list](https://github.com/metarhia/metaschema/graphs/contributors)

[metaschema]: #class-metaschema
[object]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object
[function]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function
[error]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
[null]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Null_type
[number]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type
[string]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type
