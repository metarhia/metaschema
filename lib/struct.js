'use strict';

const { ValidationResult } = require('./metadata.js');
const { formatters, isInstanceOf } = require('./util.js');

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
    return this.commonCheck(source, path, false);
  }

  partialCheck(source, path = '') {
    return this.commonCheck(source, path, true);
  }

  commonCheck(source, path, isPartial) {
    const result = new ValidationResult(path || this.name);
    const keys = Object.keys(source);
    const fields = !isPartial ? Object.keys(this) : [];
    const names = new Set([...fields, ...keys]);
    const method = isPartial ? 'partialCheck' : 'check';
    for (const name of names) {
      const value = source[name];
      const type = this[name];
      if (!type) {
        result.add(`Field "${name}" is not expected`);
        continue;
      }
      if (!isInstanceOf(type, 'Type')) continue;
      const nestedPath = path ? `${path}.${name}` : name;
      const isRequiredAndMissing =
        !isPartial && type.required && !keys.includes(name);
      if (isRequiredAndMissing) {
        result.add(`Field "${nestedPath}" is required`);
        continue;
      }
      result.add(type[method](value, nestedPath));
    }
    return result;
  }
}

module.exports = { Struct };
