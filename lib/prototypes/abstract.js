'use strict';

const { ValidationResult } = require('../metadata.js');
const { formatters, checks } = require('../util.js');

class AbstractType {
  static checks = {};
  static formatters = {};

  static setRules(rules = []) {
    for (const rule of rules) {
      if (formatters[rule]) AbstractType.formatters[rule] = formatters[rule];
      if (checks[rule]) AbstractType.checks[rule] = checks[rule];
    }
  }

  constructor(def, preprocessor) {
    this.root = preprocessor.root;
    const { formatters } = AbstractType;
    for (const [key, value] of Object.entries(def)) {
      if (key === 'type' || key === this.type) continue;
      if (formatters[key]) this[key] = formatters[key](value);
      else this[key] = value;
    }
    this.construct(def, preprocessor);
    if (this.type) this.root.references.add(this.type);
  }

  check(value, path) {
    return this.#commonCheck(value, path, false);
  }

  partialCheck(value, path) {
    return this.#commonCheck(value, path, true);
  }

  #commonCheck(value, path, isPartial) {
    const result = new ValidationResult(path);
    const isEmpty = value === null || value === undefined;
    const isRequiredAndMissing = !isPartial
      ? !this.required && isEmpty
      : isEmpty;
    if (isRequiredAndMissing) return result;
    try {
      result.add(this.checkType(value, path, isPartial));
      if (this.validate) result.add(this.validate(value, path));
      for (const [name, subCheck] of Object.entries(AbstractType.checks)) {
        if (!this[name]) continue;
        result.add(subCheck(value, this));
      }
      return result;
    } catch (err) {
      return result.add(`validation failed ${String(err)}`);
    }
  }

  toJSON() {
    const { root, ...rest } = this;
    return root, rest;
  }
}

module.exports = { AbstractType };
