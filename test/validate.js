'use strict';

const metatests = require('metatests');

const { Uint64 } = require('@metarhia/common');

const { ValidationError, MetaschemaError } = require('../lib/errors');

const {
  fs: { load },
  default: { options, config },
} = require('..');

const { getSchemaDir } = require('./utils');
const path = getSchemaDir('validation');

metatests.test('must properly load schemas', async test => {
  let ms;

  try {
    ms = await load(path, options, config);
  } catch (error) {
    test.fail(error);
    test.end();
    return;
  }

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
      ],
    }
  );

  test.end();
});
