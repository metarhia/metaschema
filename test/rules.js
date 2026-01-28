'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { Schema } = require('..');

test('Rules: length, required', () => {
  const definition = {
    field1: 'string',
    field2: { type: 'number' },
    field3: { type: 'string', length: 30 },
    field4: { type: 'string', length: { min: 10 } },
    field5: { type: 'string', length: [5, 60] },
  };
  const schema = Schema.from(definition);
  assert.strictEqual(schema.fields.field1.type, 'string');
  assert.strictEqual(schema.fields.field2.required, true);
  assert.strictEqual(schema.fields.field3.length.max, 30);
  assert.strictEqual(schema.fields.field4.length.min, 10);
  assert.strictEqual(schema.fields.field5.length.max, 60);
  assert.strictEqual(schema.fields.field5.length.min, 5);
});

test('Rules: check', () => {
  const definition = {
    field1: 'string',
    field2: { type: 'number' },
    field3: { type: 'string', length: 30 },
    field4: { type: 'string', required: false },
    field5: {
      subfield1: 'number',
      subfield2: { type: 'string', required: false },
    },
  };
  const obj = {
    field1: 'value',
    field2: 100,
    field3: 'value',
    field5: {
      subfield1: 500,
      subfield2: 'value',
    },
  };
  const schema = Schema.from(definition);
  assert.strictEqual(schema.check(obj).valid, true);
});

test('Rules: length negative check', () => {
  const definition = {
    field1: 'string',
    field2: { type: 'number' },
    field3: { type: 'string', length: { min: 5, max: 30 } },
  };
  const schema = Schema.from(definition);

  const obj1 = {
    field1: 1,
    field2: 100,
    field3: 'value',
  };
  assert.strictEqual(schema.check(obj1).valid, false);

  const obj2 = {
    field1: 'value',
    field2: 'value',
    field3: 'value',
  };
  assert.strictEqual(schema.check(obj2).valid, false);

  const obj3 = {
    field1: 'value',
    field2: 100,
    field3: 'valuevaluevaluevaluevaluevaluevaluevalue',
  };
  assert.strictEqual(schema.check(obj3).valid, false);

  const obj4 = {
    field1: 'value',
    field2: 100,
    field3: 'val',
  };
  assert.strictEqual(schema.check(obj4).valid, false);

  const obj5 = {
    field1: 'value',
    field2: 100,
  };
  assert.strictEqual(schema.check(obj5).valid, false);
});
