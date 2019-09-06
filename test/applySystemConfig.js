'use strict';

const metatests = require('metatests');

const {
  MetaschemaError,
  ValidationError,
  SchemaValidationError,
} = require('../lib/errors');

const {
  default: defaultConfig,
  fs: { load, applySystemConfig },
} = require('../metaschema');

const { getSchemaDir } = require('./utils');
const systemSchemaPath = getSchemaDir('systemSchema');

metatests.test('must properly apply system config', async test => {
  const newConfig = await applySystemConfig(
    systemSchemaPath,
    defaultConfig,
    defaultConfig
  );

  test.assert(
    Object.hasOwnProperty.call(
      newConfig.config.processors.domains,
      'validateSchema'
    )
  );
  test.assert(
    Object.hasOwnProperty.call(
      newConfig.config.processors.category,
      'validateSchema'
    )
  );
});

metatests.test(
  'must properly validate schemas with system schemas',
  async test => {
    const validSchemaPath = getSchemaDir('validSchema');
    const invalidSchemaPath = getSchemaDir('invalidSchema');
    const invalidSchemaReferencePath = getSchemaDir('invalidSchemaReference');

    const newConfig = await applySystemConfig(
      systemSchemaPath,
      defaultConfig,
      defaultConfig
    );

    await load(validSchemaPath, newConfig.options, newConfig.config);

    let error = await test.rejects(
      load(invalidSchemaPath, newConfig.options, newConfig.config)
    );
    test.strictSame(
      error,
      new MetaschemaError([
        new ValidationError(
          'notAllowedAdditionalProp',
          'invalidSchema.invalidDomain',
          {
            allowed: ['domain'],
          }
        ),
      ])
    );

    error = await test.rejects(
      load(invalidSchemaReferencePath, newConfig.options, newConfig.config)
    );
    test.strictSame(
      error,
      new MetaschemaError([
        new SchemaValidationError(
          'unresolved',
          'invalidSchemaReference.objectReference',
          { type: 'category', value: 'UNRESOLVED_CATEGORY' }
        ),
      ])
    );
  }
);
