'use strict';

const { harmonize } = require('../util.js');

const AbstractType = {
  formatters: {},
  checks: [],
  check(value, path, root) {
    const field = path || root.name;
    try {
      const typeErr = harmonize(this.checkType(value, path, root), field);
      if (typeErr) return typeErr;
      if (this.validate) {
        const validErr = harmonize(this.validate(value, path, root), field);
        if (validErr) return validErr;
      }
      for (const [name, subCheck] of Object.entries(this.checks)) {
        if (!this[name]) continue;
        const err = harmonize(subCheck(value, this), field);
        if (err) return err;
      }
      return [];
    } catch (err) {
      return harmonize(`validation failed ${String(err)}`, field);
    }
  },
  updateMetadata(type) {
    type.references.forEach(this.references.add, this.references);
    type.relations.forEach(this.relations.add, this.relations);
  },
  init() {
    this.references = new Set();
    this.relations = new Set();
  },
  from(def = {}, preprocessor) {
    const { formatters } = this;
    for (const [key, value] of Object.entries(def)) {
      if (key === 'type' || key === this.type) continue;
      if (formatters[key]) this[key] = formatters[key](value);
      else this[key] = value;
    }
    this.construct(def, preprocessor);
    const { type } = this;
    this.type = type;
    this.references.add(type);
  },
};

module.exports = { AbstractType };
