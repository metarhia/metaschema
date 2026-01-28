'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { Schema } = require('../metaschema');

test('Scalars: kind', () => {
  const schema = Schema.from('string');
  assert.strictEqual(schema.kind, 'scalar');
});

test('Scalars: schema shorthand', () => {
  const definition = {
    field1: {
      n: { type: 'number', default: 100 },
      c: { type: 'string', shorthand: true },
    },
  };
  const schema = Schema.from(definition);

  const obj1 = { field1: 'value' };
  assert.strictEqual(schema.check(obj1).valid, false);

  const obj2 = { field1: 1 };
  assert.strictEqual(schema.check(obj2).valid, false);

  const obj3 = { field1: { n: 1, c: 'value' } };
  assert.strictEqual(schema.check(obj3).valid, true);
});

test('Scalars: schema required shorthand', () => {
  const definition1 = { name: '?string' };
  const schema1 = Schema.from(definition1);

  const definition2 = { name: { type: '?string' } };
  const schema2 = Schema.from(definition2);

  const obj1 = { name: 'value' };
  assert.strictEqual(schema1.check(obj1).valid, true);
  assert.strictEqual(schema2.check(obj1).valid, true);

  const obj2 = {};
  assert.strictEqual(schema1.check(obj2).valid, true);
  assert.strictEqual(schema2.check(obj2).valid, true);

  const obj3 = { name: 100 };
  assert.strictEqual(schema1.check(obj3).valid, false);
  assert.strictEqual(schema2.check(obj3).valid, false);
});

test('Scalars: check scalar', () => {
  const def1 = { type: 'string' };
  const schema1 = Schema.from(def1);
  assert.strictEqual(schema1.check('value').valid, true);
  assert.strictEqual(schema1.check(1917).valid, false);
  assert.strictEqual(schema1.check(true).valid, false);
  assert.strictEqual(schema1.check({}).valid, false);

  const def2 = 'string';
  const schema2 = Schema.from(def2);
  assert.strictEqual(schema2.check('value').valid, true);
  assert.strictEqual(schema2.check(1917).valid, false);
  assert.strictEqual(schema2.check(true).valid, false);
  assert.strictEqual(schema2.check({}).valid, false);
});

test('Scalars: check enum', () => {
  const definition = { field: { enum: ['uno', 'due', 'tre'] } };
  const schema = Schema.from(definition);
  assert.strictEqual(schema.check({ field: 'uno' }).valid, true);
  assert.strictEqual(schema.check({ field: 'due' }).valid, true);
  assert.strictEqual(schema.check({ field: 'tre' }).valid, true);
  assert.strictEqual(schema.check({ field: 'quatro' }).valid, false);
  assert.strictEqual(schema.check({ field: 100 }).valid, false);
  assert.strictEqual(schema.check({}).valid, false);

  const def1 = { field: { enum: ['uno', 'due', 'tre'], required: false } };
  const schema1 = Schema.from(def1);
  assert.strictEqual(schema1.check({ field: 'uno' }).valid, true);

  const def2 = { field: { enum: ['uno', 'due', 'tre'], required: false } };
  const schema2 = Schema.from(def2);
  assert.strictEqual(schema2.check({ field: 'quatro' }).valid, false);

  const def3 = { field: { enum: ['uno', 'due', 'tre'], required: false } };
  const schema3 = Schema.from(def3);
  assert.strictEqual(schema3.check({}).valid, true);

  const def4 = { field: { array: 'number', required: false } };
  const schema4 = Schema.from(def4);
  assert.strictEqual(schema4.check({ field: [1, 2, 3] }).valid, true);

  const def5 = { field: { array: 'number', required: false } };
  const schema5 = Schema.from(def5);
  assert.strictEqual(schema5.check({ field: ['uno', 2, 3] }).valid, false);

  const def6 = { field: { array: 'number', required: false } };
  const schema6 = Schema.from(def6);
  assert.strictEqual(schema6.check({}).valid, true);
});

test('Scalars: check enum value', () => {
  const def1 = { enum: ['uno', 'due', 'tre'] };
  const schema1 = Schema.from(def1);
  assert.strictEqual(schema1.check('uno').valid, true);
  assert.strictEqual(schema1.check('due').valid, true);
  assert.strictEqual(schema1.check('tre').valid, true);
  assert.strictEqual(schema1.check('quatro').valid, false);
  assert.strictEqual(schema1.check(100).valid, false);

  const def2 = { enum: ['uno', 'due', 'tre'], required: false };
  const schema2 = Schema.from(def2);
  assert.strictEqual(schema2.check('uno').valid, true);
  assert.strictEqual(schema2.check('due').valid, true);
  assert.strictEqual(schema2.check('tre').valid, true);
  assert.strictEqual(schema2.check('quatro').valid, false);
  assert.strictEqual(schema2.check(100).valid, false);
});

test('Scalars: check null value', () => {
  const def = {
    field1: { type: 'string', required: false },
    field2: 'string',
    field3: '?string',
  };
  const schema = Schema.from(def);
  const obj1 = { field1: null, field2: 'uno', field3: null };
  assert.strictEqual(schema.check(obj1).valid, true);

  const obj2 = { field1: 'due', field2: null };
  assert.strictEqual(schema.check(obj2).valid, false);
});
