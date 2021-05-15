# Changelog

## [Unreleased][unreleased]

- Move Identifier ahead of entity order
- Collect all references: Schema.prototype.references

## [1.2.0][] - 2021-05-15

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

[unreleased]: https://github.com/metarhia/metaschema/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/metarhia/metaschema/compare/v1.1.2...v1.2.0
[1.1.2]: https://github.com/metarhia/metaschema/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/metarhia/metaschema/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/metarhia/metaschema/compare/v1.0.3...v1.1.0
[1.0.3]: https://github.com/metarhia/metaschema/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/metarhia/metaschema/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/metarhia/metaschema/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/metarhia/metaschema/compare/v0.x...v1.0.0
[0.x]: https://github.com/metarhia/metaschema/releases/tag/v0.x
