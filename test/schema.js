'use strict';

const path = require('path');

const { test, testSync } = require('metatests');
const { duplicate } = require('@metarhia/common');

const metaschema = require('..');

const schemasDir = path.join(__dirname, '..', 'schemas');

const schemas = {
  categories: [],
  domains: [],
  views: [],
  forms: [],
  actions: [],
  displayModes: [],
  sources: [],
};

const typeToPlural = {
  category: 'categories',
  domains: 'domains',
  view: 'views',
  form: 'forms',
  action: 'actions',
  source: 'sources',
};

const schemaTest = test('Metaschema default schemas test');
metaschema.fs.load(schemasDir, null, true, (err, arr) => {
  const st = schemaTest;
  st.error(err);

  arr.forEach(([type, schema]) => schemas[typeToPlural[type]].push(schema));

  st.beforeEach((test, callback) => {
    callback({ schemas: duplicate(schemas) });
  });
  st.endAfterSubtests();

  st.testSync('must support Logical domain type', (test, { schemas }) => {
    schemas.categories.push({
      name: 'schema',
      definition: { field: { domain: 'Logical' } },
    });

    const [createErr, ms] = metaschema.create(schemas);
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
      const [createErr, ms] = metaschema.create(schemas);
      test.error(createErr);
      test.strictSame(ms.createInstance('Logical', true), true);
      test.strictSame(ms.createInstance('Logical', false), false);
    }
  );

  st.testSync(
    "createInstance must fail when 'required' fields are missing",
    (test, { schemas }) => {
      schemas.categories.push({
        name: 'schema',
        definition: { field: { domain: 'Nomen', required: true } },
      });
      const [createErr, ms] = metaschema.create(schemas);
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
