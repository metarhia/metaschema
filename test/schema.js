'use strict';

const metatests = require('metatests');
const { Schema, Model } = require('..');

metatests.test('Schema: constructor', (test) => {
  const definition = { field1: 'string' };
  const schema = new Schema('StructName', definition);
  test.strictSame(schema.name, 'StructName');
  test.strictSame(schema.kind, 'struct');
  test.strictSame(schema.scope, 'local');
  test.strictSame(schema.store, 'memory');
  test.strictSame(schema.allow, 'write');
  test.strictSame(typeof schema.fields, 'object');
  test.strictSame(typeof schema.indexes, 'object');
  test.strictSame(schema.options.validate, null);
  test.strictSame(schema.options.format, null);
  test.strictSame(schema.options.parse, null);
  test.strictSame(schema.options.serialize, null);
  test.strictSame(schema.fields.field1.type, 'string');
  test.end();
});

metatests.test('Schema: factory', (test) => {
  const definition = { field1: 'string' };

  const entities = new Map();
  entities.set('Person', { name: 'string' });
  const model = new Model({}, entities);

  const schema = Schema.from(definition, [model]);
  test.strictSame(schema.fields.field1.type, 'string');
  test.end();
});

metatests.test('Schema: generate ts interface', (test) => {
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
  test.strictEqual(iface, expected);
  test.end();
});

metatests.test('Schema: namespaces', (test) => {
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
  test.strictEqual(schema.namespaces, new Set([model]));
  schema.detouch(model);
  test.strictEqual(schema.namespaces, new Set());
  schema.attach(model);
  test.strictEqual(schema.namespaces, new Set([model]));
  test.end();
});

metatests.test('Schema: check with namespaces', (test) => {
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
  test.strictSame(schema.check(data1).valid, true);

  const data2 = {
    name: 'Besarabsky Market',
    address: {
      street: 'Besarabskaya Square',
      building: '2',
    },
  };
  test.strictSame(schema.check(data2).valid, false);

  test.end();
});

metatests.test('Schema: validation function', (test) => {
  const definition = {
    field: '?string',
    validate: test.mustCall((value, path) => {
      if (value.field) return true;
      if (value.throw) throw new Error(value.throw);
      return `${path}.field is required`;
    }, 3),
  };
  const schema = Schema.from(definition);

  test.strictSame(
    schema.check({
      field: 'abc',
    }).valid,
    true,
  );

  test.strictSame(
    schema.check({
      field2: 'abc',
    }).errors,
    ['Field "" .field is required', 'Field "field2" is not expected'],
  );

  test.strictSame(
    schema.check({
      throw: '42',
    }).errors,
    ['Field "" validation failed Error: 42', 'Field "throw" is not expected'],
  );

  test.end();
});

metatests.test('Schema: validation function simple return', (test) => {
  const definition = {
    field: '?string',
    validate: test.mustCall((value) => value.field === '42', 2),
  };
  const schema = Schema.from(definition);

  test.strictSame(schema.check({ field: '42' }).valid, true);
  test.strictSame(schema.check({ field: '43' }).errors, [
    'Field "" validation error',
  ]);

  test.end();
});

metatests.test('Schema: nested validation function', (test) => {
  const definition = {
    field: 'string',
    nested: {
      schema: {
        field: { type: 'string', required: false },
        validate: test.mustCall((value, path) => {
          if (value.field) return true;
          if (value.throw) throw new Error(value.throw);
          return `${path}.field is required`;
        }, 3),
      },
      required: false,
    },
  };
  const schema = Schema.from(definition);

  test.strictSame(
    schema.check({
      field: 'abc',
    }).valid,
    true,
  );

  test.strictSame(
    schema.check({
      field2: 'abc',
    }).errors,
    ['Field "field" is required', 'Field "field2" is not expected'],
  );

  test.strictSame(
    schema.check({
      field: 'abc',
      nested: {
        field: 'abc',
      },
    }).valid,
    true,
  );

  test.strictSame(
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

  test.strictSame(
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
  test.end();
});

metatests.test('Schema: calculated', (test) => {
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
  test.strictSame(schema.check(obj).valid, true);
  test.end();
});

metatests.test('Schema: custom function definition', (test) => {
  const defs = {
    custom: () => 10,
  };
  const schema = Schema.from(defs);
  test.strictSame(schema.fields.custom(), 10);
  test.strictSame(schema.check({}).valid, true);
  test.end();
});

metatests.test(
  'Schema: reserved fields permitted with Kind exept "required"',
  (test) => {
    const defs = {
      Struct: {},
      required: 'string',
      type: 'string',
      note: 'string',
    };
    const schema = Schema.from(defs);
    test.strictSame(
      schema.check({
        required: 'yes',
        type: 'myType',
        note: 'this is not vorbidden anymore',
      }).valid,
      true,
    );
    test.strictSame(
      schema.check({
        note: 'this is not vorbidden anymore',
      }).valid,
      false,
    );
    test.end();
  },
);

metatests.test('Schema: custom validate on field', (test) => {
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
  test.strictEqual(schema1.check({ email: 12345 }).errors, [
    'Field "email" not of expected type: string',
    'Field "email" validation failed TypeError: src.indexOf is not a function',
  ]);
  test.strictEqual(schema1.check({ email: 'ab' }).errors, [
    'Field "email" Not an Email',
  ]);
  test.strictEqual(schema1.check({ email: 'asd@asd.com' }).valid, true);
  test.strictEqual(
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
  test.strictSame(schema2.check(12).errors, [
    'Field "" validation failed Error: Not a ten',
  ]);
  test.strictSame(schema3.check(12).errors, ['Field "" Not a ten']);
  test.strictSame(schema4.check(12).errors, [
    'Field "" Not',
    'Field "" a',
    'Field "" ten',
  ]);
  test.strictSame(schema2.check(10).valid, true);
  test.strictSame(schema3.check(10).valid, true);
  test.strictSame(schema4.check(10).valid, true);
  const defs5 = { num: { type: 'number', validate: (num) => num === 10 } };
  const schema5 = Schema.from(defs5);
  test.strictSame(schema5.check({ num: 12 }).valid, false);
  test.strictSame(schema5.check({ num: 10 }).valid, true);
  test.end();
});

metatests.test('Schema: with custom kind', (test) => {
  const defs = { Custom: {}, type: 'string' };
  const schema = Schema.from(defs);
  test.strictEqual(schema.kind, 'custom');
  test.strictSame(schema.check({ type: 'type' }).valid, true);
  test.end();
});

metatests.test('Schema: custom kind metadata', (test) => {
  const defs = { Custom: { myMetadata: 'data' }, type: 'string' };
  const schema = Schema.from(defs);
  test.strictEqual(schema.custom, { myMetadata: 'data' });
  test.end();
});

metatests.testSync('Schema: with number field name', (test) => {
  const schema = Schema.from({
    Dynamic: {},
    field: 'string',
    1234: { type: 'number' },
  });
  test.strictEqual(schema.kind, 'dynamic');
  test.strictSame(schema.check({ 1234: 42, field: 'type' }).valid, true);
  test.end();
});

metatests.testSync('Schema: toString', (test) => {
  const schema = Schema.from({ a: 'string' });
  test.strictEqual(
    schema.toString(),
    '{"a":{"required":true,"type":"string"}}',
  );
  test.end();
});
