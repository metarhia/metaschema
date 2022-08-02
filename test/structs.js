'use strict';

const metatests = require('metatests');
const { Schema } = require('../metaschema');

metatests.test('Structs: nested schema', (test) => {
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

metatests.test('Structs: nested schema, lost field', (test) => {
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
  test.strictSame(schema.check(obj).errors, [
    'Field "field2.subfield1" is required',
    'Field "field3" is required',
  ]);

  test.end();
});

metatests.test('Structs: optional nested struct', (test) => {
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
  test.strictSame(schema.check(obj1).valid, true);

  const obj2 = {
    struct: {
      field: 'value',
    },
  };
  test.strictSame(schema.check(obj2).valid, true);

  test.end();
});

metatests.test('Structs: optional nested struct base object', (test) => {
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
  test.strictSame(schema.check(obj1).valid, true);

  const obj2 = {
    text: 'abc',
    struct: {
      field: 'value',
    },
  };
  test.strictSame(schema.check(obj2).valid, true);

  test.end();
});

metatests.test('Structs: shorthand for optional nested struct', (test) => {
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

metatests.test('Structs: multiple optional nested struct', (test) => {
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

  test.strictSame(
    schema.check({
      field: 'abc',
      data: {
        nfield1: { text: 'abc' },
      },
    }).valid,
    true,
  );

  test.strictSame(
    schema.check({
      field: 'abc',
      data: {
        nfield1: { text: 'abc' },
        nfield2: { text: 'aaa' },
      },
    }).valid,
    true,
  );

  test.strictSame(
    schema.check({
      field: 'abc',
      data: {
        nfield1: { text: 'abc' },
        nfield2: { text: 'aaa', caption: 'caption' },
      },
    }).valid,
    true,
  );

  test.strictSame(
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
  test.end();
});

metatests.test('Structs: nested schemas with Schema instances', (test) => {
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

metatests.test('Struct: json type as any plain object', (test) => {
  const defs = { name: 'json' };
  const schema = Schema.from(defs);
  test.strictEqual(schema.check({ name: {} }).valid, true);
  test.strictEqual(schema.check({ name: { a: 'b' } }).valid, true);
  test.strictEqual(schema.check({ name: [] }).valid, true);
  test.strictEqual(schema.check({ name: null }).valid, false);
  test.end();
});
