'use strict';

const metaschema = require('..');

metaschema.load('general', (err, schema) => {
  if (err) throw err;
  metaschema.build(schema);

  const Person = metaschema.categories.get('Person');
  console.dir(Person, { depth: null });

  const Language = metaschema.categories.get('Language');
  console.dir(Language, { depth: null });

  const FullName = metaschema.categories.get('FullName');
  console.dir(FullName, { depth: null });
});
