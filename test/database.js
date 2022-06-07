'use strict';

const metatests = require('metatests');
const { Schema } = require('..');

metatests.test('Database: schema Registry', (test) => {
  const raw = {
    Registry: {},

    name: { type: 'string', unique: true },
    street: 'string',
    building: 'string',
    apartment: 'string',
    location: {
      country: 'Country',
    },
    persons: { many: 'Person' },

    naturalKey: { primary: ['street', 'building', 'apartment'] },
    altKey: { unique: ['name', 'street'] },
  };

  const expected = {
    kind: 'registry',
    scope: 'application',
    store: 'persistent',
    allow: 'write',
    parent: '',
    indexes: {
      persons: { many: 'Person' },
      naturalKey: { primary: ['street', 'building', 'apartment'] },
      altKey: { unique: ['name', 'street'] },
    },
    options: { validate: null, format: null, parse: null, serialize: null },
    references: new Set(['string', 'Country', 'schema', 'Person']),
    relations: new Set([
      { to: 'Country', type: 'one-to-many' },
      { to: 'Person', type: 'many-to-one' },
    ]),
    fields: {
      name: { unique: true, required: true, type: 'string' },
      street: { required: true, type: 'string' },
      building: { required: true, type: 'string' },
      apartment: { required: true, type: 'string' },
      location: {
        country: { one: 'Country', required: true, type: 'Country' },
      },
      persons: { many: 'Person', required: true, type: 'Person' },
      addressId: { required: true, type: 'string' },
    },
    name: 'Address',
    namespaces: new Set(),
  };

  const entity = new Schema('Address', raw);
  test.strictEqual(entity.name, expected.name);
  test.strictEqual(entity.kind, expected.kind);
  test.strictEqual(entity.store, expected.store);
  test.strictEqual(Object.keys(entity.fields), Object.keys(expected.fields));
  test.strictEqual(Object.keys(entity.indexes), Object.keys(expected.indexes));
  test.strictEqual(entity.references, expected.references);
  test.strictEqual(entity.relations, expected.relations);

  const warn = entity.checkConsistency();
  test.strictEqual(warn, [
    'Warning: "Country" referenced by "Address" is not found',
    'Warning: "Person" referenced by "Address" is not found',
  ]);

  test.end();
});
