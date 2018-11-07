'use strict';

const metatests = require('metatests');
const metaschema = require('..');
const { getSchemaDir } = require('./utils');

const test = config => metatests.test(config.name, test => {
  const dir = getSchemaDir(config.schemaName);
  metaschema.fs.loadAndCreate(dir, null, error => {
    if (!config.error) {
      test.error(error);
    } else {
      test.isError(error);
      test.equal(error.errors.length, 1, 'must only return one error');
      const [actual] = error.errors;
      test.strictSame(actual.type, config.error.type);
      test.strictSame(actual.source, config.error.source);
      test.strictSame(actual.property, config.error.property);
    }
    test.end();
  });
});

const testConfigs = [
  {
    name: 'Validate unresolved domain',
    schemaName: 'unresolvedDomainValidation',
    error: {
      type: 'unresolvedDomain',
      source: 'UnresolvedDomainEntity',
      property: 'UnresolvedDomain',
    },
  },
  {
    name: 'Validate unresolved category',
    schemaName: 'unresolvedCategoryValidation',
    error: {
      type: 'unresolvedCategory',
      source: 'UnresolvedCategoryEntity',
      property: 'UnresolvedCategory',
    },
  },
  {
    name: 'Validate link to \'Log\' category',
    schemaName: 'linkToLogValidation',
    error: {
      type: 'linkToLog',
      source: 'LinkToLogEntity',
      property: 'LinkToLog',
    },
  },
  {
    name: 'Validate illegal link to \'Local\'',
    schemaName: 'illegalLinkToLocalValidation',
    error: {
      type: 'illegalLinkToLocal',
      source: 'IllegalLinkToLocalEntity',
      property: 'IllegalLinkToLocal',
    },
  },
  {
    name: 'Validate valid schemas',
    schemaName: 'validSchemasValidation',
  },
];

testConfigs.forEach(test);
