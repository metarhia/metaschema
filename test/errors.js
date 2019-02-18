'use strict';

const metatests = require('metatests');
const { SchemaValidationError, ValidationError } = require('../lib/errors.js');

const errorsTest = metatests.testSync('errors test');

[
  {
    args: ['unresolved', 'source', { type: 'type', value: 'value' }],
    expected: `Reference to unresolved type 'value' from 'source'`,
    ErrorClass: SchemaValidationError,
  },
  {
    args: ['duplicate', 'source', { type: 'type', value: 'value' }],
    expected: `Duplicate type 'value' in 'source'`,
    ErrorClass: SchemaValidationError,
  },
  {
    args: ['unresolvedProperty', 'prop'],
    expected: `Unresolved property 'prop'`,
    ErrorClass: ValidationError,
  },
  {
    args: ['missingProperty', 'prop'],
    expected: `Missing property 'prop'`,
    ErrorClass: ValidationError,
  },
  {
    args: ['emptyValue', 'prop'],
    expected: `Empty value in required property 'prop'`,
    ErrorClass: ValidationError,
  },
  {
    args: ['validation', 'rule'],
    expected: `Failed to validate rule 'rule'`,
    ErrorClass: ValidationError,
  },
  {
    args: ['propValidation', 'prop'],
    expected: `Failed to validate property 'prop'`,
    ErrorClass: ValidationError,
  },
  {
    args: ['immutable', 'prop'],
    expected: `Mutation of read-only property 'prop'`,
    ErrorClass: ValidationError,
  },
  {
    args: ['invalidType', 'prop', { expected: 'expected', actual: 'actual' }],
    expected:
      `Invalid type of property 'prop', ` +
      `expected: 'expected', actual: 'actual'`,
    ErrorClass: ValidationError,
  },
  {
    args: ['invalidClass', 'prop', { expected: 'Expected', actual: 'Actual' }],
    expected:
      `Invalid class of property 'prop', ` +
      `expected: 'Expected', actual: 'Actual'`,
    ErrorClass: ValidationError,
  },
  {
    args: ['domainValidation', 'prop', 'rule'],
    expected: `Failed to validate rule 'rule' on property 'prop'`,
    ErrorClass: ValidationError,
  },
  {
    args: [
      'enum',
      'prop',
      { expected: ['expected1', 'expected2'], actual: 'actual' },
    ],
    expected:
      `Invalid value of a enum in a property 'prop' ` +
      `allowed: 'expected1', 'expected2', actual: 'actual'`,
    ErrorClass: ValidationError,
  },
  {
    args: ['undefinedEntity', 'prop', 'entity'],
    expected: `Undefined entity 'prop'`,
    ErrorClass: ValidationError,
  },
].forEach(({ args, expected, ErrorClass }) => {
  const err = new ErrorClass(...args);
  errorsTest.strictSame(err.toString(), expected);
});
