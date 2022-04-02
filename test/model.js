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

  test.strictEqual(model.order, new Set(['Company']));

  const company = model.entities.get('Company');

  test.strictEqual(company.name, 'Company');
  test.strictEqual(company.kind, 'dictionary');
  test.strictEqual(company.store, 'persistent');
  test.strictEqual(company.scope, 'application');

  test.strictEqual(company.fields, {
    name: { type: 'string', unique: true, required: true },
    addresses: {
      many: 'Address',
      required: true,
      type: 'reference',
    },
  });

  const warn = model.warnings[0];
  test.strictEqual(
    warn,
    'Warning: "Address" referenced by "Company" is not found'
  );

  test.end();
});

metatests.test('Model: loader', async (test) => {
  const model = await Model.load(process.cwd() + '/test/schemas', types);
  test.strictEqual(model.entities.size, 5);
  const Account = model.entities.get('Account');
  test.strictEqual(Account.fields.fullName.type, 'schema');
  test.strictEqual(Account.fields.fullName.schema.constructor.name, 'Schema');
  test.strictEqual(model.order.size, 5);
  test.strictEqual(typeof model.types, 'object');
  test.strictEqual(typeof model.database, 'object');
  test.end();
});

metatests.test(`Model: restricted 'type' property`, (test) => {
  const model = new Model(
    { string: 'string' },
    new Map([['FailingEntity', { type: 'string' }]])
  );
  test.strictEqual(model.warnings.length, 1);
  test.end();
});

metatests.test('Model: many relation Schema for validation', (test) => {
  const entities = new Map();

  entities.set('Company', {
    Dictionary: {},
    name: { type: 'string', unique: true },
    addresses: { many: 'Address' },
  });

  entities.set('Address', {
    Entity: {},
    city: { type: 'string', unique: true },
  });

  const model = new Model(types, entities, database);

  const company = model.entities.get('Company');

  const obj = {
    name: 'Galeere',
    addresses: [{ city: 'Berlin' }, { city: 'Kiev' }],
  };

  const obj1 = { name: 'Leere' };

  test.strictSame(company.check(obj).valid, true);
  test.strictSame(company.check(obj1).valid, false);

  test.end();
});
