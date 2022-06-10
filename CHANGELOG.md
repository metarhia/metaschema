# Changelog

## [Unreleased][unreleased]

- Refactoring and code quality improvement
- Metadata handled separetely
- "required" and "typeMetadata" are not allowed now
- Error handling improved now errors are chained
- Custom Kinds support implemented with custom metadata `{ CustomKind: { customMetadata: 'meta' } }`
- Update dependencies: "eslint", "eslint-config-metarhia"
- Custom types syntax changed. No more hardcoded `pg`. Now you must use `metadata` which is static property of Type constructor.

## [2.0.0-alpha.2][] - 2022-05-29

- Nested schema with relations bugfix
- Custom kind support
- Tuple type implementation

## [2.0.0-alpha.1][] - 2022-05-21

- Properly report error if trying to use `field: 'type'` shorthand for
  `'enum', 'array', 'set', 'map', 'object'` types
- Rewrite schemas and implement custom types
  - elegant syntax/format for custom types and internal types
  - custom types support
  - preprocessor to reduce Schema preprocess complexity
  - any kind of nested arrays, array of references https://github.com/metarhia/metaschema/issues/378
  - nested schemas with Schema instances support
  - any level of complex nested types support
  - custom validate for field
  - changed validate for schema, simplified for user
  - all user's validate functions support 4 types of syntax: boolean return, throw Error, error message as string return and array of error messages
  - reserved words permitted in schema if kind provided
  - function fields stored in schema
  - shorthand required key for collections support `{ 'array?': 'string' }`
  - many relation now checks in runtime
  - model now loads projections at the end, to fix bug
  - schema kinds moved to separate file and kinds now have logic to remove hardcoded projection from Schema
  - ts interfaces from schema now have relation ids as well
  - deps update metautil
  - nested object support https://github.com/metarhia/metaschema/issues/395
  - syntax for validate function changed
  - Model no more require metavm for browser compatibility: need `impress` update
  - loadModel moved to loader: need `impress` update
  - Model no more writes d.ts file to disk moved to loader as well: need `metasql` update
  - syntax for pg types changed a bit, no more not-working types: need `metasql` update
  - not supporting custom Schema kinds: need to not use custom kinds in schemas folder: `application/schemas/<YourSchema.js>`

## [1.4.1][] - 2022-03-17

- Skip calculated fields in schemas
- Update dependencies
- Fix tests after update metatests to 0.8.1

## [1.4.0][] - 2022-02-23

- Fix nullable field long-form
- Optional for nested structures
- Shorthand for optional nested structure
- Fix paths in validation errors
- Unify nested schema fields to
  `{ type: 'schema', schema: Schema, /* other fields */ }`
- Support Schema#validate function

## [1.3.4][] - 2021-09-10

- Show path to the field in warnings
- Remove spread operator in `toLongForm`
- Update dependencies

## [1.3.3][] - 2021-07-19

- Improve code style
- Move types to package root
- Package maintenance: update dependencies, update engines, security

## [1.3.2][] - 2021-06-30

- Schema projection
- Schema.prototype.relations: Set<{ to: string, type: string }>

## [1.3.1][] - 2021-06-26

- Add namespaces to Schema.from factory
- Fix "not expected" warning

## [1.3.0][] - 2021-06-25

- Check schemas with references to schemas from attached models
- Add Schema.prototype.namespaces and attach/detouch methods to add/remove
- Add types to Schema.prototype.references (in addition to entities)
- Move Model.prototype.checkReferences to Schema.prototype.checkConsistency
- Fix lost json subfields checking
- Improve Schema kinds

## [1.2.3][] - 2021-05-22

- Restrict 'type' property in db schemas
- Simplify schema examples

## [1.2.2][] - 2021-05-17

- Fix unique alternative keys

## [1.2.1][] - 2021-05-15

- Move Identifier ahead of entity order
- Collect all references: Schema.prototype.references
- Improve check references for Model
- Reorder entities including many-to-many references
- Fix recursion detection on many-to-many and parent

## [1.2.0][] - 2021-05-13

- Change Schema metadata `{ kind, scope, store, allow }`
- Update dependencies and fix security issue

## [1.1.2][] - 2021-05-08

- Shorthand for optional (not required) fields
- Nested schema of json type (for pg json fields)

## [1.1.1][] - 2021-05-07

- Support nested schemas for Model class

## [1.1.0][] - 2021-05-06

- Move Schema.prototype.toInterface from metasql
- Move Directory loader from metasql
- Move Model class from metasql (previous name DomainModel)
- Move Reference checker from metasql
- Move Entity reordering algorithm from metasql
- Improve Model and Schema classes

## [1.0.3][] - 2021-04-13

- Add .d.ts typings
- Update metavm (added typings)

## [1.0.2][] - 2021-03-11

- Support enumerated type
- Fix single value validation
- Fix bugs in not required fields checking

## [1.0.1][] - 2021-03-06

- Fix database schema: index detection
- Add loaders from string and file

## [1.0.0][] - 2021-03-02

- See specs: https://github.com/metarhia/Contracts
- Moved implementation from impress
  - Implement schemas for structures and scalars
  - Schema field shorthand
  - Schema for collections: array, object, set, map
  - Schema custom validation method

## [0.x][] - First generation of metaschema

[unreleased]: https://github.com/metarhia/metaschema/compare/v2.0.0-alpha.2...HEAD
[2.0.0-alpha.2]: https://github.com/metarhia/metaschema/compare/v2.0.0-alpha.1...v2.0.0-alpha.2
[2.0.0-alpha.1]: https://github.com/metarhia/metaschema/compare/v1.4.1...v2.0.0-alpha.1
[1.4.1]: https://github.com/metarhia/metaschema/compare/v1.4.0...v1.4.1
[1.4.0]: https://github.com/metarhia/metaschema/compare/v1.3.4...v1.4.0
[1.3.4]: https://github.com/metarhia/metaschema/compare/v1.3.3...v1.3.4
[1.3.3]: https://github.com/metarhia/metaschema/compare/v1.3.2...v1.3.3
[1.3.2]: https://github.com/metarhia/metaschema/compare/v1.3.1...v1.3.2
[1.3.1]: https://github.com/metarhia/metaschema/compare/v1.3.0...v1.3.1
[1.3.0]: https://github.com/metarhia/metaschema/compare/v1.2.3...v1.3.0
[1.2.3]: https://github.com/metarhia/metaschema/compare/v1.2.2...v1.2.3
[1.2.2]: https://github.com/metarhia/metaschema/compare/v1.2.1...v1.2.2
[1.2.1]: https://github.com/metarhia/metaschema/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/metarhia/metaschema/compare/v1.1.2...v1.2.0
[1.1.2]: https://github.com/metarhia/metaschema/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/metarhia/metaschema/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/metarhia/metaschema/compare/v1.0.3...v1.1.0
[1.0.3]: https://github.com/metarhia/metaschema/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/metarhia/metaschema/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/metarhia/metaschema/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/metarhia/metaschema/compare/v0.x...v1.0.0
[0.x]: https://github.com/metarhia/metaschema/releases/tag/v0.x
