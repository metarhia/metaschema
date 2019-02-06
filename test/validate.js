'use strict';

const metatests = require('metatests');

const { Uint64 } = require('@metarhia/common');

const { ValidationError } = require('../lib/errors');

const {
  fs: { load },
  default: { options, config },
} = require('..');

const { getSchemaDir } = require('./utils');
const path = getSchemaDir('validation');

metatests.test('must properly load schemas', async test => {
  let errors;
  let ms;

  try {
    [errors, ms] = await load(path, options, config);
  } catch (error) {
    test.fail(error);
    test.end();
    return;
  }

  if (errors.length) {
    test.fail(errors);
    test.end();
    return;
  }

  metatests.case(
    'Metaschema.validate',
    { validate: ms.validate.bind(ms) },
    {
      validate: [
        ['category', 'Category', {}, {}, []],
        [
          'category',
          'Category',
          { Text: '123456', Int: 42, Flags: new Uint64(2), Enum: 'One' },
          {},
          [],
        ],
        [
          'category',
          'Category',
          { Text: '1234', Int: 3, Flags: 2, Enum: 'INVALID' },
          {},
          [
            new ValidationError('domainValidation', 'Text', 'min'),
            new ValidationError('domainValidation', 'Int', 'min'),
            new ValidationError('invalidClass', 'Flags', {
              expected: ['Uint64', 'FlagsClass'],
              actual: 'Number',
            }),
            new ValidationError('enum', 'Enum', {
              expected: ['One', 'Two'],
              actual: 'INVALID',
            }),
          ],
        ],
      ],
    }
  );

  test.end();
});
