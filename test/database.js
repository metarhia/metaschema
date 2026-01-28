'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { Schema } = require('..');

test('Database: schema Registry', () => {
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
  assert.strictEqual(entity.name, expected.name);
  assert.strictEqual(entity.kind, expected.kind);
  assert.strictEqual(entity.store, expected.store);
  assert.deepStrictEqual(
    Object.keys(entity.fields),
    Object.keys(expected.fields),
  );
  assert.deepStrictEqual(
    Object.keys(entity.indexes),
    Object.keys(expected.indexes),
  );
  assert.deepStrictEqual(entity.references, expected.references);
  assert.deepStrictEqual(entity.relations, expected.relations);

  const warn = entity.checkConsistency();
  const countryWarning =
    'Warning: "Country" referenced by "Address" is not found';
  const personWarning =
    'Warning: "Person" referenced by "Address" is not found';
  const expectedWarnings = [countryWarning, personWarning];
  assert.deepStrictEqual(warn, expectedWarnings);
});
