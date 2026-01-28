'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { Schema, Model } = require('..');

test('Schema: constructor', () => {
  const definition = { field1: 'string' };
  const schema = new Schema('StructName', definition);
  assert.strictEqual(schema.name, 'StructName');
  assert.strictEqual(schema.kind, 'struct');
  assert.strictEqual(schema.scope, 'local');
  assert.strictEqual(schema.store, 'memory');
  assert.strictEqual(schema.allow, 'write');
  assert.strictEqual(typeof schema.fields, 'object');
  assert.strictEqual(typeof schema.indexes, 'object');
  assert.strictEqual(schema.options.validate, null);
  assert.strictEqual(schema.options.format, null);
  assert.strictEqual(schema.options.parse, null);
  assert.strictEqual(schema.options.serialize, null);
  assert.strictEqual(schema.fields.field1.type, 'string');
});

test('Schema: factory', () => {
  const definition = { field1: 'string' };

  const entities = new Map();
  entities.set('Person', { name: 'string' });
  const model = new Model({}, entities);

  const schema = Schema.from(definition, [model]);
  assert.strictEqual(schema.fields.field1.type, 'string');
});

test('Schema: generate ts interface', () => {
  const raw = {
    Dictionary: { scope: 'global' },
    name: { type: 'string', unique: true },
    addresses: { many: 'Address' },
  };

  const expected = `interface Company {
  name: string;
  addressesId: string[];
  companyId?: string;\n}`;

  const schema = new Schema('Company', raw);
  const iface = schema.toInterface();
  assert.strictEqual(iface, expected);
});

test('Schema: namespaces', () => {
  const raw = {
    name: { type: 'string', unique: true },
    addresses: { many: 'Address' },
  };

  const types = {};
  const entities = new Map();
  entities.set('Address', {
    city: 'string',
    street: 'string',
    building: 'string',
  });
  const model = new Model(types, entities);

  const schema = new Schema('Company', raw, [model]);
  assert.deepStrictEqual(schema.namespaces, new Set([model]));
  schema.detouch(model);
  assert.deepStrictEqual(schema.namespaces, new Set());
  schema.attach(model);
  assert.deepStrictEqual(schema.namespaces, new Set([model]));
});

test('Schema: check with namespaces', () => {
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
    name: 'Besarabsky Market',
    address: {
      city: 'Kiev',
      street: 'Besarabskaya Square',
      building: 2,
    },
  };
  assert.strictEqual(schema.check(data1).valid, true);

  const data2 = {
    name: 'Besarabsky Market',
    address: {
      street: 'Besarabskaya Square',
      building: '2',
    },
  };
  assert.strictEqual(schema.check(data2).valid, false);
});

test('Schema: validation function', () => {
  const definition = {
    field: '?string',
    validate: (value, path) => {
      if (value.field) return true;
      if (value.throw) throw new Error(value.throw);
      return `${path}.field is required`;
    },
  };
  const schema = Schema.from(definition);

  assert.strictEqual(
    schema.check({
      field: 'abc',
    }).valid,
    true,
  );

  assert.deepStrictEqual(
    schema.check({
      field2: 'abc',
    }).errors,
    ['Field "" .field is required', 'Field "field2" is not expected'],
  );

  assert.deepStrictEqual(
    schema.check({
      throw: '42',
    }).errors,
    ['Field "" validation failed Error: 42', 'Field "throw" is not expected'],
  );
});

test('Schema: validation function simple return', () => {
  const definition = {
    field: '?string',
    validate: (value) => value.field === '42',
  };
  const schema = Schema.from(definition);

  assert.strictEqual(schema.check({ field: '42' }).valid, true);
  assert.deepStrictEqual(schema.check({ field: '43' }).errors, [
    'Field "" validation error',
  ]);
});

test('Schema: nested validation function', () => {
  const definition = {
    field: 'string',
    nested: {
      schema: {
        field: { type: 'string', required: false },
        validate: (value, path) => {
          if (value.field) return true;
          if (value.throw) throw new Error(value.throw);
          return `${path}.field is required`;
        },
      },
      required: false,
    },
  };
  const schema = Schema.from(definition);

  assert.strictEqual(
    schema.check({
      field: 'abc',
    }).valid,
    true,
  );

  assert.deepStrictEqual(
    schema.check({
      field2: 'abc',
    }).errors,
    ['Field "field" is required', 'Field "field2" is not expected'],
  );

  assert.strictEqual(
    schema.check({
      field: 'abc',
      nested: {
        field: 'abc',
      },
    }).valid,
    true,
  );

  assert.deepStrictEqual(
    schema.check({
      field: 'abc',
      nested: {
        field2: 'abc',
      },
    }).errors,
    [
      'Field "field2" is not expected',
      'Field "nested" nested.field is required',
    ],
  );

  assert.deepStrictEqual(
    schema.check({
      field: 'abc',
      nested: {
        throw: '42',
      },
    }).errors,
    [
      'Field "throw" is not expected',
      'Field "nested" validation failed Error: 42',
    ],
  );
});

test('Schema: calculated', () => {
  const definition = {
    filename: 'string',
    size: 'number',
    compression: {
      size: 'number',
      ratio: (file) => file.compression.size / file.size,
    },
  };
  const obj = {
    filename: 'file.ext',
    size: 54321,
    compression: {
      size: 12345,
    },
  };
  const schema = Schema.from(definition);
  assert.strictEqual(schema.check(obj).valid, true);
});

test('Schema: custom function definition', () => {
  const defs = {
    custom: () => 10,
  };
  const schema = Schema.from(defs);
  assert.strictEqual(schema.fields.custom(), 10);
  assert.strictEqual(schema.check({}).valid, true);
});

test('Schema: reserved fields permitted with Kind exept "required"', () => {
  const defs = {
    Struct: {},
    required: 'string',
    type: 'string',
    note: 'string',
  };
  const schema = Schema.from(defs);
  assert.strictEqual(
    schema.check({
      required: 'yes',
      type: 'myType',
      note: 'this is not vorbidden anymore',
    }).valid,
    true,
  );
  assert.strictEqual(
    schema.check({
      note: 'this is not vorbidden anymore',
    }).valid,
    false,
  );
});

test('Schema: custom validate on field', () => {
  const defs1 = {
    email: {
      type: 'string',
      required: true,
      length: { min: 2, max: 15 },
      validate(src) {
        if (src.indexOf('@') === -1) {
          return 'Not an Email';
        }
        const [, domain] = src.split('@');
        if (domain.length <= 2) return 'Not an Email';
        return null;
      },
    },
  };

  const schema1 = Schema.from(defs1);
  assert.deepStrictEqual(schema1.check({ email: 12345 }).errors, [
    'Field "email" not of expected type: string',
    'Field "email" validation failed TypeError: src.indexOf is not a function',
  ]);
  assert.deepStrictEqual(schema1.check({ email: 'ab' }).errors, [
    'Field "email" Not an Email',
  ]);
  assert.strictEqual(schema1.check({ email: 'asd@asd.com' }).valid, true);
  assert.deepStrictEqual(
    schema1.check({ email: 'asdasdasdasdasdasd@asd.com' }).errors,
    ['Field "email" exceeds the maximum length'],
  );
  const defs2 = {
    type: 'number',
    validate(num) {
      if (num !== 10) throw new Error('Not a ten');
    },
  };
  const defs3 = {
    type: 'number',
    validate(num) {
      if (num !== 10) return 'Not a ten';
      return null;
    },
  };
  const defs4 = {
    type: 'number',
    validate(num) {
      if (num !== 10) return ['Not', 'a', 'ten'];
      return null;
    },
  };
  const schema2 = Schema.from(defs2);
  const schema3 = Schema.from(defs3);
  const schema4 = Schema.from(defs4);
  assert.deepStrictEqual(schema2.check(12).errors, [
    'Field "" validation failed Error: Not a ten',
  ]);
  assert.deepStrictEqual(schema3.check(12).errors, ['Field "" Not a ten']);
  assert.deepStrictEqual(schema4.check(12).errors, [
    'Field "" Not',
    'Field "" a',
    'Field "" ten',
  ]);
  assert.strictEqual(schema2.check(10).valid, true);
  assert.strictEqual(schema3.check(10).valid, true);
  assert.strictEqual(schema4.check(10).valid, true);
  const defs5 = { num: { type: 'number', validate: (num) => num === 10 } };
  const schema5 = Schema.from(defs5);
  assert.strictEqual(schema5.check({ num: 12 }).valid, false);
  assert.strictEqual(schema5.check({ num: 10 }).valid, true);
});

test('Schema: with custom kind', () => {
  const defs = { Custom: {}, type: 'string' };
  const schema = Schema.from(defs);
  assert.strictEqual(schema.kind, 'custom');
  assert.strictEqual(schema.check({ type: 'type' }).valid, true);
});

test('Schema: custom kind metadata', () => {
  const defs = { Custom: { myMetadata: 'data' }, type: 'string' };
  const schema = Schema.from(defs);
  assert.deepStrictEqual(schema.custom, { myMetadata: 'data' });
});

test('Schema: with number field name', () => {
  const schema = Schema.from({
    Dynamic: {},
    field: 'string',
    1234: { type: 'number' },
  });
  assert.strictEqual(schema.kind, 'dynamic');
  assert.strictEqual(schema.check({ 1234: 42, field: 'type' }).valid, true);
});

test('Schema: toString, JSON.stringify', () => {
  const schema = Schema.from({ a: 'string' });
  assert.strictEqual(
    schema.toString(),
    '{"a":{"required":true,"type":"string"}}',
  );
  assert.strictEqual(
    JSON.stringify(schema),
    '{"a":{"required":true,"type":"string"}}',
  );
});
