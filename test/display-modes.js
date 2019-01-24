'use strict';

const metatests = require('metatests');

const metaschema = require('..');
const { getSchemaDir, removeStack } = require('./utils');

const {
  MetaschemaError,
  SchemaValidationError,
} = require('../lib/schema-errors');

const path = getSchemaDir('displayModes');

metatests.test('must properly load displayModes', test => {
  metaschema.fs.loadAndCreate(path, null, (error, ms) => {
    const expected = new MetaschemaError([
      new SchemaValidationError(
        'unresolved',
        'Category.Display.datasets.unresolved',
        'source',
        { value: '__UNRESOLVED__' }
      ),
    ]);
    test.isError(error);

    removeStack(error.errors);
    removeStack(expected.errors);
    test.strictSame(error.errors, expected.errors);

    const category = ms.categories.get('Category');
    test.assert(category.displayModes.has('Display'));
    test.assert(category.displayModes.has('NoDatasetsMode'));
    test.end();
  });
});
