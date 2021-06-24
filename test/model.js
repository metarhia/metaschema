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
    namespaces: new Set(),
    kind: 'dictionary',
    scope: 'application',
    store: 'persistent',
    allow: 'write',
    fields: { name: { type: 'string', unique: true, required: true } },
    indexes: { addresses: { many: 'Address' } },
    references: new Set(['Address']),
    validate: null,
    warnings: ['Warning: "Address" referenced by "Company" is not found'],
    format: null,
    parse: null,
    serialize: null,
  });

  test.strictEqual(model.order, new Set(['Company']));

  const warn = model.warnings[0];
  test.strictEqual(
    warn,
    'Warning: "Address" referenced by "Company" is not found'
  );

  test.end();
});

metatests.test('Model: loader', async (test) => {
  const model = await Model.load(process.cwd() + '/test/schemas', types);
  test.strictEqual(model.entities.size, 4);
  const Account = model.entities.get('Account');
  test.strictEqual(Account.fields.fullName.constructor.name, 'Schema');
  test.strictEqual(model.order.size, 4);
  test.strictEqual(typeof model.types, 'object');
  test.strictEqual(typeof model.database, 'object');
  test.end();
});

metatests.test(`Model: restricted 'type' property in db schemas`, (test) => {
  const model = new Model(
    { string: 'string' },
    new Map([['FailingEntity', { type: 'string' }]])
  );
  test.strictEqual(model.warnings.length, 1);
  test.end();
});
