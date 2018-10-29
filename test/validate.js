'use strict';

const path = require('path');
const metatests = require('metatests');
const metaschema = require('..');
const { addSchema } = require('../lib/schema');

const getDefinition = (ms, name) => ms.categories.get(name).definition;

const validateTest = metatests.test('validate');

const metaschemaPath = path.join(__dirname, '..', 'schemas', 'metaschema');
metaschema.fs.loadAndCreate(metaschemaPath, null, (err, ms) => {
  validateTest.error(err);

  ms[addSchema]('Schema1', { Name: { domain: 'Nomen', required: false } });
  ms[addSchema]('Schema2', { Name: { domain: 'Nomen', required: true } });
  ms[addSchema]('Schema3', { Name: { domain: 'Unknown' } });

  metatests.case('Metaschema / validate', {
    validate: ms.validate.bind(ms),
    validateFields: ms.validateFields.bind(ms),
  }, {
    'validate': [
      [
        'Schema1', { Name: 'Marcus Aurelius' },
        null,
      ], [
        'Schema1', {},
        null,
      ], [
        'Schema1', { City: 'Kiev' },
        { errors: ['Field City not defined'] },
      ], [
        'Schema1', { FirstName: 'Marcus', Surname: 'Aurelius' },
        {
          errors: [
            'Field FirstName not defined',
            'Field Surname not defined',
          ],
        },
      ], [
        'Schema1', {},
        null,
      ], [
        'Schema2', {},
        {
          errors: [
            'Field Name not found',
          ],
        },
      ],
    ],
    'validateFields': [
      [
        'StructureField', getDefinition(ms, 'Schema1'),
        null,
      ], [
        'StructureField', getDefinition(ms, 'StructureField'),
        {
          errors: [
            'Field definition not defined',
            'Field definition not defined',
            'Field definition not defined',
            'Field definition not defined',
            'Field definition not defined',
            'Validation failed',
          ],
        },
      ],
    ],
  });

  validateTest.end();
});
