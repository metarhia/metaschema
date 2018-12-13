'use strict';

const metatests = require('metatests');

const metaschema = require('..');
const { getSchemaDir } = require('./utils');

metatests.test('must load Form', test => {
  metaschema.fs.loadAndCreate(getSchemaDir('form'), null, (error, ms) => {
    test.error(error);

    const Person = ms.categories.get('Person').definition;
    const FullName = ms.categories.get('FullName').definition;

    const dateTime = ms.domains.get('DateTime');

    const form = ms.forms.get('Person.ChangeDOB');
    const { Args: args, Returns: returns } = form;

    test.strictSame(args.OldDOB.definition, Person.DOB.definition);
    test.strictSame(args.NewDOB.definition, dateTime);
    test.strictSame(args.LastName.definition, FullName.LastName.definition);

    test.strictSame(returns.NewDOB.definition, dateTime);

    test.end();
  });
});
