'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { typeFactory, TYPES } = require('../lib/types.js');

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
      return null;
    },
    construct() {},
  },
};

test('Types: prepareTypes', () => {
  const customTypes = typeFactory(types);
  const { datetime, text, json, decimal } = customTypes;
  assert.strictEqual(datetime.metadata.pg, types.datetime.metadata.pg);
  assert.strictEqual(text.metadata.pg, types.text.metadata.pg);
  assert.strictEqual(json.metadata.pg, types.json.metadata.pg);
  assert.strictEqual(decimal.metadata.pg, types.decimal.metadata.pg);
  const { string, number } = customTypes;
  assert.strictEqual(string.metadata.pg, types.string.metadata.pg);
  assert.strictEqual(number.metadata.pg, types.number.metadata.pg);
  assert.strictEqual(TYPES.string.metadata.pg, 'varchar');
});
