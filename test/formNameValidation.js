'use strict';

const metatests = require('metatests');

const metaschema = require('..');

const {
  MetaschemaError,
  SchemaValidationError,
} = require('../lib/schema-errors');
const { getSchemaDir, removeStack } = require('./utils');

const formPath = getSchemaDir('invalidFormName');

const errorSort = (a, b) => {
  const aString = a.toString();
  const bString = b.toString();
  if (aString > bString) {
    return 1;
  } else if (aString < bString) {
    return -1;
  } else {
    return 0;
  }
};

metatests.test('must report errors about invalid action params', test => {
  metaschema.fs.loadAndCreate(formPath, null, error => {
    const expected = new MetaschemaError([
      new SchemaValidationError(
        'unresolvedCategory',
        'FullName',
        'ChangeName',
        { category: 'FullName' }
      ),
      new SchemaValidationError('unlinked', 'ChangeName', null, {
        entity: 'form',
      }),
    ]);
    test.isError(error, expected);

    removeStack(error.errors);
    removeStack(expected.errors);
    test.strictSame(
      error.errors.sort(errorSort),
      expected.errors.sort(errorSort)
    );

    test.end();
  });
});
