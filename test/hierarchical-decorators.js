'use strict';

const metatests = require('metatests');

const metaschema = require('..');
const { getSchemaDir, removeStack } = require('./utils');

const {
  MetaschemaError,
  SchemaValidationError,
} = require('../lib/schema-errors');

const path = getSchemaDir('hierarchicalRelations');

metatests.test('must properly load hierarchical decorators', test => {
  metaschema.fs.loadAndCreate(path, null, (error, ms) => {
    const expected = new MetaschemaError([
      new SchemaValidationError('duplicate', 'Category', null, {
        entity: 'Hierarchy',
      }),
      new SchemaValidationError('duplicate', 'Category', null, {
        entity: 'Catalog',
      }),
      new SchemaValidationError('duplicate', 'Category', null, {
        entity: 'Subdivision',
      }),
      new SchemaValidationError('duplicate', 'Category', null, {
        entity: 'Master',
      }),
    ]);

    test.isError(error, expected);

    removeStack(error.errors);
    removeStack(expected.errors);
    test.strictSame(error.errors, expected.errors);

    const category = ms.categories.get('Category');

    test.strictSame(category.hierarchy, 'Parent');
    test.strictSame(category.definition.Parent.required, undefined);
    test.strictSame(category.definition.Parent.index, true);

    test.strictSame(category.catalog, 'Catalog');
    test.strictSame(category.definition.Catalog.required, true);
    test.strictSame(category.definition.Catalog.index, true);

    test.strictSame(category.subdivision, 'Subdivision');
    test.strictSame(category.definition.Subdivision.required, true);
    test.strictSame(category.definition.Subdivision.index, true);

    test.strictSame(category.master, 'Master');

    test.end();
  });
});
