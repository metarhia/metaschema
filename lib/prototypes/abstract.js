'use strict';

const { TypeMetadata, SchemaError } = require('../metadata.js');
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

  #metadata;
  constructor(root) {
    this.#metadata = new TypeMetadata(root);
  }

  get metadata() {
    return this.#metadata;
  }

  check(value, path) {
    const schemaError = new SchemaError(path || this.metadata.root.name);
    if (!this.required && value === undefined) return schemaError;
    try {
      schemaError.add(this.checkType(value, path));
      if (!schemaError.valid) return schemaError;
      if (this.validate) {
        schemaError.add(this.validate(value, path));
      }
      if (!schemaError.valid) return schemaError;
      for (const [name, subCheck] of Object.entries(AbstractType.checks)) {
        if (!this[name]) continue;
        schemaError.add(subCheck(value, this));
      }
      return schemaError;
    } catch (err) {
      return schemaError.add(`validation failed ${String(err)}`);
    }
  }

  from(def = {}, preprocessor) {
    const { formatters } = AbstractType;
    for (const [key, value] of Object.entries(def)) {
      if (key === 'type' || key === this.type) continue;
      if (formatters[key]) this[key] = formatters[key](value);
      else this[key] = value;
    }
    this.construct(def, preprocessor);
    const { type } = this;
    this.type = type;
    this.metadata.references.add(type);
  }
}

module.exports = { AbstractType };
