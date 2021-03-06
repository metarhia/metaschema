'use strict';

const metatests = require('metatests');
const { Schema } = require('..');

metatests.test('lib/schema database', (test) => {
  const raw = {
    Address: 'global registry',

    name: { type: 'string', unique: true },
    street: 'string',
    building: 'string',
    apartment: 'string',

    addresses: { many: 'Person' },
    naturalKey: { primary: ['street', 'building', 'apartment'] },
  };

  const expected = {
    name: 'Address',
    scope: 'global',
    kind: 'registry',
    fields: {
      name: { type: 'string', unique: true, required: true },
      street: { type: 'string', required: true },
      building: { type: 'string', required: true },
      apartment: { type: 'string', required: true },
    },
    indexes: {
      addresses: { many: 'Person' },
      naturalKey: { primary: ['street', 'building', 'apartment'] },
    },
    validate: null,
    format: null,
    parse: null,
    serialize: null,
  };

  const entity = new Schema('Address', raw);
  test.strictEqual(entity, expected);
  test.end();
});
