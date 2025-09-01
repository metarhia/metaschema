'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { Schema } = require('../metaschema');

test('Tuple: basic implementation', () => {
  const short1 = ['string', 'number', '?number'];
  const schema1 = Schema.from(short1);
  assert.strictEqual(schema1.kind, 'struct');
  assert.strictEqual(schema1.fields.value.length, short1.length);
  assert.strictEqual(schema1.fields.value[0].type, 'string');
  assert.strictEqual(schema1.fields.value[0].required, true);
  assert.strictEqual(schema1.fields.value[1].type, 'number');
  assert.strictEqual(schema1.fields.value[1].required, true);
  assert.strictEqual(schema1.fields.value[2].type, 'number');
  assert.strictEqual(schema1.fields.value[2].required, false);
  assert.strictEqual(schema1.check(['abc', 1]).valid, true);
  assert.strictEqual(schema1.check(['abc', 1, 2]).valid, true);
  assert.deepStrictEqual(schema1.check(['abc', 'ab', 2]).errors, [
    'Field "(item1)" not of expected type: number',
  ]);
  assert.deepStrictEqual(schema1.check(['abc', 2, 2, 123]).errors, [
    'Field "" value length is more then expected in tuple',
  ]);

  const short2 = { tuple: ['bigint', 'boolean'] };
  const schema2 = Schema.from(short2);
  assert.strictEqual(schema2.fields.value[0].type, 'bigint');
  assert.strictEqual(schema2.fields.value[0].required, true);
  assert.strictEqual(schema2.fields.value[1].type, 'boolean');
  assert.strictEqual(schema2.fields.value[1].required, true);
  const bigIntValue = BigInt(9007199254740991);
  assert.strictEqual(schema2.check([bigIntValue, true]).valid, true);
  assert.deepStrictEqual(schema2.check(['abc', 1]).errors, [
    'Field "(item0)" not of expected type: bigint',
  ]);
  assert.deepStrictEqual(schema2.check([bigIntValue, false, 123]).errors, [
    'Field "" value length is more then expected in tuple',
  ]);

  const long = { type: 'tuple', value: ['string'] };
  const schema3 = Schema.from(long);
  assert.strictEqual(schema3.fields.value[0].type, 'string');
  assert.strictEqual(schema3.fields.value[0].required, true);
});

test('Tuple: with field names', () => {
  const defs1 = [{ sum: 'number' }, { length: 'string' }];
  const schema1 = Schema.from(defs1);
  assert.strictEqual(schema1.fields.value[0].type, 'number');
  assert.strictEqual(schema1.fields.value[0].required, true);
  assert.strictEqual(schema1.fields.value[0].name, 'sum');
  assert.strictEqual(schema1.fields.value[1].type, 'string');
  assert.strictEqual(schema1.fields.value[1].required, true);
  assert.strictEqual(schema1.fields.value[1].name, 'length');
  assert.strictEqual(schema1.check([1, '123']).valid, true);
  assert.deepStrictEqual(schema1.check([1]).errors, [
    'Field "(length1)" not of expected type: string',
  ]);
});

test('Tuple: usage with schema', () => {
  const defs = { field: ['boolean', { count: 'number' }] };
  const schema = Schema.from(defs);
  assert.strictEqual(schema.fields.field.value[0].type, 'boolean');
  assert.strictEqual(schema.fields.field.value[0].required, true);
  assert.strictEqual(schema.fields.field.value[1].type, 'number');
  assert.strictEqual(schema.fields.field.value[1].required, true);
  assert.strictEqual(schema.fields.field.value[1].name, 'count');
  assert.strictEqual(schema.check({ field: [true, 123] }).valid, true);
  assert.deepStrictEqual(
    schema.check({ field: [false, { some: 'wrong data' }] }).errors,
    ['Field "field(count1)" not of expected type: number'],
  );
});
