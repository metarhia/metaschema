'use strict';

const metaschema = require('..');

metaschema.loadSchema('geometry', (err, schema) => {
  if (err) throw err;
  const geometry = metaschema.buildSchema(schema);
  console.dir({ geometry });
});
