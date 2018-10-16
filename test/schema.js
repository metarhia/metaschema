'use strict';

const path = require('path');

const { test, testSync, case: checkCase } = require('metatests');
const { duplicate, Int64, Uint64 } = require('@metarhia/common');

const metaschema = require('..');

const schemasDir = path.join(__dirname, '..', 'schemas');

const schemas = [];

const schemaTest = test('Metaschema default schemas test');
metaschema.fs.load(schemasDir, null, true, (err, arr) => {
  const st = schemaTest;
  st.error(err);

  schemas.push(...arr);

  st.beforeEach((test, callback) => {
    callback({ schemas: duplicate(schemas) });
  });
  st.endAfterSubtests();

  st.testSync('must support Logical domain type', (test, { schemas }) => {
    schemas.push([
      'category',
      {
        name: 'schema',
        definition: { field: { domain: 'Logical' } },
      },
    ]);

    const [createErr, ms] = metaschema.createAndProcess(schemas);
    test.error(createErr);

    const actualFalse = ms.createInstance('schema', { field: false });
    test.strictSame(actualFalse, { field: false });

    const actualTrue = ms.createInstance('schema', { field: true });
    test.strictSame(actualTrue, { field: true });

    const actualInvalid = ms.createInstance('schema', { field: 'non-bool' });
    test.strictSame(actualInvalid, null);
  });

  st.testSync(
    'createInstance must support Logical domain type',
    (test, { schemas }) => {
      const [createErr, ms] = metaschema.createAndProcess(schemas);
      test.error(createErr);
      test.strictSame(ms.createDomainInstance('Logical', true), true);
      test.strictSame(ms.createDomainInstance('Logical', false), false);
    }
  );

  st.testSync(
    "createInstance must fail when 'required' fields are missing",
    (test, { schemas }) => {
      schemas.push([
        'category',
        {
          name: 'schema',
          definition: { field: { domain: 'Nomen', required: true } },
        },
      ]);
      const [createErr, ms] = metaschema.createAndProcess(schemas);
      test.error(createErr);

      const actual = ms.createInstance('schema', {});
      test.strictSame(actual, null);
    }
  );
});

testSync("must support schemas ending with ';'", test => {
  const source = "{\n FirstName: { domain: 'Nomen' },\n};\n";
  const schema = metaschema.processSchema('Schema.category', source);
  test.strictSame(schema, { FirstName: { domain: 'Nomen' } });
});

testSync("must support schemas ending with multiple ' ;'", test => {
  const source = "{\n FirstName: { domain: 'Nomen' },\n} ;  ;\n";
  const schema = metaschema.processSchema('Schema.category', source);
  test.strictSame(schema, { FirstName: { domain: 'Nomen' } });
});

const schemasPath = path.join(__dirname, 'schemas', 'createInstance');
const createInstanceTest = test('Metaschema createInstance test');
const context = { api: { common: { Uint64 } } };
metaschema.fs.loadAndCreate(schemasPath, context, (err, ms) => {
  const cit = createInstanceTest;
  cit.error(err);
  cit.endAfterSubtests();

  checkCase("'createInstance' must support Enum and Flags domain types", null, {
    'Metaschema.prototype.createDomainInstance': [
      [ms, 'EnumDomain', 'value1', { index: 0, value: 'value1' }],
      [ms, 'EnumDomain', 'value2', { index: 1, value: 'value2' }],
      [ms, 'EnumDomain', 'value3', { index: 2, value: 'value3' }],
      [ms, 'EnumDomain', 'value4', null],
      [ms, 'FlagsDomain', [1], { value: new Uint64(1) }],
      [ms, 'FlagsDomain', [1, 2], { value: new Uint64(3) }],
      [ms, 'FlagsDomain', [1, 2, 3], { value: new Uint64(7) }],
      [ms, 'FlagsDomain', '7', { value: new Uint64(7) }],
      [ms, 'FlagsDomain', [1, 2, 4], null],
      [ms, 'FlagsOfEnumDomain', ['value1'], { value: new Uint64(1) }],
      [ms, 'FlagsOfEnumDomain', ['value1', 'value2'], { value: new Uint64(3) }],
      [
        ms,
        'FlagsOfEnumDomain',
        ['value1', 'value2', 'value3'],
        { value: new Uint64(7) },
      ],
      [ms, 'FlagsOfEnumDomain', '7', { value: new Uint64(7) }],
      [ms, 'FlagsOfEnumDomain', ['value4'], null],
      [ms, 'BigInt', 1, new Int64(1)],
      [ms, 'Id', 1, new Uint64(1)],
      [ms, 'SHA2', [1, 2, 3], Uint8Array.from([1, 2, 3])],
      [ms, 'HashMap', [[1, 2], [3, 4]], new Map([[1, 2], [3, 4]])],
      [ms, 'HashMap', 10, null],
      [ms, 'HashSet', [1, 2, 3, 4], new Set([1, 2, 3, 4])],
      [ms, 'HashSet', 10, null],
      [ms, 'Time', '1999-10-25', new Date('1999-10-25')],
      [ms, 'Time', '__INVALID_DATE__', null],
      [ms, 'DateDay', '1999-10-25', new Date('1999-10-25')],
      [ms, 'DateDay', '__INVALID_DATE__', null],
      [ms, 'DateTime', '1999-10-25', new Date('1999-10-25')],
      [ms, 'DateTime', '__INVALID_DATE__', null],
      [ms, 'Normalizable', '    trimmed string    ', 'trimmed string'],
      [ms, 'Parsable', '10', 10],
      [ms, 'NormalizeParse', '    10    ', 10],
    ],
    'Metaschema.prototype.createInstance': [
      [
        ms,
        'enumSchema',
        { enumField: 'value1' },
        { enumField: { index: 0, value: 'value1' } },
      ],
      [
        ms,
        'enumSchema',
        { enumField: 'value2' },
        { enumField: { index: 1, value: 'value2' } },
      ],
      [
        ms,
        'enumSchema',
        { enumField: 'value3' },
        { enumField: { index: 2, value: 'value3' } },
      ],
      [ms, 'enumSchema', {}, { enumField: { index: 0, value: 'value1' } }],
      [ms, 'enumSchema', { enumField: 'wrongValue' }, null],
      [
        ms,
        'flagsSchema',
        { flagsField: [1] },
        { flagsField: { value: new Uint64(1) } },
      ],
      [
        ms,
        'flagsSchema',
        { flagsField: [1, 2] },
        { flagsField: { value: new Uint64(3) } },
      ],
      [
        ms,
        'flagsSchema',
        { flagsField: [1, 2, 3] },
        { flagsField: { value: new Uint64(7) } },
      ],
      [
        ms,
        'flagsSchema',
        { flagsField: '7' },
        { flagsField: { value: new Uint64(7) } },
      ],
      [ms, 'flagsSchema', { flagsField: [8] }, null],
      [
        ms,
        'flagsOfEnumSchema',
        { flagsOfEnumField: ['value1'] },
        { flagsOfEnumField: { value: new Uint64(1) } },
      ],
      [
        ms,
        'flagsOfEnumSchema',
        { flagsOfEnumField: ['value1', 'value2'] },
        { flagsOfEnumField: { value: new Uint64(3) } },
      ],
      [
        ms,
        'flagsOfEnumSchema',
        { flagsOfEnumField: ['value1', 'value2', 'value3'] },
        { flagsOfEnumField: { value: new Uint64(7) } },
      ],
      [
        ms,
        'flagsOfEnumSchema',
        { flagsOfEnumField: '7' },
        { flagsOfEnumField: { value: new Uint64(7) } },
      ],
      [ms, 'flagsOfEnumSchema', { flagsOfEnumField: ['wrong'] }, null],
      [
        ms,
        'Schema',
        {
          Id: 1,
          number: '   10   ',
          date: '1999-10-25',
          enumField: 'value1',
          flagsField: [1],
        },
        {
          Id: new Uint64(1),
          number: 10,
          date: new Date('1999-10-25'),
          enumField: { index: 0, value: 'value1' },
          flagsField: { value: new Uint64(1) },
        },
      ],
    ],
  });
});
