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
  };

  const expected = {
    name: 'Address',
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
        name: '',
        kind: 'struct',
        scope: 'local',
        store: 'memory',
        allow: 'write',
        fields: {
          country: { required: true, type: 'Country' },
        },
        indexes: {},
        references: ['Country'],
        validate: null,
        format: null,
        parse: null,
        serialize: null,
      },
    },
    indexes: {
      persons: { many: 'Person' },
      naturalKey: { primary: ['street', 'building', 'apartment'] },
    },
    references: ['Country', 'Person'],
    validate: null,
    format: null,
    parse: null,
    serialize: null,
  };

  const entity = new Schema('Address', raw);
  test.strictEqual(entity, expected);
  test.end();
});
