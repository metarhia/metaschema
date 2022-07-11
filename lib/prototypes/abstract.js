'use strict';

const { SchemaError } = require('../metadata.js');
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

  #root;

  constructor(def, preprocessor) {
    this.#root = preprocessor.root;
    const { formatters } = AbstractType;
    for (const [key, value] of Object.entries(def)) {
      if (key === 'type' || key === this.type) continue;
      if (formatters[key]) this[key] = formatters[key](value);
      else this[key] = value;
    }
    this.construct(def, preprocessor);
    if (this.type) this.#root.references.add(this.type);
  }

  get root() {
    return this.#root;
  }

  check(value, path) {
    const schemaError = new SchemaError(path);
    if (!this.required && value === undefined) return schemaError;
    try {
      schemaError.add(this.checkType(value, path));
      if (this.validate) schemaError.add(this.validate(value, path));
      for (const [name, subCheck] of Object.entries(AbstractType.checks)) {
        if (!this[name]) continue;
        schemaError.add(subCheck(value, this));
      }
      return schemaError;
    } catch (err) {
      return schemaError.add(`validation failed ${String(err)}`);
    }
  }
}

module.exports = { AbstractType };
