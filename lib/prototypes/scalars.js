'use strict';

const scalar = {
  kind: 'scalar',

  construct() {},

  checkType(value, path) {
    if (typeof value !== this.scalar) {
      return `Field "${path}" not of expected type: ${this.scalar}`;
    }
  },
};

const enumerable = {
  kind: 'scalar',

  construct(def) {
    this.enum = def.enum;
  },

  checkType(value, path) {
    if (this.enum.includes(value)) return;
    return `Field "${path}" value is not of enum: ${this.enum.join(', ')}`;
  },
};

module.exports = {
  string: { scalar: 'string', rules: ['length'], ...scalar },
  number: { scalar: 'number', rules: ['length'], ...scalar },
  bigint: { scalar: 'bigint', rules: ['length'], ...scalar },
  boolean: { scalar: 'boolean', ...scalar },
  enum: enumerable,
};
