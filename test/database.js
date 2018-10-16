'use strict';

/* eslint new-cap: 0 */

const path = require('path');
const metatests = require('metatests');
const common = require('@metarhia/common');
const metaschema = require('..');

const { Enum, Many, Include, Master } = require('../lib/decorators').attribute;
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

domains.sex.definition.Class = common.Enum.from('female', 'male');

const FullName = {
  name: 'FullName',
  definition: {
    FirstName: domains.nomenRequiredTrue,
    MiddleName: domains.nomen,
    Patronymic: domains.nomen,
    Surname: domains.nomenRequiredTrue,
  },
  references: {
    Include: [{ category: 'Person', property: 'FullName' }],
    Many: [],
    Master: [{ category: 'Document', property: 'Owner' }],
    Other: [{ category: 'Document', property: 'IssuedTo' }],
  },
};

const Language = {
  name: 'Language',
  definition: {
    Name: domains.nomenRequiredTrue,
  },
  references: {
    Include: [],
    Many: [{ category: 'Person', property: 'Languages' }],
    Master: [],
    Other: [],
  },
};

const Person = {
  name: 'Person',
  definition: {
    FullName: Include({
      category: 'FullName',
      definition: FullName.definition,
      required: true,
    }),
    Sex: domains.sex,
    Born: domains.born,
    Languages: Many({
      category: 'Language',
      definition: Language.definition,
    }),
  },
  references: {
    Include: [],
    Many: [],
    Master: [],
    Other: [],
  },
};

const Document = {
  name: 'Document',
  definition: {
    Owner: Master({
      category: 'FullName',
      required: true,
      definition: FullName.definition,
    }),
    IssuedTo: {
      category: 'FullName',
      required: true,
      definition: FullName.definition,
    },
    Series: domains.nomen,
  },
  references: {
    Include: [],
    Many: [],
    Master: [],
    Other: [],
  },
};

metatests.test('Database / general categories', test => {
  const generalPath = path.join(__dirname, '..', 'schemas', 'general');
  metaschema.fs.loadAndCreate(generalPath, null, (err, ms) => {
    test.error(err);
    const categories = [FullName, Language, Person, Document];
    for (const { name, definition, references } of categories) {
      const category = ms.categories.get(name);

      test.strictSame(category.name, name, `${name}.name`);
      for (const key in definition) {
        test.strictSame(
          category.definition[key],
          definition[key],
          `${name}.definition.${key}`
        );
      }

      test.strictSame(category.references, references, `${name}.references`);
    }

    test.end();
  });
});

metatests.test('Multiple load directories', test => {
  const schemas = ['schemas1', 'schemas2'].map(s =>
    getSchemaDir(s, 'multipleLoad')
  );
  metaschema.fs.loadAndCreate(schemas, null, (err, ms) => {
    test.error(err);
    const categories = [FullName, Language];
    for (const { name, definition } of categories) {
      const category = ms.categories.get(name);
      test.strictSame(category.name, name);
      test.strictSame(category.definition, definition);
    }

    test.end();
  });
});
