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
    references: new Set(['string', 'Country', 'Person']),
    relations: new Set([
      { to: 'Country', type: 'one-to-many' },
      { to: 'Person', type: 'many-to-one' },
    ]),
    fields: {
      name: {
        references: new Set(['string']),
        relations: new Set(),
        required: true,
        unique: true,
        type: 'string',
      },
      street: {
        references: new Set(['string']),
        relations: new Set(),
        required: true,
        type: 'string',
      },
      building: {
        references: new Set(['string']),
        relations: new Set(),
        required: true,
        type: 'string',
      },
      apartment: {
        references: new Set(['string']),
        relations: new Set(),
        required: true,
        type: 'string',
      },
      location: {
        references: new Set(['Country']),
        relations: new Set([{ to: 'Country', type: 'one-to-many' }]),
        required: true,
        schema: {
          kind: 'struct',
          scope: 'local',
          store: 'memory',
          allow: 'write',
          parent: '',
          indexes: {},
          references: new Set(['Country']),
          relations: new Set([{ to: 'Country', type: 'one-to-many' }]),
          fields: {
            country: {
              references: new Set('Country'),
              relations: new Set([{ to: 'Country', type: 'one-to-many' }]),
              one: 'Country',
              required: true,
              type: 'Country',
            },
          },
          name: '',
          namespaces: new Set(),
        },
        options: { validate: null, format: null, parse: null, serialize: null },
      },
      persons: {
        references: new Set(['Person']),
        relations: new Set([{ to: 'Person', type: 'many-to-one' }]),
        many: 'Person',
        required: true,
        type: 'Person',
      },
    },
    name: 'Address',
    namespaces: new Set(),
    options: { validate: null, format: null, parse: null, serialize: null },
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
