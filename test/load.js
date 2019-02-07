'use strict';

const { clone } = require('@metarhia/common');
const metatests = require('metatests');

const {
  default: def,
  fs: { load },
} = require('..');

const { options, config } = clone(def);
config.processors.category.postprocess = [];

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
    FirstName: { domain: 'Nomen' },
    LastName: { domain: 'Nomen' },
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
    DOB: { domain: 'DateTime' },
    FullName: { category: 'FullName' },
    Citizenship: { domain: 'CountryName' },
  },
  source:
    "{\n  DOB: { domain: 'DateTime' },\n  " +
    "FullName: { category: 'FullName' },\n  " +
    "Citizenship: { domain: 'CountryName' },\n}\n",
};

const categories = { FullName, Person };

metatests.test('must properly load schemas', async test => {
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
