'use strict';

const metatests = require('metatests');

const { Uint64, Flags } = require('@metarhia/common');

const { ValidationError, MetaschemaError } = require('../lib/errors');

const {
  fs: { load },
  default: { options, config },
} = require('..');

const { getSchemaDir } = require('./utils');
const path = getSchemaDir('validation');

config.processors.type = {};

metatests.test('must properly load schemas', async test => {
  let ms;

  try {
    ms = await load(path, options, config);
  } catch (error) {
    test.fail(error);
    test.end();
    return;
  }

  test.throws(
    () => ms.validate('type', {}),
    new TypeError(`No validator defined for type: 'type'`)
  );

  metatests.case(
    'Metaschema.validate',
    { validate: ms.validate.bind(ms) },
    {
      validate: [
        ['category', 'Category', {}, {}, null],
        [
          'category',
          'Category',
          {
            Text: '123456',
            Int: 42,
            Flags: new Uint64(2),
            Enum: 'One',
            StringWithLetterA: 'fsdA',
            CustomUint32Array: new Uint32Array(),
          },
          {},
          null,
        ],
        [
          'category',
          'Category',
          {
            Text: '1234',
            Int: 3.1,
            Flags: 2,
            Enum: 'INVALID',
            StringWithLetterA: 'gfdb',
          },
          {},
          new MetaschemaError([
            new ValidationError('domainValidation', 'Text', 'min'),
            new ValidationError('domainValidation', 'Int', 'min'),
            new ValidationError('domainValidation', 'Int', 'subtype'),
            new ValidationError('invalidClass', 'Flags', {
              expected: ['Uint64', 'FlagsClass'],
              actual: 'Number',
            }),
            new ValidationError('enum', 'Enum', {
              expected: ['One', 'Two'],
              actual: 'INVALID',
            }),
            new ValidationError(
              'domainValidation',
              'StringWithLetterA',
              'check'
            ),
          ]),
        ],
        [
          'category',
          'CategoryWithRequired',
          {
            Int: null,
            Double: 'double',
          },
          {},
          new MetaschemaError([
            new ValidationError('missingProperty', 'Text'),
            new ValidationError('emptyValue', 'Int'),
            new ValidationError('invalidType', 'Double', {
              expected: 'number',
              actual: 'string',
            }),
            new ValidationError('validation', 'Validate'),
          ]),
        ],
        [
          'category',
          'CategoryWithRequired',
          {
            Text: '123456',
            Int: 42,
            Double: 42.42,
          },
          { patch: true },
          new MetaschemaError([
            new ValidationError('propValidation', 'Text'),
            new ValidationError('immutable', 'Int'),
          ]),
        ],
        [
          'category',
          { definition: {} },
          { prop: 'unresolved property' },
          { errors: [new ValidationError('unresolvedProperty', 'prop')] },
        ],
        [
          'category',
          { definition: { field: { required: true } } },
          { field: undefined },
          { errors: [new ValidationError('emptyValue', 'field')] },
        ],
        [
          'category',
          { definition: { field: { category: 'Category' } } },
          { field: { Text: 10 } },
          {
            errors: [
              new ValidationError('invalidType', 'field.Text', {
                expected: 'string',
                actual: 'number',
              }),
            ],
          },
        ],
        ['domains', 'CustomFlags', Flags.from('One', 'Two').from('Two'), null],
        [
          'domains',
          { type: 'string', min: 20 },
          'Less than 20',
          { errors: [new ValidationError('domainValidation', '', 'min')] },
        ],
        [
          'domains',
          { type: 'string', length: 10 },
          'More than 10',
          { errors: [new ValidationError('domainValidation', '', 'length')] },
        ],
        ['domains', { type: 'string', min: 16 }, 'Not less than 16', null],
        ['domains', { type: 'string', length: 16 }, 'Not more than 10', null],
        [
          'domains',
          { type: 'number', max: 10 },
          12,
          { errors: [new ValidationError('domainValidation', '', 'max')] },
        ],
        ['domains', { type: 'number', max: 10 }, 5, null],
        [
          'domains',
          { type: 'object', class: 'Array' },
          new Date(),
          {
            errors: [
              new ValidationError('invalidClass', '', {
                expected: 'Array',
                actual: 'Date',
              }),
            ],
          },
        ],
        [
          'domains',
          { type: 'object', class: 'Array', length: 5 },
          [1, 2, 3, 4, 5, 6],
          { errors: [new ValidationError('domainValidation', '', 'length')] },
        ],
        [
          'domains',
          { type: 'object', class: 'Array', length: 5 },
          [1, 2, 3],
          null,
        ],
        [
          'domains',
          { type: 'object', class: 'Object', length: 5 },
          {},
          { errors: [new ValidationError('domainValidation', '', 'length')] },
        ],
        ['domains', { type: 'object', class: 'Object' }, {}, null],
        ['domains', 'AnyTypeDomain', 'some string', null],
        ['domains', 'AnyTypeDomain', 10, null],
        ['domains', 'AnyTypeDomain', true, null],
        ['domains', 'AnyTypeDomain', [], null],
        ['domains', 'AnyTypeDomain', undefined, null],
      ],
    }
  );

  test.end();
});
