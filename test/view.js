'use strict';

const metatests = require('metatests');

const metaschema = require('..');
const { getSchemaDir } = require('./utils');

metatests.test('must load Views', test => {
  metaschema.fs.loadAndCreate(getSchemaDir('view'), null, (error, ms) => {
    test.error(error);

    const Person = ms.categories.get('Person').definition;
    const FullName = ms.categories.get('FullName').definition;

    const definition = {
      FullName: Person.FullName,
      Born: Person.DOB,
      FirstName: FullName.FirstName,
      LastName: FullName.LastName,
      MaternalName: FullName.LastName,
      Age: Person => Date.now() - Person.DOB,
    };

    test.strictSame(
      ms.categories.get('Person').views.get('View').definition.Fields,
      definition
    );

    test.end();
  });
});
