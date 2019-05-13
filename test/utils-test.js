'use strict';

const metatests = require('metatests');

const { SchemaValidationError } = require('../lib/errors');
const { extractDecorator, extractByPath } = require('../lib/utils');

const {
  fs: { load },
  default: { options, config },
} = require('..');

const { getSchemaDir } = require('./utils');
const path = getSchemaDir('utils');

metatests.test('must properly load schema (utils test)', async test => {
  const ms = await load(path, options, config);

  test.strictSame(ms.domains.size, 1);
  test.strictSame(ms.categories.size, 2);

  const FullName = ms.categories.get('FullName');
  const Person = ms.categories.get('Person');

  test.strictSame(extractDecorator(Person), 'Object');
  test.strictSame(extractDecorator(Person.definition.Validate), 'Validate');

  test.strictSame(
    extractByPath(Person.definition, '::FullName', ms, 'Person'),
    { category: 'FullName', definition: FullName.definition }
  );

  test.strictSame(
    extractByPath(Person.definition, '::FullName.FirstName', ms, 'Person'),
    FullName.definition.FirstName
  );

  test.strictSame(extractByPath(Person.definition, 'FullName', ms, 'Person'), {
    category: 'FullName',
    definition: FullName.definition,
  });

  test.strictSame(
    extractByPath(Person.definition, 'Parent.FullName.LastName', ms, 'Person'),
    FullName.definition.LastName
  );

  try {
    extractByPath(Person.definition, '::INVALID', ms, 'Person');
  } catch (error) {
    test.strictSame(
      error,
      new SchemaValidationError('unresolved', 'Person', {
        type: 'category',
        value: '::INVALID',
      })
    );
  }

  try {
    extractByPath(Person.definition, 'INVALID', ms, 'Person');
  } catch (error) {
    test.strictSame(
      error,
      new SchemaValidationError('unresolved', 'Person', {
        type: 'property',
        value: 'INVALID',
      })
    );
  }

  try {
    extractByPath(Person.definition, 'FullName.INVALID', ms, 'Person');
  } catch (error) {
    test.strictSame(
      error,
      new SchemaValidationError('unresolved', 'Person', {
        type: 'property',
        value: 'FullName.INVALID',
      })
    );
  }

  test.end();
});
