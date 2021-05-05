'use strict';

const metatests = require('metatests');
const { createSchema, loadSchema } = require('..');

metatests.test('Schema: createSchema', (test) => {
  const definition = `({ field1: 'string' })`;
  const schema = createSchema('StructName', definition);
  test.strictSame(typeof schema.fields, 'object');
  test.strictSame(schema.fields.field1.type, 'string');
  test.end();
});

metatests.test('Schema: loadSchema', async (test) => {
  const schema = await loadSchema('./test/examples/struct.js');
  test.strictSame(schema.fields.field1.type, 'string');
  test.strictSame(schema.fields.field2.type, 'number');
  test.end();
});
