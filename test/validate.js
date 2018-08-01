'use strict';

const metaschema = require('..');

metaschema.load('geometry', (err, schema) => {
  if (err) throw err;
  metaschema.build(schema);

  const valid = metaschema.validate('Point', { x: 3, y: 5 });
  console.dir({ valid });

  const invalid = metaschema.validate('Point', { a: 3, b: 5 });
  console.dir({ invalid });
});
