'use strict';

const { Uint64 } = require('@metarhia/common');
const metatests = require('metatests');

const { Flags } = require('../lib/decorators').classes;

const {
  default: { options, config },
  fs: { load },
} = require('..');

const FLAGS = ['FlagsFromValues', 'FlagsFromEnum', 'FlagsOf'];

metatests.test('must properly create Flags', async test => {
  const schema = await load('test/schemas/decorators', options, config);

  for (const name of FLAGS) {
    const flags = schema.domains.get(name);
    test.assert(flags instanceof Flags);
    test.strictSame(flags.values, ['a', 'b', 'c']);
    test.strictSame(
      flags.enum,
      name === 'FlagsFromValues' ? undefined : 'EnumDomain'
    );
    test.strictSame(flags.Class.name, 'FlagsClass');
    const ab = flags.Class.from(new Uint64(3));
    test.assert(ab.get('a'));
    test.assert(ab.get('b'));
    test.assertNot(ab.get('c'));
  }

  const EnumDomain = schema.domains.get('EnumDomain');
  test.strictSame(EnumDomain.Class.name, 'EnumClass');
  test.strictSame(EnumDomain.Class.from('a'), { index: 0, value: 'a' });
});

metatests.test(
  'must fail if more than 64 values are passed to the Flags',
  async test => {
    const error = await test.rejects(
      load('test/schemas/decorators-invalid', options, config)
    );
    test.strictSame(error.errors.length, 1);
    test.isError(
      error.errors[0],
      new TypeError('Flags does not support more than 64 values')
    );
  }
);
