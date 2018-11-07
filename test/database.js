'use strict';

/* eslint new-cap: 0 */

const path = require('path');
const metatests = require('metatests');
const metaschema = require('..');

const { attribute: { Enum, Many, Include } } = require('../lib/decorators');
const { getSchemaDir } = require('./utils');

const domains = {
  nomen: {
    domain: 'Nomen',
    definition: { type: 'string', length: 60 },
  },
  nomenRequiredTrue: {
    domain: 'Nomen',
    required: true,
    definition: { type: 'string', length: 60 },
  },
  sex: {
    domain: 'Sex',
    definition: Enum('female', 'male'),
  },
  born: {
    domain: 'DateDay',
    definition: { type: 'object', class: 'Date', format: 'yyyy-mm-dd' },
  },
};

const FullName = {
  name: 'FullName',
  definition: {
    FirstName: domains.nomenRequiredTrue,
    MiddleName: domains.nomen,
    Patronymic: domains.nomen,
    Surname: domains.nomenRequiredTrue,
  },
};

const Language = {
  name: 'Language',
  definition: {
    Name: domains.nomenRequiredTrue,
  },
};

const Person = {
  name: 'Person',
  definition: {
    FullName: Include({
      category: 'FullName',
      definition: FullName.definition,
    }),
    Sex: domains.sex,
    Born: domains.born,
    Languages: Many({
      category: 'Language',
      definition: Language.definition,
    }),
  },
};

metatests.test('Database / general categories', test => {
  const generalPath = path.join(__dirname, '..', 'schemas', 'general');
  metaschema.fs.loadAndCreate(generalPath, null, (err, ms) => {
    test.error(err);
    const categories = [FullName, Language, Person];
    for (const { name, definition } of categories) {
      const category = ms.categories.get(name);

      test.strictSame(category.name, name);
      for (const key in definition) {
        test.strictSame(category.definition[key], definition[key]);
      }
    }

    test.end();
  });
});

metatests.test('Multiple load directories', test => {
  const schemas = ['schemas1', 'schemas2']
    .map(s => getSchemaDir(s, 'multipleLoad'));
  metaschema.fs.loadAndCreate(schemas, null, (err, ms) => {
    test.error(err);
    const categories = [FullName, Language];
    for (const { name, definition } of categories) {
      const category = ms.categories.get(name);

      test.strictSame(category.name, name);
      for (const key in definition) {
        test.strictSame(category.definition[key], definition[key]);
      }
    }

    test.end();
  });
});
