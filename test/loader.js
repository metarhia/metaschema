'use strict';

const metatests = require('metatests');
const { createSchema, loadSchema, loadModel } = require('..');

const types = {
  string: 'varchar',
  number: 'integer',
  boolean: 'boolean',
  datetime: { js: 'string', pg: 'timestamp with time zone' },
  text: { js: 'string', pg: 'text' },
  json: { js: 'schema', pg: 'jsonb' },
};

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

metatests.test('Model: loadModel', async (test) => {
  const model = await loadModel(process.cwd() + '/test/schemas', types);
  test.strictEqual(model.entities.size, 5);
  const Account = model.entities.get('Account');
  test.strictEqual(Account.fields.fullName.type, 'schema');
  test.strictEqual(Account.fields.fullName.schema.constructor.name, 'Schema');
  test.strictEqual(model.order.size, 5);
  test.strictEqual(typeof model.types, 'object');
  test.strictEqual(typeof model.database, 'object');
  test.end();
});
