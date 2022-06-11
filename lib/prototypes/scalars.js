'use strict';

const scalar = {
  kind: 'scalar',

  construct() {},

  checkType(value, path) {
    if (typeof value !== this.type) {
      return `Field "${path}" not of expected type: ${this.type}`;
    }
  },
};

const enumerable = {
  type: 'enum',
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
  string: { type: 'string', rules: ['length'], ...scalar },
  number: { type: 'number', rules: ['length'], ...scalar },
  bigint: { type: 'bigint', rules: ['length'], ...scalar },
  boolean: { type: 'boolean', ...scalar },
  enum: enumerable,
};
