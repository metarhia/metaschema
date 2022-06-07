/* eslint-disable no-undef */
'use strict';

const metatests = require('metatests');
const { Schema } = require('../metaschema');

metatests.test('Tuple: basic implementation', (test) => {
  const short1 = ['string', 'number', '?number'];
  const schema1 = Schema.from(short1);
  test.strictEqual(schema1.kind, 'struct');
  test.strictEqual(schema1.fields.value.length, short1.length);
  test.contains(schema1.fields.value[0], { type: 'string', required: true });
  test.contains(schema1.fields.value[1], { type: 'number', required: true });
  test.contains(schema1.fields.value[2], { type: 'number', required: false });
  test.strictEqual(schema1.check(['abc', 1]).valid, true);
  test.strictEqual(schema1.check(['abc', 1, 2]).valid, true);
  test.strictEqual(schema1.check(['abc', 'ab', 2]).errors, [
    'Field "(item1)" not of expected type: number',
  ]);
  test.strictEqual(schema1.check(['abc', 2, 2, 123]).errors, [
    'Field "" value length is more then expected in tuple',
  ]);

  const short2 = { tuple: ['bigint', 'boolean'] };
  const schema2 = Schema.from(short2);
  test.contains(schema2.fields.value[0], { type: 'bigint', required: true });
  test.contains(schema2.fields.value[1], { type: 'boolean', required: true });
  test.strictEqual(schema2.check([BigInt(9007199254740991), true]).valid, true);
  test.strictEqual(schema2.check(['abc', 1]).errors, [
    'Field "(item0)" not of expected type: bigint',
  ]);
  test.strictEqual(
    schema2.check([BigInt(9007199254740991), false, 123]).errors,
    ['Field "" value length is more then expected in tuple']
  );

  const long = { type: 'tuple', value: ['string'] };
  const schema3 = Schema.from(long);
  test.contains(schema3.fields.value[0], { type: 'string', required: true });
  test.end();
});

metatests.test('Tuple: with field names', (test) => {
  const defs1 = [{ sum: 'number' }, { length: 'string' }];
  const schema1 = Schema.from(defs1);
  test.contains(schema1.fields.value[0], {
    type: 'number',
    required: true,
    name: 'sum',
  });
  test.contains(schema1.fields.value[1], {
    type: 'string',
    required: true,
    name: 'length',
  });
  test.strictEqual(schema1.check([1, '123']).valid, true);
  test.strictEqual(schema1.check([1]).errors, [
    'Field "(length1)" not of expected type: string',
  ]);
  test.end();
});

metatests.test('Tuple: usage with schema', (test) => {
  const defs = { field: ['boolean', { count: 'number' }] };
  const schema = Schema.from(defs);
  test.contains(schema.fields.field.value[0], {
    type: 'boolean',
    required: true,
  });
  test.contains(schema.fields.field.value[1], {
    type: 'number',
    required: true,
    name: 'count',
  });
  test.strictEqual(schema.check({ field: [true, 123] }).valid, true);
  test.strictEqual(
    schema.check({ field: [false, { some: 'wrong data' }] }).errors,
    ['Field "field(count1)" not of expected type: number']
  );
  test.end();
});
