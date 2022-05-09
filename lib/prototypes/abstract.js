'use strict';

const { formatters, checks } = require('../util.js');

const AbstractType = {
  formatters: {},
  checks: {},
  check(value, path, root) {
    try {
      const res = this.validate(value, path, root);
      const err = typeof res === 'boolean' ? !res : res;
      if (err) return Array.isArray(err) ? err : [err];
      for (const [name, subCheck] of Object.entries(this.checks)) {
        if (this[name]) subCheck(value, path, this);
      }
      return [];
    } catch (err) {
      return [err.message];
    }
  },
  metadataFrom(type) {
    const { references, relations } = this;
    this.references = new Set([...references, ...type.references]);
    this.relations = new Set([...relations, ...type.relations]);
  },
  init() {
    this.references = new Set();
    this.relations = new Set();
    const rules = this.rules || [];
    for (const rule of rules) {
      if (formatters[rule]) this.formatters[rule] = formatters[rule];
      if (checks[rule]) this.checks[rule] = checks[rule];
    }
  },
  from(def = {}, preprocessor) {
    const { formatters } = this;
    for (const key of Object.keys(def)) {
      if (key === 'type' || key === this.type) continue;
      if (formatters[key]) this[key] = formatters[key](def[key]);
      else this[key] = def[key];
    }
    this.format(def, preprocessor);
    const { type } = this;
    this.type = type;
    this.references.add(type);
  },
};

module.exports = { AbstractType };
