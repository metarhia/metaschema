'use strict';

const { clone } = require('@metarhia/common');
const metatests = require('metatests');

const { Flags } = require('../lib/decorators').classes;

const {
  default: def,
  fs: { load },
} = require('..');

const { options, config } = clone(def);

metatests.test('Decorators / Flags', async test => {
  const schema = await load('test/schemas/decorators', options, config);

  const SimpleFlags = schema.domains.get('SimpleFlags');
  test.assert(SimpleFlags instanceof Flags);
  test.strictSame(SimpleFlags.values, ['a', 'b', 'c']);
  test.strictSame(SimpleFlags.enum, undefined);

  const FlagsFromValues = schema.domains.get('FlagsFromValues');
  test.assert(FlagsFromValues instanceof Flags);
  test.strictSame(FlagsFromValues.values, ['a', 'b', 'c']);
  test.strictSame(FlagsFromValues.enum, undefined);

  const FlagsFromEnum = schema.domains.get('FlagsFromEnum');
  test.assert(FlagsFromEnum instanceof Flags);
  test.strictSame(FlagsFromEnum.values, ['a', 'b', 'c']);
  test.strictSame(FlagsFromEnum.enum, 'EnumDomain');

  const FlagsOf = schema.domains.get('FlagsOf');
  test.assert(FlagsOf instanceof Flags);
  test.strictSame(FlagsOf.values, ['a', 'b', 'c']);
  test.strictSame(FlagsOf.enum, 'EnumDomain');

  test.end();
});
