'use strict';

const metatests = require('metatests');
const metaschema = require('..');

const path = './schemas/metaschema/StructureField.schema';

const getDefinition = name => metaschema.categories.get(name).definition;

const validateTest = metatests.test('validate');

metaschema.loadSchema(path, (err, schema) => {
  validateTest.error(err);

  metaschema.build({ StructureField: schema });

  metaschema.build({
    Schema1: { Name: { domain: 'Nomen', required: false } },
    Schema2: { Name: { domain: 'Nomen', required: true } },
    Schema3: { Name: { domain: 'Unknown' } },
  });

  metatests.case('Metaschema / validate', { metaschema }, {
    'metaschema.validate': [
      [
        'Schema1', { Name: 'Marcus Aurelius' },
        { valid: true, errors: [] }
      ], [
        'Schema1', {},
        { valid: true, errors: [] }
      ], [
        'Schema1', { City: 'Kiev' },
        { valid: false, errors: ['Field City not defined'] }
      ], [
        'Schema1', { FirstName: 'Marcus', Surname: 'Aurelius' },
        { valid: false, errors: [
          'Field FirstName not defined',
          'Field Surname not defined'
        ] }
      ], [
        'Schema1', {},
        { valid: true, errors: [] }
      ], [
        'Schema2', {},
        { valid: false, errors: [
          'Field Name not found'
        ] }
      ]
    ],
    'metaschema.validateFields': [
      [
        'StructureField', getDefinition('Schema1'),
        { valid: true, errors: [] }
      ], [
        'StructureField', getDefinition('StructureField'),
        { valid: false, errors: ['Validation failed'] }
      ]
    ]
  });

  validateTest.end();
});
