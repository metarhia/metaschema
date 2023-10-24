'use strict';

const metatests = require('metatests');
const { getKindMetadata } = require('../lib/kinds.js');

metatests.test('Kinds: Projection', (test) => {
  const getProjectionMeta = getKindMetadata.bind(null, 'projection');
  {
    const meta = {
      schema: 'Account',
      fields: ['login', 'password'],
      etc: ['another', 'field'],
    };
    test.throws(
      () => getProjectionMeta({}, null),
      new Error('Invalid Projection: "schema" expected'),
    );
    test.throws(
      () => getProjectionMeta({ schema: 'Account' }, null),
      new Error('Invalid Projection: non-empty "fields" array expected'),
    );
    test.throws(
      () => getProjectionMeta(meta, null),
      new Error('Invalid Projection: "root" should satisfy Schema API'),
    );
    test.doesNotThrow(() =>
      getProjectionMeta(meta, { findReference: new Function() }),
    );
  }

  {
    const meta = {
      schema: 'Account',
      fields: ['login', 'password'],
      etc: ['another', 'field'],
    };
    const { defs, metadata } = getProjectionMeta(meta, {
      findReference: new Function(),
    });
    test.strictEqual(metadata.kind, 'projection');
    test.strictEqual(metadata.scope, 'local');
    test.strictEqual(metadata.store, 'memory');
    test.strictEqual(metadata.allow, 'write');
    test.strictEqual(metadata.parent, 'Account');
    test.strictEqual(metadata.fields, ['login', 'password']);
    test.strictEqual(Object.keys(defs).length, 0);
  }

  {
    const meta = {
      scope: 'system',
      store: 'persistent',
      allow: 'append',
      schema: 'Account',
      fields: ['login', 'password', 'otp'],
    };
    const root = {
      findReference: (schemaName) => ({
        name: schemaName,
        fields: {
          login: 'any',
          password: 'string',
          otpNotMentioned: 'here',
        },
      }),
    };
    const { defs, metadata } = getProjectionMeta(meta, root);
    test.strictEqual(metadata.kind, 'projection');
    test.strictEqual(metadata.scope, 'system');
    test.strictEqual(metadata.store, 'persistent');
    test.strictEqual(metadata.allow, 'append');
    test.strictEqual(metadata.parent, 'Account');
    test.strictEqual(metadata.fields, ['login', 'password', 'otp']);
    test.strictEqual(Object.keys(defs).length, 3);
    test.strictEqual(defs.login, 'any');
    test.strictEqual(defs.password, 'string');
    test.strictEqual(defs.otp, undefined);
  }

  test.end();
});
