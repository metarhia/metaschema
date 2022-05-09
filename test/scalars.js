'use strict';

const metatests = require('metatests');
const { Schema } = require('../metaschema');

metatests.test('Scalars: schema shorthand', (test) => {
  const definition = {
    field1: {
      n: { type: 'number', default: 100 },
      c: { type: 'string', shorthand: true },
    },
  };
  const schema = Schema.from(definition);

  const obj1 = { field1: 'value' };
  test.strictSame(schema.check(obj1).valid, false);

  const obj2 = { field1: 1 };
  test.strictSame(schema.check(obj2).valid, false);

  const obj3 = { field1: { n: 1, c: 'value' } };
  test.strictSame(schema.check(obj3).valid, true);

  test.end();
});

metatests.test('Scalars: schema required shorthand', (test) => {
  const definition1 = { name: '?string' };
  const schema1 = Schema.from(definition1);

  const definition2 = { name: { type: '?string' } };
  const schema2 = Schema.from(definition2);

  const obj1 = { name: 'value' };
  test.strictSame(schema1.check(obj1).valid, true);
  test.strictSame(schema2.check(obj1).valid, true);

  const obj2 = {};
  test.strictSame(schema1.check(obj2).valid, true);
  test.strictSame(schema2.check(obj2).valid, true);

  const obj3 = { name: 100 };
  test.strictSame(schema1.check(obj3).valid, false);
  test.strictSame(schema2.check(obj3).valid, false);

  test.end();
});

metatests.test('Scalars: check scalar', (test) => {
  const def1 = { type: 'string' };
  const schema1 = Schema.from(def1);
  test.strictSame(schema1.check('value').valid, true);
  test.strictSame(schema1.check(1917).valid, false);
  test.strictSame(schema1.check(true).valid, false);
  test.strictSame(schema1.check({}).valid, false);

  const def2 = 'string';
  const schema2 = Schema.from(def2);
  test.strictSame(schema2.check('value').valid, true);
  test.strictSame(schema2.check(1917).valid, false);
  test.strictSame(schema2.check(true).valid, false);
  test.strictSame(schema2.check({}).valid, false);

  test.end();
});

metatests.test('Scalars: check enum', (test) => {
  const definition = { field: { enum: ['uno', 'due', 'tre'] } };
  const schema = Schema.from(definition);
  test.strictSame(schema.check({ field: 'uno' }).valid, true);
  test.strictSame(schema.check({ field: 'due' }).valid, true);
  test.strictSame(schema.check({ field: 'tre' }).valid, true);
  test.strictSame(schema.check({ field: 'quatro' }).valid, false);
  test.strictSame(schema.check({ field: 100 }).valid, false);
  test.strictSame(schema.check({}).valid, false);

  const def1 = { field: { enum: ['uno', 'due', 'tre'], required: false } };
  const schema1 = Schema.from(def1);
  test.strictSame(schema1.check({ field: 'uno' }).valid, true);

  const def2 = { field: { enum: ['uno', 'due', 'tre'], required: false } };
  const schema2 = Schema.from(def2);
  test.strictSame(schema2.check({ field: 'quatro' }).valid, false);

  const def3 = { field: { enum: ['uno', 'due', 'tre'], required: false } };
  const schema3 = Schema.from(def3);
  test.strictSame(schema3.check({}).valid, true);

  const def4 = { field: { array: 'number', required: false } };
  const schema4 = Schema.from(def4);
  test.strictSame(schema4.check({ field: [1, 2, 3] }).valid, true);

  const def5 = { field: { array: 'number', required: false } };
  const schema5 = Schema.from(def5);
  test.strictSame(schema5.check({ field: ['uno', 2, 3] }).valid, false);

  const def6 = { field: { array: 'number', required: false } };
  const schema6 = Schema.from(def6);
  test.strictSame(schema6.check({}).valid, true);

  test.end();
});

metatests.test('Scalars: check enum value', (test) => {
  const def1 = { enum: ['uno', 'due', 'tre'] };
  const schema1 = Schema.from(def1);
  test.strictSame(schema1.check('uno').valid, true);
  test.strictSame(schema1.check('due').valid, true);
  test.strictSame(schema1.check('tre').valid, true);
  test.strictSame(schema1.check('quatro').valid, false);
  test.strictSame(schema1.check(100).valid, false);

  const def2 = { enum: ['uno', 'due', 'tre'], required: false };
  const schema2 = Schema.from(def2);
  test.strictSame(schema2.check('uno').valid, true);
  test.strictSame(schema2.check('due').valid, true);
  test.strictSame(schema2.check('tre').valid, true);
  test.strictSame(schema2.check('quatro').valid, false);
  test.strictSame(schema2.check(100).valid, false);

  test.end();
});
