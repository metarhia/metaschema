'use strict';

const { isInstanceOf } = require('metautil');

const { ValidationResult } = require('./metadata.js');
const { formatters } = require('./util.js');

class Struct {
  constructor(defs, prep) {
    const entries = Object.entries(defs);
    for (const [key, entry] of entries) {
      const { Type, defs: typeDefs } = prep.parse(entry);
      if (!Type) {
        this[key] = entry;
        continue;
      }
      const [field, required] = formatters.key(key, entry.required);
      const child = new Type(typeDefs, prep);
      child.required &&= required;
      this[field] = child;
    }
  }

  check(source, path = '') {
    const target = path || this.name;
    const result = new ValidationResult(target);
    const isObject = source !== null && typeof source === 'object';
    if (!isObject) {
      result.add(`Value of "${target}" must be an object`);
      return result;
    }
    const keys = Object.keys(source);
    const fields = Object.keys(this);
    const names = new Set([...fields, ...keys]);
    for (const name of names) {
      const value = source[name];
      const type = this[name];
      if (!type) {
        result.add(`Field "${name}" is not expected`);
        continue;
      }
      if (!isInstanceOf(type, 'Type')) continue;
      const nestedPath = path ? `${path}.${name}` : name;
      const missing = type.required && !keys.includes(name);
      if (missing) {
        result.add(`Field "${nestedPath}" is required`);
        continue;
      }
      result.add(type.check(value, nestedPath));
    }
    return result;
  }
}

module.exports = { Struct };
