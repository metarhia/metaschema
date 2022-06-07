'use strict';
const metatests = require('metatests');
const { prepareTypes, DEFAULT } = require('../lib/types.js');

const types = {
  string: 'varchar',
  number: 'integer',
  datetime: { js: 'string', pg: 'timestamp with time zone' },
  text: { js: 'string', pg: 'text' },
  json: { js: 'schema', pg: 'jsonb' },
  decimal: {
    pg: 'decimal',
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
  const tps = prepareTypes(types);
  const { datetime, text, json, decimal } = tps;
  test.strictEqual(datetime.metadata.pg, types.datetime.pg);
  test.strictEqual(text.metadata.pg, types.text.pg);
  test.strictEqual(json.metadata.pg, types.json.pg);
  test.strictEqual(decimal.metadata.pg, types.decimal.pg);
  const { string, number } = tps;
  test.strictEqual(string.metadata.pg, types.string);
  test.strictEqual(number.metadata.pg, types.number);
  test.strictEqual(DEFAULT.string.metadata.pg, undefined);
  test.end();
});
