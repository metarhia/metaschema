'use strict';

const { getKindMetadata } = require('./kinds.js');

const ERR_PREFIX = 'Field';
const OPTIONS = ['validate', 'parse', 'serialize', 'format'];
const METADATA_COLLECTIONS = ['indexes', 'options'];

class ValidationResult {
  #path;

  constructor(path) {
    this.#path = path;
    this.errors = [];
    this.valid = true;
  }

  add(err) {
    if (ValidationResult.isInstance(err)) {
      this.errors.push(...err.errors);
    } else {
      const errs = ValidationResult.format(err, this.#path);
      if (errs) this.errors.push(...errs);
    }
    this.valid = this.errors.length === 0;
    return this;
  }

  static format(err, path = '') {
    const pfx = `${ERR_PREFIX} "${path}" `;
    if (typeof err === 'boolean') {
      return err ? null : [`${pfx}validation error`];
    }
    if (!err) return null;
    const unprefixed = Array.isArray(err) ? err : [err];
    return unprefixed.map((e) => {
      if (e.startsWith(ERR_PREFIX)) return e;
      return pfx + e;
    });
  }

  static isInstance(err) {
    return Array.isArray(err?.errors);
  }
}

class Options {
  constructor() {
    this.validate = null;
    this.format = null;
    this.parse = null;
    this.serialize = null;
  }

  extract(key, field) {
    const isFn = typeof field === 'function';
    const isOption = OPTIONS.includes(key) && isFn;
    if (isOption) this[key] = field;
    return isOption;
  }
}

class Indexes {
  extract(key, field) {
    const { index, primary, unique, many } = field;
    const isIndex = Array.isArray(index || primary || unique);
    if (isIndex || many) this[key] = field;
    return isIndex;
  }
}

class SchemaMetadata {
  constructor() {
    this.kind = 'struct';
    this.scope = 'local';
    this.store = 'memory';
    this.allow = 'write';
    this.parent = '';
    this.indexes = new Indexes();
    this.options = new Options();
    this.custom = {};
    this.references = new Set();
    this.relations = new Set();
  }

  #setMany(values) {
    const { kind, scope, store, allow, parent, ...custom } = values;
    this.kind = kind || this.kind;
    this.scope = scope || this.scope;
    this.store = store || this.store;
    this.allow = allow || this.allow;
    this.parent = parent || this.parent;
    this.custom = custom;
  }

  updateFromSchema({ references = [], relations = [] }) {
    references.forEach(this.references.add, this.references);
    relations.forEach(this.relations.add, this.relations);
  }

  updateFromKind({ kind, meta, root }) {
    const { defs, metadata } = getKindMetadata(kind, meta, root);
    this.#setMany(metadata);
    return defs;
  }

  extractMetadata(defs) {
    const fields = {};
    for (const [key, field] of Object.entries(defs)) {
      let extracted = false;
      for (const collection of METADATA_COLLECTIONS) {
        const taken = this[collection].extract(key, field);
        if (taken) extracted = true;
      }
      if (!extracted) fields[key] = field;
    }
    return fields;
  }

  validate(value, path) {
    if (!this.options.validate) return null;
    const error = new ValidationResult(path);
    try {
      return error.add(this.options.validate(value, path));
    } catch (err) {
      return error.add(`validation failed ${err}`);
    }
  }
}

module.exports = { ValidationResult, SchemaMetadata };
