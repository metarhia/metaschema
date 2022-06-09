'use strict';
const metatests = require('metatests');
const { TypeFactory, DEFAULT_TYPES } = require('../lib/types.js');

const types = {
  string: { metadata: { pg: 'varchar' } },
  number: { metadata: { pg: 'integer' } },
  datetime: { js: 'string', metadata: { pg: 'timestamp with time zone' } },
  text: { js: 'string', metadata: { pg: 'text' } },
  json: { js: 'schema', metadata: { pg: 'jsonb' } },
  decimal: {
    metadata: { pg: 'decimal' },
    kind: 'scalar',
    rules: ['length'],
    symbols: '1234567890e.',
    checkType(src, path) {
      if (typeof src !== 'string') {
        return `Field "${path}" not a decimal 1`;
      }
      const arr = src.split('.');
      if (arr.length !== 2) return `Field "${path}" not a decimal 2`;
      const [a, b] = arr;
      const chars = new Set([...a, ...b]);
      for (const char of chars) {
        if (!this.symbols.includes(char)) {
          return `Field "${path}" not a decimal 3`;
        }
      }
    },
    construct() {},
  },
};

metatests.test('Types: prepareTypes', (test) => {
  const tps = new TypeFactory().attouchTypes(types);
  const { datetime, text, json, decimal } = tps;
  test.strictEqual(datetime.metadata.pg, types.datetime.metadata.pg);
  test.strictEqual(text.metadata.pg, types.text.metadata.pg);
  test.strictEqual(json.metadata.pg, types.json.metadata.pg);
  test.strictEqual(decimal.metadata.pg, types.decimal.metadata.pg);
  const { string, number } = tps;
  test.strictEqual(string.metadata.pg, types.string.metadata.pg);
  test.strictEqual(number.metadata.pg, types.number.metadata.pg);
  test.strictEqual(DEFAULT_TYPES.string.metadata.pg, undefined);
  test.end();
});
