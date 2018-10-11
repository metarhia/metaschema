'use strict';

const { testSync } = require('metatests');
const metaschema = require('..');

testSync('\'build\' must support Logical domain type', (test) => {
  const factory = metaschema.build({
    schema: {
      field: { domain: 'Logical' },
    }
  });

  const actualFalse = factory('schema', { field: false });
  test.strictSame(actualFalse, { field: false });

  const actualTrue = factory('schema', { field: true });
  test.strictSame(actualTrue, { field: true });

  const actualInvalid = factory('schema', { field: 'non-bool' });
  test.strictSame(actualInvalid, null);
});

testSync('\'createInstance\' must support Logical domain type', (test) => {
  test.strictSame(metaschema.createInstance('Logical', true), true);
  test.strictSame(metaschema.createInstance('Logical', false), false);
});
