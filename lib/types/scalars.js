'use strict';

const { formatLength, checkLength } = require('../util.js');

const scalar = {
  kind: 'scalar',
  check(value, path, def) {
    if (typeof value !== this.name) {
      return [`Field "${path}" is not of expected type: ${this.name}`];
    }
    const { length } = def;
    if (length && this.length) {
      const err = checkLength(value, path, length);
      if (err) return err;
    }
    return [];
  },
  toLong(def) {
    const { length } = def;
    if (length) def.length = formatLength(length);
    return def;
  },
};

module.exports = {
  string: { name: 'string', length: true, ...scalar },
  number: { name: 'number', length: true, ...scalar },
  bigint: { name: 'bigint', length: true, ...scalar },
  boolean: { name: 'boolean', ...scalar },
};
