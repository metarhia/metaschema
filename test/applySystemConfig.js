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

metatests.test('Must properly apply system config', async test => {
  const newConfig = await applySystemConfig(
    systemSchemaPath,
    defaultConfig,
    defaultConfig
  );

  test.assert(
    newConfig.config.processors.domains.hasOwnProperty('validateSchema')
  );
  test.assert(
    newConfig.config.processors.category.hasOwnProperty('validateSchema')
  );

  test.end();
});

metatests.test(
  'Must properly validate schemas with system schemas',
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

    try {
      await load(invalidSchemaPath, newConfig.options, newConfig.config);
      test.fail();
    } catch (err) {
      test.strictSame(
        err,
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
    }

    try {
      await load(
        invalidSchemaReferencePath,
        newConfig.options,
        newConfig.config
      );
      test.fail();
    } catch (err) {
      test.strictSame(
        err,
        new MetaschemaError([
          new SchemaValidationError(
            'unresolved',
            'invalidSchemaReference.objectReference',
            { type: 'category', value: 'UNRESOLVED_CATEGORY' }
          ),
        ])
      );
    }

    test.end();
  }
);
