'use strict';

const metatests = require('metatests');
const metaschema = require('..');
const { clone } = require('@metarhia/common');

const { getSchemaDir } = require('./utils');

const path = getSchemaDir('modules');

const schemaConfig = clone(metaschema.default.config);

schemaConfig.processors.domains.creator = (ms, schema, instance) =>
  typeof schema === 'object' ? [[], instance] : [[]];

metatests.testAsync('ms.create must properly create schema', async test => {
  const ms = await metaschema.fs.load(
    path,
    metaschema.default.options,
    schemaConfig
  );

  test.strictSame(ms.create('domains', 'Nomen', 'nomen'), 'nomen');
  test.strictSame(
    ms.create('domains', { type: 'string' }, 'instance'),
    'instance'
  );

  test.throws(
    () => ms.create('category', { definition: {} }, {}),
    new TypeError(`No creator defined for type: 'category'`)
  );
});

metatests.testAsync('ms.addSchemas must properly add schema', async test => {
  const { config } = metaschema.default;
  const ms = new metaschema.Metaschema(config);

  config.prepare(ms);

  test.doesNotThrow(() =>
    ms.addSchemas({ type: 'domains', definition: { Text: { type: 'string' } } })
  );

  test.strictSame(ms.sources, [
    {
      type: 'domains',
      module: undefined,
      name: undefined,
      source: undefined,
    },
  ]);
});
