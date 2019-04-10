'use strict';

const metatests = require('metatests');

const {
  Metaschema,
  default: { decorators, options, config },
} = require('..');

const { SchemaValidationError } = require('../lib/errors');

metatests.testSync('default config adders', test => {
  const ms = new Metaschema(config);

  config.prepare(ms);

  const [addDomains] = config.processors.domains.add;
  addDomains({ definition: { Nomen: { type: 'string' } } }, ms);

  test.strictSame(ms.domains.get('Nomen'), { type: 'string' });

  test.strictSame(
    addDomains(
      { name: 'DUPLICATE_DOMAIN', definition: { Nomen: { type: 'string' } } },
      ms
    ),
    [
      new SchemaValidationError('duplicate', 'DUPLICATE_DOMAIN', {
        type: 'domain',
        value: 'Nomen',
      }),
    ]
  );

  const [addCategory] = config.processors.category.add;
  addCategory({ name: 'Person' }, ms);

  test.strictSame(ms.categories.get('Person'), { name: 'Person' });

  test.strictSame(addCategory({ name: 'Person' }, ms), [
    new SchemaValidationError('duplicate', 'Person', {
      type: 'category',
      value: 'Person',
    }),
  ]);

  test.strictSame(options.pathToType('name.domains'), 'domains');
  test.strictSame(options.pathToType('name.category'), 'category');

  test.strictSame(config.processOrder, {
    domains: 0,
    category: 1,
  });
});

metatests.testSync('default decorators', test => {
  const classes = Object.keys(decorators.classes);
  const functions = Object.keys(decorators.functions);
  test.strictSame(classes, [
    'ValuesDecorator',
    'Enum',
    'Flags',
    'Validate',
    'List',
  ]);
  test.strictSame(functions, ['Enum', 'Flags', 'Validate', 'List']);
});

metatests.case(
  'default config load order',
  { options },
  {
    'options.loadOrder': [
      ['without dot', 'with dot .', 2],
      ['with dot .', 'without dot', -2],
      ['without dot', 'endsWith.category', 1],
      ['endsWith.category', 'without dot', -1],
      ['endsWith.domains', 'without dot', -2],
      ['without dot', 'endsWith.domains', 2],
    ],
  }
);
