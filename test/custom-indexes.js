'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { Schema } = require('..');

test('Custom Indexes: string-based custom indexes', () => {
  const raw = {
    name: 'string',
    location: 'string',

    akName: { index: 'gin (name gin_trgm_ops)' },
    akLocation: { index: 'gist (location)' },
  };

  const schema = new Schema('TestEntity', raw);
  assert.strictEqual(schema.indexes.akName.index, 'gin (name gin_trgm_ops)');
  assert.strictEqual(schema.indexes.akLocation.index, 'gist (location)');
});

test('Custom Indexes: object-based advanced index configuration', () => {
  const raw = {
    field1: 'string',
    field2: 'string',
    field3: 'string',
    field4: 'string',

    advancedIndex: {
      index: {
        concurrently: true,
        notExists: true,
        method: 'btree',
        fields: [
          { expression: 'field1', collate: 'de_DE', order: 'DESC', nulls: 'LAST' },
          { expression: '(lower(field2))', order: 'ASC', nulls: 'FIRST' },
        ],
        include: ['field3', 'field4'],
        with: { fillfactor: 70 },
        tablespace: 'indexspace',
        where: 'field1 IS NOT NULL',
      },
    },
  };

  const schema = new Schema('TestEntity', raw);
  const index = schema.indexes.advancedIndex.index;
  assert.strictEqual(typeof index, 'object');
  assert.strictEqual(index.concurrently, true);
  assert.strictEqual(index.notExists, true);
  assert.strictEqual(index.method, 'btree');
  assert.strictEqual(Array.isArray(index.fields), true);
  assert.strictEqual(index.fields.length, 2);
  assert.strictEqual(index.fields[0].expression, 'field1');
  assert.strictEqual(index.fields[0].collate, 'de_DE');
  assert.strictEqual(index.fields[0].order, 'DESC');
  assert.strictEqual(index.fields[0].nulls, 'LAST');
  assert.strictEqual(index.fields[1].expression, '(lower(field2))');
  assert.strictEqual(index.fields[1].order, 'ASC');
  assert.strictEqual(index.fields[1].nulls, 'FIRST');
  assert.strictEqual(Array.isArray(index.include), true);
  assert.strictEqual(index.include.length, 2);
  assert.strictEqual(index.include[0], 'field3');
  assert.strictEqual(index.include[1], 'field4');
  assert.deepStrictEqual(index.with, { fillfactor: 70 });
  assert.strictEqual(index.tablespace, 'indexspace');
  assert.strictEqual(index.where, 'field1 IS NOT NULL');
});