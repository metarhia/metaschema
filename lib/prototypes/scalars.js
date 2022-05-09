'use strict';

const scalar = {
  kind: 'scalar',
  checkType(value, path) {
    if (typeof value !== this.type) {
      return `Field "${path}" not of expected type: ${this.type}`;
    }
  },
  construct() {},
};

const enumerable = {
  type: 'enum',
  kind: 'scalar',
  checkType(value, path) {
    if (this.enum.includes(value)) return;
    return `Field "${path}" value is not of enum: ${this.enum.join(', ')}`;
  },
  construct(def) {
    this.enum = def.enum;
  },
};

module.exports = {
  string: { type: 'string', rules: ['length'], ...scalar },
  number: { type: 'number', rules: ['length'], ...scalar },
  bigint: { type: 'bigint', rules: ['length'], ...scalar },
  boolean: { type: 'boolean', ...scalar },
  enum: enumerable,
};
