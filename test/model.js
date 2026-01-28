'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { Model } = require('..');

const database = {
  name: 'example',
  description: 'Example database schema',
  version: 3,
  driver: 'pg',
};

const types = {
  string: { metadata: { pg: 'varchar' } },
  number: { metadata: { pg: 'integer' } },
  boolean: { metadata: { pg: 'boolean' } },
  datetime: { js: 'string', metadata: { pg: 'timestamp with time zone' } },
  text: { js: 'string', metadata: { pg: 'text' } },
  customObject: { js: 'object', metadata: { pg: 'jsonb' } },
};

test('Model: from struct', () => {
  const entities = new Map();

  entities.set('Company', {
    Dictionary: { store: 'persistent', scope: 'application' },
    name: { type: 'string', unique: true },
    addresses: { many: 'Address' },
  });

  const model = new Model(types, entities, database);

  assert.deepStrictEqual(model.database, {
    name: 'example',
    description: 'Example database schema',
    version: 3,
    driver: 'pg',
  });

  const { string, number, boolean } = model.types;
  assert.strictEqual(string.metadata.pg, types.string.metadata.pg);
  assert.strictEqual(number.metadata.pg, types.number.metadata.pg);
  assert.strictEqual(boolean.metadata.pg, types.boolean.metadata.pg);

  const { datetime, text, customObject } = model.types;
  assert.strictEqual(datetime.metadata.pg, types.datetime.metadata.pg);
  assert.strictEqual(text.metadata.pg, types.text.metadata.pg);
  assert.strictEqual(customObject.metadata.pg, types.customObject.metadata.pg);

  assert.deepStrictEqual(model.order, new Set(['Company']));

  const company = model.entities.get('Company');

  assert.strictEqual(company.name, 'Company');
  assert.strictEqual(company.kind, 'dictionary');
  assert.strictEqual(company.store, 'persistent');
  assert.strictEqual(company.scope, 'application');

  const { name } = company.fields;
  assert.strictEqual(name.type, 'string');
  assert.strictEqual(name.required, true);
  assert.strictEqual(name.unique, true);

  const warn = model.warnings[0];
  assert.strictEqual(
    warn,
    'Warning: "Address" referenced by "Company" is not found',
  );
});

test('Model: many relation Schema for validation', () => {
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
  assert.strictEqual(company.check(obj).valid, true);
  assert.strictEqual(company.check(obj1).valid, false);
});

test('Model: custom types with nested schema and realtion', () => {
  const entities = new Map();
  entities.set('Identifier', { Entity: {}, creation: 'datetime' });
  entities.set('Tester', {
    Registry: {},
    access: {
      last: { type: 'datetime', default: 'now' },
      count: { type: 'number', default: 0 },
      identifiers: { many: 'Identifier' },
      id: { type: 'Identifier', required: false },
    },
  });
  const model = new Model(types, entities, database);
  const identifier = model.entities.get('Identifier');
  assert.strictEqual(
    identifier.check({ creation: Date.now().toLocaleString() }).valid,
    true,
  );
  const tester = model.entities.get('Tester');
  assert.strictEqual(
    tester.check({
      access: {
        last: Date.now().toLocaleString(),
        count: 2,
        identifiers: [
          { creation: Date.now().toLocaleString() },
          { creation: Date.now().toLocaleString() },
        ],
        id: { creation: Date.now().toLocaleString() },
      },
    }).valid,
    true,
  );
  assert.strictEqual(
    tester.check({
      access: {
        last: Date.now().toLocaleString(),
        count: 2,
      },
    }).valid,
    false,
  );
});

test('Model: custom type correct name using js type', () => {
  const entities = new Map();
  entities.set('CustomSchema', {
    Struct: {},

    data: { customObject: { string: 'string' } },
  });
  const model = new Model(types, entities, database);
  const schema = model.entities.get('CustomSchema');
  assert.strictEqual(schema.fields.data.type, 'customObject');
  assert.strictEqual(schema.check({ data: { a: 'b' } }).valid, true);
});
