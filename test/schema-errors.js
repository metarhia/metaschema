'use strict';

const metatests = require('metatests');

const { ValidationError } = require('../lib/schema-errors');

const test = metatests.testSync();

[
  [
    new ValidationError('unresolvedProperty', 'prop'),
    'Unresolved property \'prop\'',
  ],
  [
    new ValidationError('missingProperty', 'prop'),
    'Missing property \'prop\'',
  ],
  [
    new ValidationError('emptyValue', 'prop'),
    'Empty value in required property \'prop\'',
  ],
  [
    new ValidationError('validation', 'Check'),
    'Failed to validate rule \'Check\'',
  ],
  [
    new ValidationError('propValidation', 'prop'),
    'Failed to validate property \'prop\'',
  ],
  [
    new ValidationError('immutable', 'prop'),
    'Mutation of read-only property \'prop\'',
  ],
  [
    new ValidationError(
      'invalidType',
      'prop',
      { expected: 'number', actual: 'string' }
    ),
    'Invalid type of property \'prop\', ' +
    'expected: \'number\', actual: \'string\'',
  ],
  [
    new ValidationError(
      'invalidClass',
      'prop',
      { expected: 'Number', actual: 'String' }
    ),
    'Invalid class of property \'prop\', ' +
    'expected: \'Number\', actual: \'String\'',
  ],
  [
    new ValidationError('domainValidation', 'prop', 'rule'),
    'Failed to validate rule \'rule\' on property \'prop\'',
  ],
  [
    new ValidationError(
      'enum',
      'prop',
      { expected: ['One', 'Two'], actual: 'Tre' }
    ),
    'Invalid value of a enum in a property \'prop\' ' +
    'allowed: \'One\', \'Two\', actual: \'Tre\'',
  ],
  [
    new ValidationError('undefinedEntity', 'Entity', 'entity'),
    'Undefined entity \'Entity\'',
  ],
].forEach(([error, string]) => test.strictEqual(error.toString(), string));
