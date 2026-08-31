'use strict';

const { ValidationResult } = require('../metadata.js');
const { formatters, checks } = require('../util.js');

class AbstractType {
  static checks = {};
  static formatters = {};

  static setRules(rules = []) {
    for (const rule of rules) {
      if (formatters[rule]) {
        AbstractType.formatters[rule] = formatters[rule];
      }
      if (checks[rule]) {
        AbstractType.checks[rule] = checks[rule];
      }
    }
  }

  constructor(def, preprocessor) {
    this.root = preprocessor.root;
    const { formatters: typeFormatters } = AbstractType;
    for (const [key, value] of Object.entries(def)) {
      if (key === 'type' || key === this.type) continue;
      if (typeFormatters[key]) {
        this[key] = typeFormatters[key](value);
      } else {
        this[key] = value;
      }
    }
    this.construct(def, preprocessor);
    if (this.type) this.root.references.add(this.type);
  }

  check(value, path) {
    const result = new ValidationResult(path);
    const isEmpty = value === null || value === undefined;
    if (!this.required && isEmpty) return result;
    try {
      result.add(this.checkType(value, path));
      if (this.validate) result.add(this.validate(value, path));
      const { checks: typeChecks } = AbstractType;
      for (const [name, subCheck] of Object.entries(typeChecks)) {
        if (!this[name]) continue;
        result.add(subCheck(value, this));
      }
      return result;
    } catch (err) {
      return result.add(`validation failed ${err}`);
    }
  }

  toJSON() {
    const { root, ...rest } = this;
    if (!root) throw new Error('AbstractType cannot be serialized');
    return rest;
  }
}

module.exports = { AbstractType };
