'use strict';

const metatests = require('metatests');

const { SchemaValidationError } = require('../lib/errors');

const {
  fs: { load },
  default: { options, config },
} = require('..');

const { getSchemaDir } = require('./utils');
const path = getSchemaDir('unresolved');

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

  const expected = [
    new SchemaValidationError('unresolved', 'Person.DOB', {
      type: 'domain',
      value: 'DateTime',
    }),
    new SchemaValidationError('unresolved', 'Person.FullName', {
      type: 'category',
      value: 'FullName',
    }),
  ];

  test.strictSame(errors, expected);

  test.strictSame(ms.domains.size, 0);
  test.strictSame(ms.categories.size, 1);

  test.end();
});
