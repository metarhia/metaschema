'use strict';

const path = require('path');
const metatests = require('metatests');

const metaschema = require('..');
const { getSchemaDir } = require('./utils');

metatests.test('must load Actions', test => {
  const testMethod = (test, method, ctx, expected) => {
    method({}, ctx, {}).then(
      actual => {
        test.strictSame(actual, expected);
        test.end();
      },
      err => {
        test.error(err);
        test.end();
      }
    );
  };

  const testExecute = (test, def, ctx, expected) => {
    testMethod(test, def.Execute, ctx, expected);
  };

  metaschema.fs.loadAndCreate(getSchemaDir('actions'), null, (error, ms) => {
    test.error(error);

    test.strictSame(ms.categories.get('SchemaWithoutActions').actions.size, 0);
    test.strictSame(ms.categories.get('SchemaWithActions').actions.size, 1);

    test.endAfterSubtests();

    test.test('SchemaWithActions test', test => {
      const action = ms.categories.get('SchemaWithActions').actions.get('Act');

      test.endAfterSubtests();
      testExecute(test.test(), action.definition, { Id: 42 }, 'Resource42');
    });

    test.test('CustomActions test', test => {
      const action = ms.categories.get('CustomActions').actions.get('Act');

      test.strictSame(
        action.form,
        ms.categories.get('CustomActions').forms.get('CustomForm').definition
      );

      test.endAfterSubtests();
      testExecute(test.test(), action.definition, { Id: 13 }, 'Resource13');
    });

    test.test('ActionsExecute test', test => {
      test.endAfterSubtests();

      const actAction = ms.categories.get('ActionsExecute').actions.get('Act');

      test.assertNot(actAction.form);
      testExecute(
        test.test(),
        actAction.definition,
        { Id: 42 },
        { Action: 'M1' }
      );
      testExecute(
        test.test(),
        actAction.definition,
        { Id: 1 },
        { Action: 'M2' }
      );

      const m1Action = ms.categories.get('ActionsExecute').actions.get('M1');

      test.strictSame(
        m1Action.form,
        ms.categories.get('ActionsExecute').forms.get('M1').definition
      );
      testExecute(test.test(), m1Action.definition, { Id: 42 }, 'M1Resource42');

      const m2Action = ms.categories.get('ActionsExecute').actions.get('M2');

      test.strictSame(
        m2Action.form,
        ms.categories.get('ActionsExecute').forms.get('CustomForm').definition
      );
      testExecute(test.test(), m2Action.definition, { Id: 42 }, 'M2Resource42');
    });

    test.test('ActionsExecuteForm test', test => {
      test.endAfterSubtests();

      const actAction = ms.categories
        .get('ActionsExecuteForm')
        .actions.get('Act');
      test.assertNot(actAction.form);
      const { Execute: execute } = actAction.definition;

      const t1 = test.test();
      execute({}, { Id: 42 }, {}).then(
        act => {
          t1.type(act, 'Execute');
          t1.strictSame(act.Action, 'M1');
          t1.strictSame(act.Form, 'CustomForm');
          t1.end();
        },
        err => {
          t1.error(err);
          t1.end();
        }
      );

      const t2 = test.test();
      execute({}, { Id: 13 }, {}).then(
        act => {
          t2.type(act, 'Execute');
          t2.strictSame(act.Action, 'M2');
          t2.strictSame(act.Form, 'CustomForm');
          t2.end();
        },
        err => {
          t2.error(err);
          t2.end();
        }
      );
    });
  });
});

metatests.test('must load context for Actions', test => {
  const dir = getSchemaDir('actions');
  const filepath = path.resolve(dir, 'ActionsContext.category');
  const ctx = { api: { answer: 42 } };
  metaschema.fs.loadSchema(filepath, ctx, (error, name, type, schema) => {
    test.error(error);

    const { Execute: execute } = schema.Act;

    execute({}, {}, {}).then(
      res => {
        test.strictSame(res, ctx.api.answer);
        test.end();
      },
      err => {
        test.error(err);
        test.end();
      }
    );
  });
});
