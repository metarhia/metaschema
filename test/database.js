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
            country: { required: true, type: 'Country' },
          },
          indexes: {},
          references: new Set(['Country']),
          relations: new Set([]),
          validate: null,
          format: null,
          parse: null,
          serialize: null,
        },
      },
    },
    indexes: {
      persons: { many: 'Person' },
      naturalKey: { primary: ['street', 'building', 'apartment'] },
      altKey: { unique: ['name', 'street'] },
    },
    references: new Set(['Country', 'Person']),
    relations: new Set([]),
    validate: null,
    format: null,
    parse: null,
    serialize: null,
  };

  const entity = new Schema('Address', raw);
  test.strictEqual(entity, expected);

  const warn = entity.checkConsistency();
  test.strictEqual(warn, [
    'Warning: "Country" referenced by "Address" is not found',
    'Warning: "Person" referenced by "Address" is not found',
  ]);

  test.end();
});
