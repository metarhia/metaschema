'use strict';

const metatests = require('metatests');

const metaschema = require('..');
const { getSchemaDir } = require('./utils');

metatests.test('must load Actions', test => {
  metaschema.fs.loadAndCreate(getSchemaDir('actions'), null, (error, ms) => {
    test.error(error);

    test.equal(ms.actions.get('SchemaWithoutActions').size, 0);
    test.equal(ms.actions.get('SchemaWithActions').size, 1);

    ms.actions
      .get('SchemaWithActions')
      .get('Act')
      .definition({ Id: 42 }, (error, id) => {
        test.error(error);
        test.equal(id, 'Resource42');
        test.end();
      });
  });
});
