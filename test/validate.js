'use strict';

const metaschema = require('..');

metaschema.load('geometry', (err, schema) => {
  if (err) throw err;
  metaschema.build(schema);

  // Validate data by schema

  const valid = metaschema.validate('Point', { x: 3, y: 5 });
  console.dir({ valid });

  const invalid = metaschema.validate('Point', { a: 3, b: 5 });
  console.dir({ invalid });

  // Validate category schema by schema

  const { definition } = metaschema.categories.get('Point');
  const vPoint = metaschema.validateFields('CategoryField', definition);
  console.dir({ definition, vPoint });
});
