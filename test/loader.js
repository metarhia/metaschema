'use strict';

const metatests = require('metatests');
const { createSchema, loadSchema, loadModel } = require('..');

const types = {
  string: { metadata: { pg: 'varchar' } },
  number: { metadata: { pg: 'integer' } },
  boolean: { metadata: { pg: 'boolean' } },
  datetime: { js: 'string', metadata: { pg: 'timestamp with time zone' } },
  text: { js: 'string', metadata: { pg: 'text' } },
  json: { js: 'schema', metadata: { pg: 'jsonb' } },
};

metatests.test('Loader: createSchema', (test) => {
  const definition = `({ field1: 'string' })`;
  const schema = createSchema('StructName', definition);
  test.strictSame(typeof schema.fields, 'object');
  test.strictSame(schema.fields.field1.type, 'string');
  test.end();
});

metatests.test('Loader: loadSchema', async (test) => {
  const schema = await loadSchema('./test/examples/struct.js');
  test.strictSame(schema.fields.field1.type, 'string');
  test.strictSame(schema.fields.field2.type, 'number');
  test.end();
});

metatests.test('Loader: loadModel, projection', async (test) => {
  const model = await loadModel(process.cwd() + '/test/schemas', types);
  test.strictEqual(model.entities.size, 6);
  const Account = model.entities.get('Account');
  test.strictEqual(Account.fields.fullName.type, 'schema');
  test.strictEqual(Account.fields.fullName.schema.constructor.name, 'Schema');
  test.strictEqual(model.order.size, 6);
  test.strictEqual(typeof model.types, 'object');
  test.strictEqual(typeof model.database, 'object');
  const Projection = model.entities.get('Signin');
  test.strictEqual(Projection.fields.login, Account.fields.login);
  test.strictEqual(Projection.fields.password, Account.fields.password);
  const EarlyProjection = model.entities.get('Aaa');
  test.strictEqual(Projection.fields.login, EarlyProjection.fields.login);
  test.strictEqual(Projection.fields.password, EarlyProjection.fields.password);
  test.end();
});
