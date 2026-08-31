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

  add(error) {
    if (ValidationResult.isInstance(error)) {
      this.errors.push(...error.errors);
    } else {
      const formatted = ValidationResult.format(error, this.#path);
      if (formatted) this.errors.push(...formatted);
    }
    this.valid = this.errors.length === 0;
    return this;
  }

  static format(error, path = '') {
    const prefix = `${ERR_PREFIX} "${path}" `;
    if (typeof error === 'boolean') {
      if (error) return null;
      return [`${prefix}validation error`];
    }
    if (!error) return null;
    const messages = Array.isArray(error) ? error : [error];
    const prefixed = messages.map((message) => {
      if (message.startsWith(ERR_PREFIX)) return message;
      return prefix + message;
    });
    return prefixed;
  }

  static isInstance(error) {
    return error instanceof ValidationResult;
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
    for (const ref of references) this.references.add(ref);
    for (const rel of relations) this.relations.add(rel);
  }

  updateFromKind({ kind, meta, root }) {
    const { defs, metadata } = getKindMetadata(kind, meta, root);
    this.#setMany(metadata);
    return defs;
  }

  extractMetadata(defs) {
    const fields = Object.create(null);
    for (const pair of Object.entries(defs)) {
      const key = pair[0];
      const field = pair[1];
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
    const result = new ValidationResult(path);
    try {
      return result.add(this.options.validate(value, path));
    } catch (error) {
      return result.add(`validation failed ${error}`);
    }
  }
}

module.exports = { ValidationResult, SchemaMetadata };
