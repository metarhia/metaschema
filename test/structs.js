'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { Schema } = require('../metaschema');

test('Structs: nested schema', () => {
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
  assert.strictEqual(schema.check(obj).valid, true);
});

test('Structs: nested schema, lost field', () => {
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
  assert.deepStrictEqual(schema.check(obj).errors, [
    'Field "field2.subfield1" is required',
    'Field "field3" is required',
  ]);
});

test('Structs: optional nested struct', () => {
  const definition = {
    struct: {
      schema: {
        field: 'string',
      },
      required: false,
    },
  };
  const schema = Schema.from(definition);

  const obj1 = {};
  assert.strictEqual(schema.check(obj1).valid, true);

  const obj2 = {
    struct: {
      field: 'value',
    },
  };
  assert.strictEqual(schema.check(obj2).valid, true);
});

test('Structs: optional nested struct base object', () => {
  const definition = {
    text: 'string',
    struct: {
      schema: {
        field: 'string',
      },
      required: false,
    },
  };
  const schema = Schema.from(definition);

  const obj1 = { text: 'abc' };
  assert.strictEqual(schema.check(obj1).valid, true);

  const obj2 = {
    text: 'abc',
    struct: {
      field: 'value',
    },
  };
  assert.strictEqual(schema.check(obj2).valid, true);
});

test('Structs: shorthand for optional nested struct', () => {
  const definition = {
    struct: {
      schema: {
        field: 'string',
      },
      required: false,
    },
  };
  const schema = Schema.from(definition);

  const obj1 = {};
  assert.strictEqual(schema.check(obj1).valid, true);

  const obj2 = {
    struct: {
      field: 'value',
    },
  };
  assert.strictEqual(schema.check(obj2).valid, true);
});

test('Structs: multiple optional nested struct', () => {
  const definition = {
    field: 'string',
    data: {
      nfield1: {
        schema: {
          text: 'string',
        },
        required: true,
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

  assert.strictEqual(
    schema.check({
      field: 'abc',
      data: {
        nfield1: { text: 'abc' },
      },
    }).valid,
    true,
  );

  assert.strictEqual(
    schema.check({
      field: 'abc',
      data: {
        nfield1: { text: 'abc' },
        nfield2: { text: 'aaa' },
      },
    }).valid,
    true,
  );

  assert.strictEqual(
    schema.check({
      field: 'abc',
      data: {
        nfield1: { text: 'abc' },
        nfield2: { text: 'aaa', caption: 'caption' },
      },
    }).valid,
    true,
  );

  assert.deepStrictEqual(
    schema.check({
      field: 'abc',
      data: {
        nfield1: {},
        nfield2: { text: 'aaa', caption: 42 },
      },
    }).errors,
    [
      `Field "data.nfield1.text" is required`,
      `Field "data.nfield2.caption" not of expected type: string`,
    ],
  );
});

test('Structs: nested schemas with Schema instances', () => {
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
  assert.strictEqual(schema.check(obj).valid, true);
});

test('Struct: json type as any plain object', () => {
  const defs = { name: 'json' };
  const schema = Schema.from(defs);
  assert.strictEqual(schema.check({ name: {} }).valid, true);
  assert.strictEqual(schema.check({ name: { a: 'b' } }).valid, true);
  assert.strictEqual(schema.check({ name: [] }).valid, true);
  assert.strictEqual(schema.check({ name: null }).valid, false);
});
