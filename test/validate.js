'use strict';

const path = require('path');
const metatests = require('metatests');
const { Uint64 } = require('@metarhia/common');
const metasync = require('metasync');

const metaschema = require('..');
const { ValidationError, MetaschemaError } = require('../lib/schema-errors');

const validateTest = metatests.test('validate');

const metaschemaPath = path.join(__dirname, '..', 'schemas', 'metaschema');
const schemaPath = path.join(__dirname, 'schemas', 'validate');

const schemas = [];

metasync.each(
  [metaschemaPath, schemaPath],
  (dir, cb) =>
    metaschema.fs.load(dir, null, true, (err, arr) => {
      schemas.push(...arr);
      cb(err);
    }),
  err => {
    validateTest.error(err);

    if (err) {
      validateTest.end();
      return;
    }

    const [error, ms] = metaschema.createAndProcess(schemas);

    validateTest.error(error);

    if (error) {
      validateTest.end();
      return;
    }

    metatests.case(
      'Metaschema / validate',
      {
        validateCategory: ms.validateCategory.bind(ms),
        validateAction: ms.validateAction.bind(ms),
        validateFields: ms.validateFields.bind(ms),
      },
      {
        validateCategory: [
          ['Schema1', { Name: 'Marcus Aurelius', Ratio: 0.5 }, null],
          ['Schema1', {}, null],
          ['Schema1', { Name: undefined }, null],
          ['Schema1', { Name: null }, null],
          [
            'Schema1',
            { City: 'Kiev' },
            new MetaschemaError([
              new ValidationError('unresolvedProperty', 'Schema1.City'),
            ]),
          ],
          [
            'Schema1',
            { FirstName: 'Marcus', Surname: 'Aurelius' },
            new MetaschemaError([
              new ValidationError('unresolvedProperty', 'Schema1.FirstName'),
              new ValidationError('unresolvedProperty', 'Schema1.Surname'),
            ]),
          ],
          [
            'Schema2',
            {},
            new MetaschemaError([
              new ValidationError('missingProperty', 'Schema2.Name'),
            ]),
          ],
          ['Schema2', {}, true, null],
          [
            'Schema2',
            { Name: null },
            new MetaschemaError([
              new ValidationError('emptyValue', 'Schema2.Name'),
            ]),
          ],
          [
            'Schema2',
            { Name: undefined },
            new MetaschemaError([
              new ValidationError('emptyValue', 'Schema2.Name'),
            ]),
          ],
          [
            'SchemaForDomainRules',
            { Number: 2, String: '1'.repeat(20) },
            new MetaschemaError([
              new ValidationError(
                'domainValidation',
                'SchemaForDomainRules.Number',
                'min'
              ),
              new ValidationError(
                'domainValidation',
                'SchemaForDomainRules.String',
                'length'
              ),
            ]),
          ],
          [
            'SchemaForDomainRules',
            { Number: NaN, String: '1234' },
            new MetaschemaError([
              new ValidationError(
                'domainValidation',
                'SchemaForDomainRules.Number',
                'min'
              ),
              new ValidationError(
                'domainValidation',
                'SchemaForDomainRules.Number',
                'max'
              ),
              new ValidationError(
                'domainValidation',
                'SchemaForDomainRules.Number',
                'subtype'
              ),
              new ValidationError(
                'propValidation',
                'SchemaForDomainRules.Number'
              ),
              new ValidationError(
                'domainValidation',
                'SchemaForDomainRules.String',
                'min'
              ),
            ]),
          ],
          [
            'SchemaForDomainRules',
            {
              Number: 20,
              String: '1'.repeat(5),
              UintArray: new Uint32Array(5),
            },
            null,
          ],
          [
            'SchemaForDomainRules',
            { Number: 5.5, UintArray: new Uint32Array(20) },
            new MetaschemaError([
              new ValidationError(
                'domainValidation',
                'SchemaForDomainRules.Number',
                'min'
              ),
              new ValidationError(
                'domainValidation',
                'SchemaForDomainRules.Number',
                'subtype'
              ),
              new ValidationError(
                'propValidation',
                'SchemaForDomainRules.Number'
              ),
              new ValidationError(
                'domainValidation',
                'SchemaForDomainRules.UintArray',
                'length'
              ),
            ]),
          ],
          [
            'SchemaForDomainRules',
            { Number: 200, CheckSum: new Number() },
            new MetaschemaError([
              new ValidationError(
                'domainValidation',
                'SchemaForDomainRules.Number',
                'max'
              ),
              new ValidationError(
                'invalidClass',
                'SchemaForDomainRules.CheckSum',
                {
                  expected: 'Uint8Array',
                  actual: 'Number',
                }
              ),
            ]),
          ],
          ['SchemaEnum', { Enum: 'One' }, null],
          [
            'SchemaEnum',
            { Enum: '__Invalid__' },
            new MetaschemaError([
              new ValidationError('enum', 'SchemaEnum.Enum', {
                expected: ['One', 'Two'],
                actual: '__Invalid__',
              }),
            ]),
          ],
          ['SchemaFlags', { Flags: new Uint64(2) }, null],
          ['SchemaEnum', { Enum: 'One' }, null],
          [
            'SchemaEnum',
            { Enum: '__Invalid__' },
            new MetaschemaError([
              new ValidationError('enum', 'SchemaEnum.Enum', {
                expected: ['One', 'Two'],
                actual: '__Invalid__',
              }),
            ]),
          ],
          ['SchemaFlags', { Flags: new Uint64(2) }, null],
          [
            'SchemaFlags',
            { Flags: 'One' },
            new MetaschemaError([
              new ValidationError('invalidClass', 'SchemaFlags.Flags', {
                expected: ['Uint64', 'FlagsClass'],
                actual: 'String',
              }),
            ]),
          ],
          ['SchemaWithLink', { Plain: new Uint64(2), Include: {} }, null],
          ['SchemaWithLink', { Plain: '2', Include: {} }, null],
          [
            'SchemaWithLink',
            { Plain: {}, Include: {} },
            new MetaschemaError([
              new ValidationError('invalidClass', 'SchemaWithLink.Plain', {
                expected: ['Uint64', 'String'],
                actual: 'Object',
              }),
            ]),
          ],
          ['SchemaWithLink', { Include: {}, Many: [new Uint64(2)] }, null],
          [
            'SchemaWithLink',
            { Include: {}, Many: [{}] },
            new MetaschemaError([
              new ValidationError('invalidClass', 'SchemaWithLink.Many[0]', {
                expected: ['Uint64', 'String'],
                actual: 'Object',
              }),
            ]),
          ],
          [
            'SchemaWithLink',
            { Include: {}, Many: 42 },
            new MetaschemaError([
              new ValidationError('invalidType', 'SchemaWithLink.Many', {
                expected: 'Array',
                actual: 'number',
              }),
            ]),
          ],
          ['SchemaWithLink', { Include: { Name: 'Marcus' } }, null],
          [
            'SchemaWithLink',
            { Include: { Name: 42 } },
            new MetaschemaError([
              new ValidationError(
                'invalidType',
                'SchemaWithLink.Include.Name',
                {
                  expected: 'string',
                  actual: 'number',
                }
              ),
            ]),
          ],
          [
            'SchemaWithLink',
            {},
            new MetaschemaError([
              new ValidationError('missingProperty', 'SchemaWithLink.Include'),
            ]),
          ],
          [
            '__InvalidCategory__',
            { Name: 21 },
            new MetaschemaError([
              new ValidationError(
                'undefinedEntity',
                '__InvalidCategory__',
                'category'
              ),
            ]),
          ],
        ],
        validateFields: [
          ['StructureField', { prop: { domain: 'Nomen' } }, null],
          [
            'StructureField',
            {
              valid: { domain: 'Nomen' },
              invalid: { domain: 'Nomen', definition: 42 },
              failsCheck: { required: true },
            },
            new MetaschemaError([
              new ValidationError(
                'unresolvedProperty',
                'invalid.StructureField.definition'
              ),
              new ValidationError(
                'validation',
                'failsCheck.StructureField.Check'
              ),
            ]),
          ],
        ],
        validateAction: [
          ['Schema1', 'DoSome', { Name: '12' }, null],
          [
            'Schema1',
            'DoSome',
            { Name: 12 },
            new MetaschemaError([
              new ValidationError('invalidType', 'Schema1.DoSome.Name', {
                expected: 'string',
                actual: 'number',
              }),
            ]),
          ],
          [
            '__InvalidCategory__',
            'DoSome',
            { Name: 21 },
            new MetaschemaError([
              new ValidationError(
                'undefinedEntity',
                '__InvalidCategory__',
                'category'
              ),
            ]),
          ],
          [
            'Schema1',
            '__InvalidAction__',
            { Name: 21 },
            new MetaschemaError([
              new ValidationError(
                'undefinedEntity',
                '__InvalidAction__',
                'action'
              ),
            ]),
          ],
        ],
      }
    );

    validateTest.end();
  }
);
