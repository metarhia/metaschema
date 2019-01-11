'use strict';

const metatests = require('metatests');

const metaschema = require('..');
const { getSchemaDir } = require('./utils');

metatests.test('must properly load schemas from modules', test => {
  metaschema.fs.loadAndCreate(getSchemaDir('modules'), null, (error, ms) => {
    test.error(error);

    test.assert(ms.domains.has('CountryName'));

    test.strictSame(ms.categories.size, 3);
    test.assert(ms.categories.has('Person'));
    test.assert(ms.categories.has('FullName'));
    test.assert(ms.categories.has('Citizenship'));

    const Person = ms.categories.get('Person');

    test.assert(Person.views.has('DOB'));
    test.assert(Person.forms.has('ChangeDOB'));
    test.assert(Person.actions.has('ChangeDOB'));

    const FullName = ms.categories.get('FullName');

    test.assert(FullName.forms.has('ChangeName'));
    test.assert(FullName.actions.has('ChangeName'));

    test.end();
  });
});
