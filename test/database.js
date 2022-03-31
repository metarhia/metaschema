'use strict';

const metatests = require('metatests');
const { Schema } = require('..');

metatests.test('Schema: database', (test) => {
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
    name: 'Address',
    namespaces: new Set(),
    parent: '',
    kind: 'registry',
    scope: 'application',
    store: 'persistent',
    allow: 'write',
    fields: {
      name: { type: 'string', unique: true, required: true },
      street: { type: 'string', required: true },
      building: { type: 'string', required: true },
      apartment: { type: 'string', required: true },
      location: {
        type: 'schema',
        required: true,
        schema: {
          name: '',
          namespaces: new Set(),
          parent: '',
          kind: 'struct',
          scope: 'local',
          store: 'memory',
          allow: 'write',
          fields: {
            country: {
              type: 'reference',
              reference: 'Country',
              relation: 'many-to-one',
              required: true,
            },
          },
          indexes: {},
          references: new Set(['Country', 'reference']),
          relations: new Set([{ to: 'Country', type: 'many-to-one' }]),
          validate: null,
          format: null,
          parse: null,
          serialize: null,
        },
      },
      persons: {
        type: 'reference',
        reference: 'Person',
        relation: 'one-to-many',
        required: true,
      },
    },
    indexes: {
      persons: { many: 'Person' },
      naturalKey: { primary: ['street', 'building', 'apartment'] },
      altKey: { unique: ['name', 'street'] },
    },
    references: new Set(['string', 'Country', 'Person']),
    relations: new Set([
      { to: 'Country', type: 'many-to-one' },
      { to: 'Person', type: 'one-to-many' },
    ]),
    validate: null,
    format: null,
    parse: null,
    serialize: null,
  };

  const entity = new Schema('Address', raw);
  test.strictEqual(entity.name, expected.name);
  test.strictEqual(entity.kind, expected.kind);
  test.strictEqual(entity.store, expected.store);
  test.strictEqual(Object.keys(entity.fields), Object.keys(expected.fields));
  test.strictEqual(entity.indexes, expected.indexes);
  test.strictEqual(entity.references, expected.references);
  test.strictEqual(entity.relations, expected.relations);

  const warn = entity.checkConsistency();
  test.strictEqual(warn, [
    'Warning: "Country" referenced by "Address" is not found',
    'Warning: "Person" referenced by "Address" is not found',
  ]);

  test.end();
});
