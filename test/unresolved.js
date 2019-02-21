'use strict';

const metatests = require('metatests');

const { SchemaValidationError, MetaschemaError } = require('../lib/errors');

const {
  fs: { load },
  default: { options, config },
} = require('..');

const { getSchemaDir } = require('./utils');
const path = getSchemaDir('unresolved');

metatests.test('must properly validate categories', async test => {
  let error;

  try {
    await load(path, options, config);
  } catch (err) {
    error = err;
  }

  const expected = new MetaschemaError([
    new SchemaValidationError('unresolved', 'Person.DOB', {
      type: 'domain',
      value: 'DateTime',
    }),
    new SchemaValidationError('unresolved', 'Person.FullName', {
      type: 'category',
      value: 'FullName',
    }),
  ]);

  test.strictSame(error, expected);

  test.end();
});
