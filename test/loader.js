'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { createSchema, loadSchema, loadModel } = require('..');

const types = {
  string: { metadata: { pg: 'varchar' } },
  number: { metadata: { pg: 'integer' } },
  boolean: { metadata: { pg: 'boolean' } },
  datetime: { js: 'string', metadata: { pg: 'timestamp with time zone' } },
  text: { js: 'string', metadata: { pg: 'text' } },
  json: { js: 'schema', metadata: { pg: 'jsonb' } },
};

test('Loader: createSchema', () => {
  const definition = `({ field1: 'string' })`;
  const schema = createSchema('StructName', definition);
  assert.strictEqual(typeof schema.fields, 'object');
  assert.strictEqual(schema.fields.field1.type, 'string');
});

test('Loader: loadSchema', async () => {
  const schema = await loadSchema('./test/examples/struct.js');
  assert.strictEqual(schema.fields.field1.type, 'string');
  assert.strictEqual(schema.fields.field2.type, 'number');
});

test('Loader: loadModel, projection', async () => {
  const model = await loadModel(process.cwd() + '/test/schemas', types);
  assert.strictEqual(model.entities.size, 6);
  const Account = model.entities.get('Account');
  assert.strictEqual(Account.fields.fullName.constructor.type, 'schema');
  assert.strictEqual(Account.fields.fullName.constructor.name, 'Type');
  assert.strictEqual(model.order.size, 6);
  assert.strictEqual(typeof model.types, 'object');
  assert.strictEqual(typeof model.database, 'object');
  const Projection = model.entities.get('Signin');
  assert.strictEqual(Projection.fields.login.type, Account.fields.login.type);
  assert.strictEqual(
    Projection.fields.login.required,
    Account.fields.login.required,
  );
  assert.strictEqual(
    Projection.fields.login.unique,
    Account.fields.login.unique,
  );
  assert.strictEqual(
    Projection.fields.password.type,
    Account.fields.password.type,
  );
  assert.strictEqual(
    Projection.fields.password.required,
    Account.fields.password.required,
  );
  const EarlyProjection = model.entities.get('Aaa');
  assert.strictEqual(
    Projection.fields.login.type,
    EarlyProjection.fields.login.type,
  );
  assert.strictEqual(
    Projection.fields.login.required,
    EarlyProjection.fields.login.required,
  );
  assert.strictEqual(
    Projection.fields.login.unique,
    EarlyProjection.fields.login.unique,
  );
  assert.strictEqual(
    Projection.fields.password.type,
    EarlyProjection.fields.password.type,
  );
  assert.strictEqual(
    Projection.fields.password.required,
    EarlyProjection.fields.password.required,
  );
});
