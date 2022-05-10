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
  datetime: { js: 'string', pg: 'timestamp with time zone' },
  text: { js: 'string', pg: 'text' },
  json: { js: 'schema', pg: 'jsonb' },
};

metatests.test('Model: from struct', (test) => {
  const entities = new Map();

  entities.set('Company', {
    Dictionary: { store: 'persistent', scope: 'application' },
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

  const { string, number, boolean } = model.types;
  test.strictEqual(string.prototype.pg, types.string);
  test.strictEqual(number.prototype.pg, types.number);
  test.strictEqual(boolean.prototype.pg, types.boolean);

  const { datetime, text, json } = model.types;
  test.strictEqual(datetime.prototype.pg, types.datetime.pg);
  test.strictEqual(text.prototype.pg, types.text.pg);
  test.strictEqual(json.prototype.pg, types.json.pg);

  test.strictEqual(model.order, new Set(['Company']));

  const company = model.entities.get('Company');

  test.strictEqual(company.name, 'Company');
  test.strictEqual(company.kind, 'dictionary');
  test.strictEqual(company.store, 'persistent');
  test.strictEqual(company.scope, 'application');

  const { name } = company.fields;
  test.strictEqual(name.type, 'string');
  test.strictEqual(name.required, true);
  test.strictEqual(name.unique, true);

  const warn = model.warnings[0];
  test.strictEqual(
    warn,
    'Warning: "Address" referenced by "Company" is not found'
  );

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
