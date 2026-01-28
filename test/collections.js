'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { Schema } = require('..');

test('Collections: check collections', () => {
  const def1 = {
    field1: { array: 'number' },
  };
  const obj1 = {
    field1: [1, 2, 3],
  };
  const schema1 = Schema.from(def1);
  assert.strictEqual(schema1.check(obj1).valid, true);

  const def2 = {
    field1: { array: 'number' },
  };
  const obj2 = {
    field1: ['uno', 2, 3],
  };
  const schema2 = Schema.from(def2);
  assert.strictEqual(schema2.check(obj2).valid, false);

  const def3 = {
    field1: { object: { string: 'string' } },
  };
  const obj3 = {
    field1: { a: 'A', b: 'B' },
  };
  const schema3 = Schema.from(def3);
  assert.strictEqual(schema3.check(obj3).valid, true);

  const def4 = {
    field1: { object: { string: 'string' } },
  };
  const obj4 = {
    field1: { a: 1, b: 'B' },
  };
  const schema4 = Schema.from(def4);
  assert.strictEqual(schema4.check(obj4).valid, false);

  const def5 = {
    field1: { set: 'number' },
  };
  const obj5 = {
    field1: new Set([1, 2, 3]),
  };
  const schema5 = Schema.from(def5);
  assert.strictEqual(schema5.check(obj5).valid, true);

  const def6 = {
    field1: { set: 'number' },
  };
  const obj6 = {
    field1: new Set(['uno', 2, 3]),
  };
  const schema6 = Schema.from(def6);
  assert.strictEqual(schema6.check(obj6).valid, false);

  const def7 = {
    field1: { map: { string: 'string' } },
  };
  const obj7 = {
    field1: new Map([
      ['a', 'A'],
      ['b', 'B'],
    ]),
  };
  const schema7 = Schema.from(def7);
  assert.strictEqual(schema7.check(obj7).valid, true);

  const def8 = {
    field1: { map: { string: 'string' } },
  };
  const obj8 = {
    field1: new Map([
      ['a', 1],
      ['b', 'B'],
    ]),
  };
  const schema8 = Schema.from(def8);
  assert.strictEqual(schema8.check(obj8).valid, false);
});

test('Collections: check collections value', () => {
  const def1 = { array: 'number' };
  const obj1 = [1, 2, 3];
  const schema1 = Schema.from(def1);
  assert.strictEqual(schema1.check(obj1).valid, true);

  const def2 = { array: 'number' };
  const obj2 = ['uno', 2, 3];
  const schema2 = Schema.from(def2);
  assert.strictEqual(schema2.check(obj2).valid, false);

  const def3 = { object: { string: 'string' } };
  const obj3 = { a: 'A', b: 'B' };
  const schema3 = Schema.from(def3);
  assert.strictEqual(schema3.check(obj3).valid, true);

  const def4 = { object: { string: 'string' } };
  const obj4 = { a: 1, b: 'B' };
  const schema4 = Schema.from(def4);
  assert.strictEqual(schema4.check(obj4).valid, false);

  const def5 = { set: 'number' };
  const obj5 = new Set([1, 2, 3]);
  const schema5 = Schema.from(def5);
  assert.strictEqual(schema5.check(obj5).valid, true);

  const def6 = { set: 'number' };
  const obj6 = new Set(['uno', 2, 3]);
  const schema6 = Schema.from(def6);
  assert.strictEqual(schema6.check(obj6).valid, false);

  const def7 = { map: { string: 'string' } };
  const obj7 = new Map([
    ['a', 'A'],
    ['b', 'B'],
  ]);
  const schema7 = Schema.from(def7);
  assert.strictEqual(schema7.check(obj7).valid, true);

  const def8 = { map: { string: 'string' } };
  const obj8 = new Map([
    ['a', 1],
    ['b', 'B'],
  ]);
  const schema8 = Schema.from(def8);
  assert.strictEqual(schema8.check(obj8).valid, false);
});

test('Collections: check value with long form', () => {
  const def1 = { type: 'array', value: 'number' };
  const obj1 = [1, 2, 3];
  const schema1 = Schema.from(def1);
  assert.strictEqual(schema1.check(obj1).valid, true);

  const def2 = { type: 'array', value: 'number' };
  const obj2 = ['uno', 2, 3];
  const schema2 = Schema.from(def2);
  assert.strictEqual(schema2.check(obj2).valid, false);

  const def3 = { type: 'object', key: 'string', value: 'string' };
  const obj3 = { a: 'A', b: 'B' };
  const schema3 = Schema.from(def3);
  assert.strictEqual(schema3.check(obj3).valid, true);

  const def4 = { type: 'object', key: 'string', value: 'string' };
  const obj4 = { a: 1, b: 'B' };
  const schema4 = Schema.from(def4);
  assert.strictEqual(schema4.check(obj4).valid, false);

  const def5 = { type: 'set', value: 'number' };
  const obj5 = new Set([1, 2, 3]);
  const schema5 = Schema.from(def5);
  assert.strictEqual(schema5.check(obj5).valid, true);

  const def6 = { type: 'set', value: 'number' };
  const obj6 = new Set(['uno', 2, 3]);
  const schema6 = Schema.from(def6);
  assert.strictEqual(schema6.check(obj6).valid, false);

  const def7 = { type: 'map', key: 'string', value: 'string' };
  const obj7 = new Map([
    ['a', 'A'],
    ['b', 'B'],
  ]);
  const schema7 = Schema.from(def7);
  assert.strictEqual(schema7.check(obj7).valid, true);

  const def8 = { type: 'map', key: 'string', value: 'string' };
  const obj8 = new Map([
    ['a', 1],
    ['b', 'B'],
  ]);
  const schema8 = Schema.from(def8);
  assert.strictEqual(schema8.check(obj8).valid, false);
});

test('Collections: multiple nested arrays', () => {
  const defs1 = {
    Entity: {},
    name: {
      first: { type: 'string' },
      last: { type: 'string' },
      third: { type: '?string' },
    },
    age: { type: 'number' },
    levelOne: {
      levelTwo: {
        levelThree: { type: 'enum', enum: [1, 2, 3] },
      },
    },
    collection: { array: { array: 'number' } },
  };

  const schema1 = Schema.from(defs1);

  const obj1 = {
    name: {
      first: 'a',
      last: 'b',
    },
    age: 5,
    levelOne: { levelTwo: { levelThree: 1 } },
    collection: [
      [1, 2, 3],
      [3, 5, 6],
    ],
  };
  assert.strictEqual(schema1.check(obj1).valid, true);

  const defs2 = {
    array: {
      name: 'string',
      age: 'number',
      nest: {
        arr1: { array: { enum: [1, 2, 3] } },
        arr2: { array: { array: { object: { string: 'string' } } } },
      },
    },
  };
  const obj2 = [
    {
      name: 'A',
      age: 5,
      nest: {
        arr1: [1, 2, 3],
        arr2: [
          [{ hello: 'world' }, { your: 'world' }],
          [{ hello: 'world' }, { your: 'world' }],
        ],
      },
    },
    {
      name: 'A',
      age: 5,
      nest: {
        arr1: [1, 2, 3],
        arr2: [
          [{ hello: 'world' }, { your: 'world' }],
          [{ hello: 'world' }, { your: 'world' }],
        ],
      },
    },
  ];
  const schema2 = Schema.from(defs2);
  assert.strictEqual(schema2.check(obj2).valid, true);

  const obj3 = [
    {
      name: 'A',
      age: 5,
      nest: {
        arr1: [1, 2, 3],
        arr2: [
          [{ hello: 'world' }, { your: 'world' }],
          [{ hello: 'world' }, { your: 'world' }],
        ],
      },
    },
    {
      name: 'A',
      age: 5,
      nest: {
        arr1: [1, 2, 3],
        arr2: [
          [{ hello: 'world' }, { your: 1 }],
          [{ hello: 'world' }, { your: 2 }],
        ],
      },
    },
  ];

  assert.deepStrictEqual(schema2.check(obj3).errors, [
    'Field "[1].nest.arr2[0][1].your" not of expected type: string',
    'Field "[1].nest.arr2[1][1].your" not of expected type: string',
  ]);
});

test('Collections: optional shorthand key', () => {
  const defs1 = { 'array?': 'string' };
  const defs2 = { 'object?': { string: 'string' } };
  const defs3 = { 'set?': 'string' };
  const defs4 = { 'map?': { string: 'string' } };

  const sch1 = Schema.from(defs1);
  const sch2 = Schema.from(defs2);
  const sch3 = Schema.from(defs3);
  const sch4 = Schema.from(defs4);

  assert.strictEqual(sch1.check([]).valid, true);
  assert.strictEqual(sch2.check({}).valid, true);
  assert.strictEqual(sch3.check(new Set()).valid, true);
  assert.strictEqual(sch4.check(new Map()).valid, true);
});

test('Collections: nested object', () => {
  const defs1 = { object: { string: { array: 'string' } } };
  const defs2 = { type: 'object', key: 'string', value: { array: 'string' } };
  const defs3 = {
    type: 'object',
    key: 'string',
    value: {
      type: 'array',
      value: {
        type: 'object',
        key: 'string',
        value: { type: 'object', key: 'string', value: { name: 'string' } },
      },
    },
  };
  const defs4 = { 'object?': { string: { array: 'string' } } };

  const sch1 = Schema.from(defs1);
  const sch2 = Schema.from(defs2);
  const sch3 = Schema.from(defs3);
  const sch4 = Schema.from(defs4);

  assert.strictEqual(sch1.check({ key: ['hello', 'there'] }).valid, true);
  assert.strictEqual(sch1.check({ key: 'hello' }).valid, false);
  assert.strictEqual(sch1.check({}).valid, false);
  assert.strictEqual(sch2.check({ key: ['hello', 'there'] }).valid, true);
  assert.strictEqual(sch2.check({ key: 'hello' }).valid, false);
  assert.strictEqual(sch2.check({}).valid, false);
  assert.strictEqual(
    sch3.check({ key: [{ key: { key: { name: 'Georg' } } }] }).valid,
    true,
  );
  assert.strictEqual(
    sch3.check({ key: [{ key: { name: 'Georg' } }] }).valid,
    false,
  );
  assert.strictEqual(sch4.check({}).valid, true);
  assert.strictEqual(sch4.fields.required, false);
});
