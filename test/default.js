'use strict';

const metatests = require('metatests');

const {
  fs: { load },
  default: { options, config },
} = require('..');

const { getSchemaDir } = require('./utils');
const path = getSchemaDir('modules');

const domains = {
  Nomen: { type: 'string' },
  CountryName: { type: 'string' },
  DateTime: { type: 'object', class: 'Date' },
};

const FullName = {
  type: 'category',
  name: 'FullName',
  module: 'Person',
  definition: {
    FirstName: { domain: 'Nomen', definition: domains.Nomen },
    LastName: { domain: 'Nomen', definition: domains.Nomen },
  },
  source:
    "{\n  FirstName: { domain: 'Nomen' },\n  " +
    "LastName: { domain: 'Nomen' },\n}\n",
};

const Person = {
  type: 'category',
  name: 'Person',
  module: 'Person',
  definition: {
    DOB: { domain: 'DateTime', definition: domains.DateTime },
    FullName: { category: 'FullName', definition: FullName.definition },
    Citizenship: { domain: 'CountryName', definition: domains.CountryName },
  },
  source:
    "{\n  DOB: { domain: 'DateTime' },\n  " +
    "FullName: { category: 'FullName' },\n  " +
    "Citizenship: { domain: 'CountryName' },\n}\n",
};

const categories = { FullName, Person };

metatests.test('must properly process schemas', async test => {
  let errors;
  let ms;

  try {
    [errors, ms] = await load(path, options, config);
  } catch (error) {
    test.fail(error);
    test.end();
    return;
  }

  test.strictSame(errors.length, 0);
  test.strictSame(ms.domains.size, 3);
  test.strictSame(ms.categories.size, 2);

  for (const [name, domain] of ms.domains) {
    test.strictSame(domain, domains[name]);
  }

  for (const [name, category] of ms.categories) {
    test.strictSame(category, categories[name]);
  }

  test.end();
});
