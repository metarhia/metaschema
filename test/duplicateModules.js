'use strict';

const path = require('path');

const metatests = require('metatests');

const metaschema = require('..');
const { getSchemaDir } = require('./utils');

const schemaPath = getSchemaDir('duplicateModules');

metatests.test('must detect duplicate names in modules', test => {
  metaschema.fs.loadAndCreate(schemaPath, null, error => {
    const paths = [
      [
        path.resolve(schemaPath, 'Category', 'Entity.category'),
        path.resolve(schemaPath, 'Entity'),
      ],
      [
        path.resolve(schemaPath, 'Category'),
        path.resolve(schemaPath, 'Entity', 'Category'),
      ],
    ];

    test.isError(error);
    for (const err of error.errors) {
      let unmatched = 0;
      for (const tuple of paths) {
        if (err.source === tuple[0]) {
          test.strictSame(err.info.path, tuple[1]);
        } else if (err.source === tuple[1]) {
          test.strictSame(err.info.path, tuple[0]);
        } else {
          unmatched++;
        }
      }
      if (unmatched === paths.length) {
        test.fail(`Unexpected error: ${err.toString}`);
      }
    }

    test.end();
  });
});
