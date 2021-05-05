'use strict';

const metatests = require('metatests');
const { Model } = require('..');

metatests.test('Model: from struct', (test) => {
  const database = {
    name: 'example',
    description: 'Example database schema',
    version: 3,
    driver: 'pg',
  };
  const types = { string: 'varchar' };
  const entities = new Map();
  entities.set('Company', {
    Company: 'global dictionary',
    name: { type: 'string', unique: true },
    addresses: { many: 'Address' },
  });

  const model = new Model(types, entities, database);

  test.strictEqual(model.database, {
    name: 'example',
    description: 'Example database schema',
    version: 3,
    driver: 'pg',
  });

  test.strictEqual(model.types, { string: 'varchar' });

  test.strictEqual(model.entities.get('Company'), {
    name: 'Company',
    scope: 'global',
    kind: 'dictionary',
    fields: { name: { type: 'string', unique: true, required: true } },
    indexes: { addresses: { many: 'Address' } },
    validate: null,
    format: null,
    parse: null,
    serialize: null,
  });

  test.strictEqual(model.order, new Set(['Company']));

  test.end();
});

metatests.test('Model: loader', async (test) => {
  const model = await Model.load(process.cwd() + '/test/schemas');
  test.strictEqual(model.entities.size, 12);
  test.strictEqual(model.order.size, 12);
  test.strictEqual(typeof model.types, 'object');
  test.strictEqual(typeof model.database, 'object');
  test.end();
});
