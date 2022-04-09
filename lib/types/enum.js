'use strict';

const enumerable = {
  name: 'enum',
  kind: 'scalar',
  check(value, path, def) {
    if (def.enum.includes(value)) return [];
    return [`Field "${path}" value is not of enum: ${def.enum.join(', ')}`];
  },
  toLong(def) {
    return { type: 'enum', ...def };
  },
};

module.exports = { enum: enumerable };
