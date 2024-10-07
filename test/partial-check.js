'use strict';

const metatests = require('metatests');
const { Schema } = require('..');
const { Model } = require('../metaschema');

metatests.test('Scalars: partialCheck scalar', (test) => {
  const def1 = { type: 'string', required: true };
  const schema1 = Schema.from(def1);
  test.strictSame(schema1.partialCheck('value').valid, true);
  test.strictSame(schema1.partialCheck(null).valid, true);

  const def2 = 'string';
  const schema2 = Schema.from(def2);
  test.strictSame(schema2.partialCheck('value').valid, true);
  test.strictSame(schema1.partialCheck(null).valid, true);

  test.end();
});
metatests.test('Schema: partialCheck enum', (test) => {
  const definition = { field: { enum: ['uno', 'due', 'tre'], required: true } };
  const schema = Schema.from(definition);
  test.strictSame(schema.partialCheck({ field: 'uno' }).valid, true);
  test.strictSame(schema.partialCheck({ field: null }).valid, true);
  test.strictSame(schema.partialCheck({}).valid, true);

  test.end();
});

metatests.test('Scalars: partialCheck null value', (test) => {
  const def = {
    field1: { type: 'string', required: true },
    field2: 'string',
    field3: 'string',
  };
  const schema = Schema.from(def);
  const obj1 = { field1: null, field2: null, field3: null };
  test.strictSame(schema.partialCheck({ field4: null }).errors, [
    'Field "field4" is not expected',
  ]);
  test.strictSame(schema.partialCheck(obj1).valid, true);
  test.strictSame(schema.partialCheck({}).valid, true);
  test.end();
});

metatests.test('Rules: length partialCheck', (test) => {
  const definition = {
    field1: 'string',
    field2: { type: 'number' },
    field3: { type: 'string', length: { min: 5, max: 30 } },
  };
  const schema = Schema.from(definition);

  const obj1 = {
    field3: 'valuevaluevaluevaluevaluevaluevaluevalue',
  };
  test.strictSame(schema.partialCheck(obj1).errors, [
    'Field "field3" exceeds the maximum length',
  ]);

  const obj2 = {
    field1: 'value',
    field2: 'value',
  };
  test.strictSame(schema.partialCheck(obj2).errors, [
    'Field "field2" not of expected type: number',
  ]);

  const obj3 = {
    field4: 'value',
  };
  test.strictSame(schema.partialCheck(obj3).errors, [
    'Field "field4" is not expected',
  ]);

  const obj4 = {};
  test.strictSame(schema.partialCheck(obj4).valid, true);

  const obj5 = {
    field1: 'value',
    field2: 100,
    field3: 'valuevaluevalue',
  };
  test.strictSame(schema.partialCheck(obj5).valid, true);

  test.end();
});

metatests.test('Collections: partialCheck collections', (test) => {
  const def1 = {
    field1: { array: 'number' },
  };
  const obj1 = {};
  const schema1 = Schema.from(def1);
  test.strictSame(schema1.partialCheck(obj1).valid, true);

  const obj2 = {
    field1: null,
  };
  test.strictSame(schema1.partialCheck(obj2).valid, true);

  const obj3 = {
    field1: [],
  };
  test.strictSame(schema1.partialCheck(obj3).valid, true);

  const obj4 = {
    field1: [1, 2, 3],
  };
  test.strictSame(schema1.partialCheck(obj4).valid, true);

  const obj5 = {
    field1: ['uno', 2, 3],
  };
  test.strictSame(schema1.partialCheck(obj5).valid, false);

  const def2 = {
    field1: { object: { string: 'string' } },
  };
  const obj6 = {
    field1: { a: 'A', b: 'B' },
  };
  const schema2 = Schema.from(def2);
  test.strictSame(schema2.partialCheck(obj6).valid, true);

  const obj7 = {
    field1: { a: 1, b: 'B' },
  };
  test.strictSame(schema2.partialCheck(obj7).valid, false);

  const obj8 = {
    field1: {},
  };
  test.strictSame(schema2.partialCheck(obj8).valid, true);

  const obj9 = {};
  test.strictSame(schema2.partialCheck(obj9).valid, true);

  const def3 = {
    field1: { set: 'number' },
  };
  const obj10 = {
    field1: new Set([1, 2, 3]),
  };
  const schema3 = Schema.from(def3);
  test.strictSame(schema3.partialCheck(obj10).valid, true);

  const obj11 = {};
  test.strictSame(schema3.partialCheck(obj11).valid, true);

  const def4 = {
    field1: { map: { string: 'string' } },
  };
  const obj12 = {
    field1: new Map([
      ['a', 'A'],
      ['b', 'B'],
    ]),
  };
  const schema4 = Schema.from(def4);
  test.strictSame(schema4.partialCheck(obj12).valid, true);

  const obj13 = {};
  test.strictSame(schema4.partialCheck(obj13).valid, true);

  test.end();
});

metatests.test('Struct: partialCheck json type as any plain object', (test) => {
  const defs = { name: 'json' };
  const schema = Schema.from(defs);
  test.strictEqual(schema.partialCheck({ name: { a: 'b' } }).valid, true);
  test.strictEqual(schema.partialCheck({ name: null }).valid, true);
  test.strictEqual(schema.partialCheck({}).valid, true);
  test.end();
});

metatests.test('Tuple: with field names', (test) => {
  const defs1 = [{ sum: 'number' }, { length: 'string' }];
  const schema1 = Schema.from(defs1);
  test.strictEqual(schema1.partialCheck([1, '123']).valid, true);
  test.strictEqual(schema1.partialCheck([1]).valid, true);
  test.strictEqual(schema1.partialCheck(null).valid, true);
  test.end();
});

metatests.test('Schema: partialCheck with namespaces', (test) => {
  const raw = {
    name: { type: 'string', unique: true },
    address: 'Address',
  };

  const entities = new Map();
  entities.set('Address', {
    city: 'string',
    street: 'string',
    building: 'number',
  });
  const model = new Model({}, entities);
  const schema = new Schema('Company', raw, [model]);

  const data1 = {
    address: {
      building: 2,
    },
  };
  test.strictSame(schema.partialCheck(data1).valid, true);

  const data2 = {};
  test.strictSame(schema.partialCheck(data2).valid, true);

  test.end();
});
