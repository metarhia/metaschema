'use strict';

const metatests = require('metatests');

const metaschema = require('..');
const { getSchemaDir } = require('./utils');

metatests.test('must properly resolve Args, Fields and Returns', test => {
  metaschema.fs.loadAndCreate(getSchemaDir('args'), null, (error, ms) => {
    test.error(error);

    const FullName = ms.categories.get('FullName').definition;
    const dateTime = ms.domains.get('DateTime');
    const nomen = ms.domains.get('Nomen');

    const action = ms.actions.get('Person').get('ChangeDOB').definition;
    const { Args: args, Returns: returns } = action;

    test.strictSame(args.OldDOB, {
      field: 'DOB',
      domain: 'DateTime',
      definition: dateTime,
    });

    test.strictSame(args.NewDOB, {
      domain: 'DateTime',
      definition: dateTime,
    });

    test.strictSame(args.LastName, {
      field: 'FullName.LastName',
      domain: 'Nomen',
      definition: nomen,
    });

    test.strictSame(returns.NewDOB, {
      domain: 'DateTime',
      definition: dateTime,
    });

    const form = ms.forms.get('Person.ChangeDOB');
    const { Fields: fields } = form;

    test.strictSame(fields.SomeOtherPerson, {
      field: '::FullName',
      category: 'FullName',
      definition: FullName,
    });

    test.strictSame(fields.SomeOtherPersonsLastName, {
      field: '::Person.FullName.LastName',
      domain: 'Nomen',
      definition: nomen,
    });

    test.end();
  });
});
