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
  string: { metadata: { pg: 'varchar' } },
  number: { metadata: { pg: 'integer' } },
  boolean: { metadata: { pg: 'boolean' } },
  datetime: { js: 'string', metadata: { pg: 'timestamp with time zone' } },
  text: { js: 'string', metadata: { pg: 'text' } },
  customObject: { js: 'object', metadata: { pg: 'jsonb' } },
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
  test.strictEqual(string.metadata.pg, types.string.metadata.pg);
  test.strictEqual(number.metadata.pg, types.number.metadata.pg);
  test.strictEqual(boolean.metadata.pg, types.boolean.metadata.pg);

  const { datetime, text, customObject } = model.types;
  test.strictEqual(datetime.metadata.pg, types.datetime.metadata.pg);
  test.strictEqual(text.metadata.pg, types.text.metadata.pg);
  test.strictEqual(customObject.metadata.pg, types.customObject.metadata.pg);

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
    'Warning: "Address" referenced by "Company" is not found',
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

metatests.test(
  'Model: custom types with nested schema and realtion',
  (test) => {
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
    test.strictEqual(
      identifier.check({ creation: Date.now().toLocaleString() }).valid,
      true,
    );
    const tester = model.entities.get('Tester');
    test.strictEqual(
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
    test.strictEqual(
      tester.check({
        access: {
          last: Date.now().toLocaleString(),
          count: 2,
        },
      }).valid,
      false,
    );
    test.end();
  },
);

metatests.test('Types: custom type correct name usin js type', (test) => {
  const entities = new Map();
  entities.set('CustomSchema', {
    Struct: {},

    data: { customObject: { string: 'string' } },
  });
  const model = new Model(types, entities, database);
  const schema = model.entities.get('CustomSchema');
  test.strictEqual(schema.fields.data.type, 'customObject');
  test.strictEqual(schema.check({ data: { a: 'b' } }).valid, true);
  test.end();
});
