'use strict';

const metaschema = require('..');

metaschema.loadSchema('./schemas/CategoryField.schema', (err, schema) => {
  if (err) throw err;
  metaschema.build({ CategoryField: schema });

  metaschema.build({
    Schema1: { Name: { domain: 'Nomen', required: false } },
    Schema2: { Name: { domain: 'Nomen', required: true } },
    Schema3: { Name: { domain: 'Unknown' } }
  });

  // Validate data by category, valid
  {
    const data = { Name: 'Marcus Aurelius' };
    const valid = metaschema.validate('Schema1', data);
    console.dir(valid);
  }

  // Validate data by category, valid, not required
  {
    const data = {};
    const valid = metaschema.validate('Schema1', data);
    console.dir(valid);
  }

  // Validate data by category, field not found
  {
    const data = { City: 'Kiev' };
    const valid = metaschema.validate('Schema1', data);
    console.dir(valid);
  }

  // Validate data by category schema, field not defined
  {
    const data = { FirstName: 'Marcus', Surname: 'Aurelius' };
    const valid = metaschema.validate('Schema1', data);
    console.dir(valid);
  }

  // Validate category schema
  {
    const { definition } = metaschema.categories.get('Schema1');
    const valid = metaschema.validateFields('CategoryField', definition);
    console.dir(valid);
  }

  // Validate category field schema
  {
    const { definition } = metaschema.categories.get('CategoryField');
    const valid = metaschema.validateFields('CategoryField', definition);
    console.dir(valid);
  }

});
