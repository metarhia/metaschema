'use strict';

const metatests = require('metatests');
const { Model } = require('..');

metatests.test('Model: from struct', (test) => {
  const database = {
    name: 'example',
    description: 'Example database schema',
    version: 3,
    driver: 'pg',
  };
  const types = { string: 'varchar' };
  const entities = new Map();
  entities.set('Company', {
    Company: 'global dictionary',
    name: { type: 'string', unique: true },
    addresses: { many: 'Address' },
  });

  const expected = {
    database: {
      name: 'example',
      description: 'Example database schema',
      version: 3,
      driver: 'pg',
    },
    types: { string: 'varchar' },
    entities: new Map([
      [
        'Company',
        {
          name: 'Company',
          scope: 'global',
          kind: 'dictionary',
          fields: { name: { type: 'string', unique: true, required: true } },
          indexes: { addresses: { many: 'Address' } },
          validate: null,
          format: null,
          parse: null,
          serialize: null,
        },
      ],
    ]),
    order: new Set(['Company']),
  };

  const model = new Model(types, entities, database);
  test.strictEqual(model, expected);
  test.end();
});
