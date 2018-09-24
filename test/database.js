'use strict';

/* eslint new-cap: 0 */

const metatests = require('metatests');
const metaschema = require('..');
const { attribute: { Enum, Many, Include } } = require('../lib/decorators');

const domains = {
  nomen: {
    domain: 'Nomen',
    definition: { type: 'string', length: 60 }
  },
  nomenRequiredTrue: {
    domain: 'Nomen',
    required: true,
    definition: { type: 'string', length: 60 }
  },
  sex: {
    domain: 'Sex',
    definition: Enum('female', 'male')
  },
  born: {
    domain: 'DateDay',
    definition: { type: 'number', format: 'yyyy-mm-dd' }
  }
};

const FullName = {
  name: 'FullName',
  definition: {
    FirstName: domains.nomenRequiredTrue,
    MiddleName: domains.nomen,
    Patronymic: domains.nomen,
    Surname: domains.nomenRequiredTrue
  }
};

const Language = {
  name: 'Language',
  definition: {
    Name: domains.nomenRequiredTrue
  }
};

const Person = {
  name: 'Person',
  definition: {
    FullName: Include({
      category: 'FullName',
      definition: FullName.definition
    }),
    Sex: domains.sex,
    Born: domains.born,
    Languages: Many({
      category: 'Language',
      definition: Language.definition
    })
  }
};

metatests.test('Database / general categories', (test) => {
  metaschema.load('general', (err, schema) => {
    test.error(err);
    metaschema.build(schema);
    const categories = [FullName, Language, Person];
    for (const { name, definition } of categories) {
      const category = metaschema.categories.get(name);

      test.strictSame(category.name, name);
      for (const key in definition) {
        test.strictSame(category.definition[key], definition[key]);
      }
    }

    test.end();
  });
});
