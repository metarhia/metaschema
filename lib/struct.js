'use strict';

const { ValidationResult } = require('./metadata.js');
const { isInstanceOf } = require('metautil');
const { formatters } = require('./util.js');

class Struct {
  constructor(defs, prep) {
    const entries = Object.entries(defs);
    for (const [key, entry] of entries) {
      const { Type, defs } = prep.parse(entry);
      if (!Type) {
        this[key] = entry;
        continue;
      }
      const [field, required] = formatters.key(key, entry.required);
      const child = new Type(defs, prep);
      child.required = child.required && required;
      this[field] = child;
    }
  }

  check(source, path = '') {
    const result = new ValidationResult(path || this.name);
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
      if (type.required && !keys.includes(name)) {
        result.add(`Field "${nestedPath}" is required`);
        continue;
      }
      result.add(type.check(value, nestedPath));
    }
    return result;
  }
}

module.exports = { Struct };
