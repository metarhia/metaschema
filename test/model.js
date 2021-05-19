'use strict';

const metatests = require('metatests');
const { Model } = require('..');

const database = {
  name: 'example',
  description: 'Example database schema',
  version: 3,
  driver: 'pg',
};

const types = {
  string: 'varchar',
  number: 'integer',
  boolean: 'boolean',
  datetime: 'timestamp with time zone',
  text: 'text',
  json: 'jsonb',
};

metatests.test('Model: from struct', (test) => {
  const entities = new Map();

  entities.set('Company', {
    Dictionary: {},
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

  test.strictEqual(model.types, {
    boolean: 'boolean',
    datetime: 'timestamp with time zone',
    json: 'jsonb',
    number: 'integer',
    string: 'varchar',
    text: 'text',
  });

  test.strictEqual(model.entities.get('Company'), {
    name: 'Company',
    kind: 'dictionary',
    scope: 'application',
    store: 'persistent',
    allow: 'write',
    fields: { name: { type: 'string', unique: true, required: true } },
    indexes: { addresses: { many: 'Address' } },
    references: ['Address'],
    validate: null,
    format: null,
    parse: null,
    serialize: null,
  });

  test.strictEqual(model.order, new Set(['Company']));

  test.end();
});

metatests.test('Model: loader', async (test) => {
  const model = await Model.load(process.cwd() + '/test/schemas', types);
  test.strictEqual(model.entities.size, 12);
  const Account = model.entities.get('Account');
  test.strictEqual(Account.fields.fullName.constructor.name, 'Schema');
  test.strictEqual(model.order.size, 12);
  test.strictEqual(typeof model.types, 'object');
  test.strictEqual(typeof model.database, 'object');
  test.end();
});

metatests.test(
  `Model: top level 'type' property on an entity warning`,
  (test) => {
    const model = new Model(
      { string: 'string' },
      new Map([['FailingEntity', { type: 'string' }]])
    );
    test.strictEqual(model.warnings, [
      `Warning: top level 'type' property on a 'FailingEntity'.\n` +
        'This will result in it being treated as a scalar type.\n' +
        'Rename property or move the entity to dedicated types file.',
    ]);
    test.end();
  }
);
