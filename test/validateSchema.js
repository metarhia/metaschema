'use strict';

const { join } = require('path');
const metatests = require('metatests');
const metaschema = require('..');
const { MetaschemaError, ValidationError } = require('../lib/schema-errors');

const test = metatests.test('Validate schemas');
const schemasPath = join(__dirname, 'schemas', 'validateSchema');
const systemSchemasPath = join(__dirname, '../schemas', 'metaschema');

metaschema.fs.loadAndCreate([schemasPath, systemSchemasPath], null, err => {
  if (err) {
    err.errors = err.errors.sort((e1, e2) =>
      e1.property > e2.property ? 1 : -1
    );
  }
  test.strictSame(
    err,
    new MetaschemaError([
      new ValidationError('enum', 'InvalidDomainSubtype.Domain.subtype', {
        expected: ['double', 'int'],
        actual: 'float',
      }),
      new ValidationError('enum', 'InvalidDomainType.Domain.type', {
        expected: [
          'string',
          'number',
          'bigint',
          'boolean',
          'object',
          'function',
        ],
        actual: '_INVAID_TYPE_',
      }),
      new ValidationError(
        'validation',
        'domainAndCategory.DatabaseField.Check'
      ),
      new ValidationError('validation', 'indexAndUnique.DatabaseField.Check'),
      new ValidationError('validation', 'invalidType.DatabaseField.Check'),
      new ValidationError('invalidType', 'invalidType.DatabaseField.required', {
        expected: 'boolean',
        actual: 'string',
      }),
      new ValidationError(
        'validation',
        'neitherDomainNorCategory.DatabaseField.Check'
      ),
      new ValidationError('validation', 'notAllowedField.DatabaseField.Check'),
    ])
  );

  test.end();
});
