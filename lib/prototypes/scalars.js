'use strict';

const scalar = {
  kind: 'scalar',
  validate(value, path) {
    if (typeof value !== this.type) {
      return `Field "${path}" is not of expected type: ${this.type}`;
    }
  },
  format() {},
};

const enumerable = {
  type: 'enum',
  kind: 'scalar',
  validate(value, path) {
    if (this.enum.includes(value)) return;
    return `Field "${path}" value is not of enum: ${this.enum.join(', ')}`;
  },
  format(def) {
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
