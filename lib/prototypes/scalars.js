'use strict';

const scalar = {
  kind: 'scalar',

  construct() {},

  checkType(value, path) {
    if (typeof value !== this.scalar) {
      return `Field "${path}" not of expected type: ${this.scalar}`;
    }
    return null;
  },
};

const enumerable = {
  kind: 'scalar',

  construct(def) {
    this.enum = def.enum;
  },

  checkType(value, path) {
    if (this.enum.includes(value)) return null;
    const variants = this.enum.join(', ');
    return `Field "${path}" value is not of enum: ${variants}`;
  },
};

const string = { scalar: 'string', rules: ['length'], ...scalar };
const number = { scalar: 'number', rules: ['length'], ...scalar };
const bigint = { scalar: 'bigint', rules: ['length'], ...scalar };
const boolean = { scalar: 'boolean', ...scalar };

module.exports = { string, number, bigint, boolean, enum: enumerable };
