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
  test.strictSame(typeof schema.validate, 'function');
  test.strictSame(typeof schema.format, 'function');
  test.strictSame(typeof schema.parse, 'function');
  test.strictSame(typeof schema.serialize, 'function');
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

metatests.test('Schema: preprocess', (test) => {
  const definition = {
    field1: 'string',
    field2: { type: 'number' },
    field3: { type: 'string', length: 30 },
    field4: { type: 'string', length: { min: 10 } },
    field5: { type: 'string', length: [5, 60] },
  };
  const schema = Schema.from(definition);
  test.strictSame(schema.fields.field1.type, 'string');
  test.strictSame(schema.fields.field2.required, true);
  test.strictSame(schema.fields.field3.length.max, 30);
  test.strictSame(schema.fields.field4.length.min, 10);
  test.strictSame(schema.fields.field5.length.max, 60);
  test.strictSame(schema.fields.field5.length.min, 5);
  test.end();
});

metatests.test('Schema: check', (test) => {
  const definition = {
    field1: 'string',
    field2: { type: 'number' },
    field3: { type: 'string', length: 30 },
    field4: { type: 'string', required: false },
    field5: {
      subfield1: 'number',
      subfield2: { type: 'string', required: false },
    },
  };
  const obj = {
    field1: 'value',
    field2: 100,
    field3: 'value',
    field5: {
      subfield1: 500,
      subfield2: 'value',
    },
  };
  const schema = Schema.from(definition);
  test.strictSame(schema.check(obj).valid, true);
  test.end();
});

metatests.test('Schema: nested schema', (test) => {
  const definition = {
    field1: 'string',
    field2: {
      schema: {
        subfield1: 'number',
        subfield2: 'string',
      },
    },
  };
  const obj = {
    field1: 'value',
    field2: {
      subfield1: 500,
      subfield2: 'value',
    },
  };
  const schema = Schema.from(definition);
  test.strictSame(schema.check(obj).valid, true);
  test.end();
});

metatests.test('Schema: nested schema, lost field', (test) => {
  const schema = Schema.from({
    field1: 'string',
    field2: {
      subfield1: 'number',
    },
    field3: 'string',
  });

  const obj = {
    field1: 'value',
    field2: {},
  };
  test.strictSame(schema.check(obj), {
    valid: false,
    errors: [
      'Field "field2.subfield1" is required',
      'Field "field3" is required',
    ],
  });

  test.end();
});

metatests.test('Schema: optional nested struct', (test) => {
  const definition = {
    struct: {
      required: false,
      schema: {
        field: 'string',
      },
    },
  };
  const schema = Schema.from(definition);

  const obj1 = {};
  test.strictSame(schema.check(obj1).valid, true);

  const obj2 = {
    struct: {
      field: 'value',
    },
  };
  test.strictSame(schema.check(obj2).valid, true);

  test.end();
});

metatests.test('Schema: optional nested struct base object', (test) => {
  const definition = {
    text: 'string',
    struct: {
      required: false,
      schema: {
        field: 'string',
      },
    },
  };
  const schema = Schema.from(definition);

  const obj1 = { text: 'abc' };
  test.strictSame(schema.check(obj1), { valid: true, errors: [] });

  const obj2 = {
    text: 'abc',
    struct: {
      field: 'value',
    },
  };
  test.strictSame(schema.check(obj2), { valid: true, errors: [] });

  test.end();
});

metatests.test('Schema: shorthand for optional nested struct', (test) => {
  const definition = {
    'struct?': {
      field: 'string',
    },
  };
  const schema = Schema.from(definition);

  const obj1 = {};
  test.strictSame(schema.check(obj1).valid, true);

  const obj2 = {
    struct: {
      field: 'value',
    },
  };
  test.strictSame(schema.check(obj2).valid, true);

  test.end();
});

metatests.test('Schema: shorthand', (test) => {
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

metatests.test('Schema: required shorthand', (test) => {
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

metatests.test('Schema: negative check', (test) => {
  const definition = {
    field1: 'string',
    field2: { type: 'number' },
    field3: { type: 'string', length: { min: 5, max: 30 } },
  };
  const schema = Schema.from(definition);

  const obj1 = {
    field1: 1,
    field2: 100,
    field3: 'value',
  };
  test.strictSame(schema.check(obj1).valid, false);

  const obj2 = {
    field1: 'value',
    field2: 'value',
    field3: 'value',
  };
  test.strictSame(schema.check(obj2).valid, false);

  const obj3 = {
    field1: 'value',
    field2: 100,
    field3: 'valuevaluevaluevaluevaluevaluevaluevalue',
  };
  test.strictSame(schema.check(obj3).valid, false);

  const obj4 = {
    field1: 'value',
    field2: 100,
    field3: 'val',
  };
  test.strictSame(schema.check(obj4).valid, false);

  const obj5 = {
    field1: 'value',
    field2: 100,
  };
  test.strictSame(schema.check(obj5).valid, false);
  test.end();
});

metatests.test('Schema: check scalar', (test) => {
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

metatests.test('Schema: check enum', (test) => {
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

metatests.test('Schema: check enum value', (test) => {
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

metatests.test('Schema: check collections', (test) => {
  const def1 = {
    field1: { array: 'number' },
  };
  const obj1 = {
    field1: [1, 2, 3],
  };
  const schema1 = Schema.from(def1);
  test.strictSame(schema1.check(obj1).valid, true);

  const def2 = {
    field1: { array: 'number' },
  };
  const obj2 = {
    field1: ['uno', 2, 3],
  };
  const schema2 = Schema.from(def2);
  test.strictSame(schema2.check(obj2).valid, false);

  const def3 = {
    field1: { object: { string: 'string' } },
  };
  const obj3 = {
    field1: { a: 'A', b: 'B' },
  };
  const schema3 = Schema.from(def3);
  test.strictSame(schema3.check(obj3).valid, true);

  const def4 = {
    field1: { object: { string: 'string' } },
  };
  const obj4 = {
    field1: { a: 1, b: 'B' },
  };
  const schema4 = Schema.from(def4);
  test.strictSame(schema4.check(obj4).valid, false);

  const def5 = {
    field1: { set: 'number' },
  };
  const obj5 = {
    field1: new Set([1, 2, 3]),
  };
  const schema5 = Schema.from(def5);
  test.strictSame(schema5.check(obj5).valid, true);

  const def6 = {
    field1: { set: 'number' },
  };
  const obj6 = {
    field1: new Set(['uno', 2, 3]),
  };
  const schema6 = Schema.from(def6);
  test.strictSame(schema6.check(obj6).valid, false);

  const def7 = {
    field1: { map: { string: 'string' } },
  };
  const obj7 = {
    field1: new Map([
      ['a', 'A'],
      ['b', 'B'],
    ]),
  };
  const schema7 = Schema.from(def7);
  test.strictSame(schema7.check(obj7).valid, true);

  const def8 = {
    field1: { map: { string: 'string' } },
  };
  const obj8 = {
    field1: new Set([
      ['a', 1],
      ['b', 'B'],
    ]),
  };
  const schema8 = Schema.from(def8);
  test.strictSame(schema8.check(obj8).valid, false);

  test.end();
});

metatests.test('Schema: check collections value', (test) => {
  const def1 = { array: 'number' };
  const obj1 = [1, 2, 3];
  const schema1 = Schema.from(def1);
  test.strictSame(schema1.check(obj1).valid, true);

  const def2 = { array: 'number' };
  const obj2 = ['uno', 2, 3];
  const schema2 = Schema.from(def2);
  test.strictSame(schema2.check(obj2).valid, false);

  const def3 = { object: { string: 'string' } };
  const obj3 = { a: 'A', b: 'B' };
  const schema3 = Schema.from(def3);
  test.strictSame(schema3.check(obj3).valid, true);

  const def4 = { object: { string: 'string' } };
  const obj4 = { a: 1, b: 'B' };
  const schema4 = Schema.from(def4);
  test.strictSame(schema4.check(obj4).valid, false);

  const def5 = { set: 'number' };
  const obj5 = new Set([1, 2, 3]);
  const schema5 = Schema.from(def5);
  test.strictSame(schema5.check(obj5).valid, true);

  const def6 = { set: 'number' };
  const obj6 = new Set(['uno', 2, 3]);
  const schema6 = Schema.from(def6);
  test.strictSame(schema6.check(obj6).valid, false);

  const def7 = { map: { string: 'string' } };
  const obj7 = new Map([
    ['a', 'A'],
    ['b', 'B'],
  ]);
  const schema7 = Schema.from(def7);
  test.strictSame(schema7.check(obj7).valid, true);

  const def8 = { map: { string: 'string' } };
  const obj8 = new Set([
    ['a', 1],
    ['b', 'B'],
  ]);
  const schema8 = Schema.from(def8);
  test.strictSame(schema8.check(obj8).valid, false);

  test.end();
});

metatests.test('Schema: check collections value with long form', (test) => {
  const def1 = { type: 'array', value: 'number' };
  const obj1 = [1, 2, 3];
  const schema1 = Schema.from(def1);
  test.strictSame(schema1.check(obj1).valid, true);

  const def2 = { type: 'array', value: 'number' };
  const obj2 = ['uno', 2, 3];
  const schema2 = Schema.from(def2);
  test.strictSame(schema2.check(obj2).valid, false);

  const def3 = { type: 'object', key: 'string', value: 'string' };
  const obj3 = { a: 'A', b: 'B' };
  const schema3 = Schema.from(def3);
  test.strictSame(schema3.check(obj3).valid, true);

  const def4 = { type: 'object', key: 'string', value: 'string' };
  const obj4 = { a: 1, b: 'B' };
  const schema4 = Schema.from(def4);
  test.strictSame(schema4.check(obj4).valid, false);

  const def5 = { type: 'set', value: 'number' };
  const obj5 = new Set([1, 2, 3]);
  const schema5 = Schema.from(def5);
  test.strictSame(schema5.check(obj5).valid, true);

  const def6 = { type: 'set', value: 'number' };
  const obj6 = new Set(['uno', 2, 3]);
  const schema6 = Schema.from(def6);
  test.strictSame(schema6.check(obj6).valid, false);

  const def7 = { type: 'map', key: 'string', value: 'string' };
  const obj7 = new Map([
    ['a', 'A'],
    ['b', 'B'],
  ]);
  const schema7 = Schema.from(def7);
  test.strictSame(schema7.check(obj7).valid, true);

  const def8 = { type: 'map', key: 'string', value: 'string' };
  const obj8 = new Set([
    ['a', 1],
    ['b', 'B'],
  ]);
  const schema8 = Schema.from(def8);
  test.strictSame(schema8.check(obj8).valid, false);

  const def9 = { type: 'enum', enum: ['foo', 'bar'] };
  const schema9 = Schema.from(def9);
  test.strictSame(schema9.check('foo').valid, true);
  test.strictSame(schema9.check('bar').valid, true);
  test.strictSame(schema9.check('baz').valid, false);

  test.end();
});

metatests.test('Schema: generate ts interface', (test) => {
  const raw = {
    Dictionary: { scope: 'global' },
    name: { type: 'string', unique: true },
    addresses: { many: 'Address' },
  };

  const expected = `interface Company {
  companyId: number;
  name: string;
  addresses: Address[];\n}`;

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

metatests.test('Schema: multiple optional nested struct', (test) => {
  const definition = {
    field: 'string',
    data: {
      nfield1: {
        schema: {
          text: 'string',
        },
        required: false,
      },
      nfield2: {
        schema: {
          text: 'string',
          caption: '?string',
        },
        required: false,
      },
    },
  };
  const schema = Schema.from(definition);

  test.strictSame(
    schema.check({
      field: 'abc',
      data: {
        nfield1: { text: 'abc' },
      },
    }),
    { valid: true, errors: [] }
  );

  test.strictSame(
    schema.check({
      field: 'abc',
      data: {
        nfield1: { text: 'abc' },
        nfield2: { text: 'aaa' },
      },
    }),
    { valid: true, errors: [] }
  );

  test.strictSame(
    schema.check({
      field: 'abc',
      data: {
        nfield1: { text: 'abc' },
        nfield2: { text: 'aaa', caption: 'caption' },
      },
    }),
    { valid: true, errors: [] }
  );

  test.strictSame(
    schema.check({
      field: 'abc',
      data: {
        nfield1: {},
        nfield2: { text: 'aaa', caption: 42 },
      },
    }),
    {
      valid: false,
      errors: [
        `Field "data.nfield1.text" is required`,
        `Field "data.nfield2.caption" is not of expected type: string`,
      ],
    }
  );
  test.end();
});

metatests.test('Schema: validation function', (test) => {
  const definition = {
    field: '?string',
    validate: test.mustCall((value, path) => {
      if (value.field) return { valid: true };
      if (value.throw) throw new Error(value.throw);
      return { valid: false, errors: [`${path}.field is required`] };
    }, 3),
  };
  const schema = Schema.from(definition);

  test.strictSame(
    schema.check({
      field: 'abc',
    }),
    { valid: true, errors: [] }
  );

  test.strictSame(
    schema.check({
      field2: 'abc',
    }),
    { valid: false, errors: ['.field is required'] }
  );

  test.strictSame(
    schema.check({
      throw: '42',
    }),
    { valid: false, errors: ['Schema "" validation failed Error: 42'] }
  );

  test.end();
});

metatests.test('Schema: validation function simple return', (test) => {
  const definition = {
    field: '?string',
    validate: test.mustCall((value) => value.field === '42', 2),
  };
  const schema = Schema.from(definition);

  test.strictSame(schema.check({ field: '42' }), { valid: true, errors: [] });
  test.strictSame(schema.check({ field: '43' }), { valid: false, errors: [] });

  test.end();
});

metatests.test('Schema: nested validation function', (test) => {
  const definition = {
    field: 'string',
    nested: {
      required: false,
      schema: {
        field: { type: 'string', required: false },
        validate: test.mustCall((value, path) => {
          if (value.field) return { valid: true };
          if (value.throw) throw new Error(value.throw);
          return { valid: false, errors: [`${path}.field is required`] };
        }, 3),
      },
    },
  };
  const schema = Schema.from(definition);

  test.strictSame(
    schema.check({
      field: 'abc',
    }),
    { valid: true, errors: [] }
  );

  test.strictSame(
    schema.check({
      field2: 'abc',
    }),
    {
      valid: false,
      errors: ['Field "field2" is not expected', 'Field "field" is required'],
    }
  );

  test.strictSame(
    schema.check({
      field: 'abc',
      nested: {
        field: 'abc',
      },
    }),
    { valid: true, errors: [] }
  );

  test.strictSame(
    schema.check({
      field: 'abc',
      nested: {
        field2: 'abc',
      },
    }),
    { valid: false, errors: ['nested.field is required'] }
  );

  test.strictSame(
    schema.check({
      field: 'abc',
      nested: {
        throw: '42',
      },
    }),
    { valid: false, errors: ['Schema "nested" validation failed Error: 42'] }
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

metatests.test('Schema: nested schemas with Schema instances', (test) => {
  const def = {
    name: {
      type: 'schema',
      schema: new Schema('', {
        first: { type: 'string' },
        last: { type: 'string' },
        third: { type: 'string' },
      }),
    },
    age: { type: 'number' },
    levelOne: {
      type: 'schema',
      schema: new Schema('', {
        levelTwo: {
          type: 'schema',
          schema: new Schema('', {
            levelThree: { type: 'enum', enum: [1, 2, 3] },
          }),
        },
      }),
    },
  };
  const obj = {
    name: {
      first: 'Andrew',
      last: 'John',
      third: 'John',
    },
    age: 5,
    levelOne: {
      levelTwo: {
        levelThree: 2,
      },
    },
  };
  const schema = new Schema('', def);
  test.strictSame(schema.check(obj).valid, true);
  test.end();
});

metatests.test('Schema: multiple nested arrays', (test) => {
  const defs1 = {
    Entity: {},
    name: {
      first: { type: 'string' },
      last: { type: 'string' },
      third: { type: '?string' },
    },
    age: { type: 'number' },
    levelOne: {
      levelTwo: {
        levelThree: { type: 'enum', enum: [1, 2, 3] },
      },
    },
    collection: { array: { array: 'number' } },
  };

  const schema1 = Schema.from(defs1);

  const obj1 = {
    name: {
      first: 'a',
      last: 'b',
    },
    age: 5,
    levelOne: { levelTwo: { levelThree: 1 } },
    collection: [
      [1, 2, 3],
      [3, 5, 6],
    ],
  };
  test.strictSame(schema1.check(obj1).valid, true);

  const defs2 = {
    array: {
      name: 'string',
      age: 'number',
      nest: {
        arr1: { array: { enum: [1, 2, 3] } },
        arr2: { array: { array: { object: { string: 'string' } } } },
      },
    },
  };
  const obj2 = [
    {
      name: 'A',
      age: 5,
      nest: {
        arr1: [1, 2, 3],
        arr2: [
          [{ hello: 'world' }, { your: 'world' }],
          [{ hello: 'world' }, { your: 'world' }],
        ],
      },
    },
    {
      name: 'A',
      age: 5,
      nest: {
        arr1: [1, 2, 3],
        arr2: [
          [{ hello: 'world' }, { your: 'world' }],
          [{ hello: 'world' }, { your: 'world' }],
        ],
      },
    },
  ];
  const schema2 = Schema.from(defs2);
  test.strictSame(schema2.check(obj2).valid, true);

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

metatests.test('Schema: reserved fields permitted with Kind', (test) => {
  const defs = {
    Struct: {},
    type: 'string',
    required: 'string',
    note: 'string',
  };
  const schema = Schema.from(defs);
  test.strictSame(
    schema.check({
      type: 'myType',
      required: 'never',
      note: 'this is not vorbidden anymore',
    }).valid,
    true
  );
  test.strictSame(
    schema.check({
      note: 'this is not vorbidden anymore',
    }).valid,
    false
  );
  test.end();
});

metatests.test('Schema: optional shorthand key', (test) => {
  const defs1 = { 'array?': 'string' };
  const defs2 = { 'object?': { string: 'string' } };
  const defs3 = { 'set?': 'string' };
  const defs4 = { 'map?': { string: 'string' } };

  const sch1 = Schema.from(defs1);
  const sch2 = Schema.from(defs2);
  const sch3 = Schema.from(defs3);
  const sch4 = Schema.from(defs4);

  test.strictSame(sch1.check([]).valid, true);
  test.strictSame(sch2.check({}).valid, true);
  test.strictSame(sch3.check(new Set()).valid, true);
  test.strictSame(sch4.check(new Map()).valid, true);

  test.end();
});
