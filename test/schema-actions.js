'use strict';

const metatests = require('metatests');

const metaschema = require('..');
const { getSchemaDir } = require('./utils');

metatests.test('must load Actions', test => {

  const testMethod = (test, method, ctx, expected) => {
    method({}, ctx, (err, actual) => {
      test.error(err);
      test.strictSame(actual, expected);
      test.end();
    });
  };

  const testExecute = (test, def, ctx, expected) => {
    testMethod(test, def.Execute, ctx, expected);
  };

  metaschema.fs.loadAndCreate(getSchemaDir('actions'), null, (error, ms) => {
    test.error(error);

    test.strictSame(ms.actions.get('SchemaWithoutActions').size, 0);
    test.strictSame(ms.actions.get('SchemaWithActions').size, 1);

    test.endAfterSubtests();

    test.test('SchemaWithActions test', test => {
      const action = ms.actions
        .get('SchemaWithActions')
        .get('Act');
      test.endAfterSubtests();
      testExecute(test.test(), action.definition, { Id: 42 }, 'Resource42');
    });

    test.test('CustomActions test', test => {
      const action = ms.actions
        .get('CustomActions')
        .get('Act');
      test.strictSame(
        action.forms.Act,
        ms.forms.get('CustomActions.CustomForm')
      );
      test.endAfterSubtests();
      testExecute(test.test(), action.definition, { Id: 13 }, 'Resource13');
    });

    test.testSync('CustomActionsMethods test', test => {
      const action = ms.actions
        .get('CustomActionsMethods')
        .get('Act');

      test.assertNot(action.definition.Execute);

      test.strictSame(
        action.forms.M1,
        ms.forms.get('CustomActionsMethods.M1')
      );
      test.strictSame(
        action.forms.M2,
        ms.forms.get('CustomActionsMethods.CustomForm')
      );

      test.endAfterSubtests();

      const { getMethod, Methods } = action.definition;
      testMethod(test.test(), getMethod, { Id: 42 }, 'M1');
      testMethod(test.test(), getMethod, { Id: 1 }, 'M2');

      testExecute(test.test(), Methods.M1, { Id: 13 }, 'M1Resource13');
      testExecute(test.test(), Methods.M2, { Id: 13 }, 'M2Resource13');
    });
  });
});
