'use strict';

const metatests = require('metatests');

const metaschema = require('..');

const {
  MetaschemaError,
  SchemaValidationError,
} = require('../lib/schema-errors');
const { getSchemaDir } = require('./utils');

const actionPath = getSchemaDir('actionParamsValidation');
const formPath = getSchemaDir('formParamsValidation');
const viewPath = getSchemaDir('viewParamsValidation');

const removeStack = errors => errors.forEach(error => delete error.stack);

metatests.test('must report errors about invalid action params', test => {
  metaschema.fs.loadAndCreate(actionPath, null, error => {
    const expected = new MetaschemaError([
      new SchemaValidationError(
        'unresolvedProperty',
        'Person.ChangeDOB',
        'Args.OldDOB',
        { property: '__INVALID_FIELD__' }
      ),
      new SchemaValidationError(
        'unresolvedProperty',
        'Person.ChangeDOB',
        'Args.LastName',
        { property: 'FullName.__INVALID_PROP__' }
      ),
      new SchemaValidationError(
        'unresolvedDomain',
        'Person.ChangeDOB',
        'Returns.NewDOB',
        { domain: '__INVALID_DOMAIN__' }
      ),
      new SchemaValidationError(
        'duplicateName',
        'Person.ChangeDOB.Args',
        'SomeOtherPerson',
        { location: 'Person.ChangeDOB.Fields' }
      ),
    ]);

    test.isError(error, expected);

    removeStack(error.errors);
    removeStack(expected.errors);
    test.strictSame(error.errors, expected.errors);

    test.end();
  });
});

metatests.test('must report errors about invalid form params', test => {
  metaschema.fs.loadAndCreate(formPath, null, error => {
    const expected = new MetaschemaError([
      new SchemaValidationError(
        'unresolvedCategory',
        'Person.ChangeDOB',
        'Fields.SomeOtherPerson',
        { category: '::__INVALID_CATEGORY__' }
      ),
      new SchemaValidationError(
        'unresolvedProperty',
        'Person.ChangeDOB',
        'Fields.SomeOtherPersonsLastName',
        { property: '::FullName.__INVALID_PROP__' }
      ),
    ]);

    test.isError(error, expected);

    removeStack(error.errors);
    removeStack(expected.errors);
    test.strictSame(error.errors, expected.errors);

    test.end();
  });
});

metatests.test('must report errors about invalid view params', test => {
  metaschema.fs.loadAndCreate(viewPath, null, error => {
    const expected = new MetaschemaError([
      new SchemaValidationError(
        'unresolvedProperty',
        'Person.View',
        'Fields.MaternalName',
        { property: 'Mother.__FullName__' }
      ),
    ]);

    test.isError(error, expected);

    removeStack(error.errors);
    removeStack(expected.errors);
    test.strictSame(error.errors, expected.errors);

    test.end();
  });
});
