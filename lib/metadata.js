'use strict';

const { getKindMetadata } = require('./kinds.js');

const errPrefix = 'Field';
const options = ['validate', 'parse', 'serialize', 'format'];
const metadataCollections = ['indexes', 'options'];

class SchemaError {
  #path;

  constructor(path) {
    this.#path = path;
    this.errors = [];
    this.valid = true;
  }

  add(err) {
    if (this.isInstance(err)) {
      this.errors.push(...err.errors);
    } else {
      const errs = this.format(err, this.#path);
      if (errs) this.errors.push(...errs);
    }
    this.valid = this.errors.length === 0;
    return this;
  }

  format(err, path = '') {
    const pfx = `${errPrefix} "${path}" `;
    if (typeof err === 'boolean') {
      return err ? null : [`${pfx}validation error`];
    }
    if (err) {
      const unprefixed = Array.isArray(err) ? err : [err];
      return unprefixed.map((e) => (e.startsWith(errPrefix) ? e : pfx + e));
    }
    return null;
  }

  isInstance(err) {
    return err && err.errors && Array.isArray(err.errors);
  }
}

class Options {
  constructor() {
    this.validate = null;
    this.format = null;
    this.parse = null;
    this.serialize = null;
  }

  update(key, field) {
    if (options.includes(key) && typeof field === 'function') {
      this[key] = field;
      return true;
    }
    return false;
  }
}

class Indexes {
  update(key, field) {
    const { index, primary, unique, many } = field;
    const isIndex = Array.isArray(index || primary || unique);
    if (isIndex || many) this[key] = field;
    return isIndex;
  }
}

class TypeMetadata {
  constructor(root = null) {
    this.root = root;
    this.kind = 'struct';
    this.references = new Set();
    this.relations = new Set();
  }

  updateRefs({ references = [], relations = [] }) {
    references.forEach(this.references.add, this.references);
    relations.forEach(this.relations.add, this.relations);
  }

  takeFrom(typeMetadata) {
    this.references = typeMetadata.references;
    this.relations = typeMetadata.relations;
  }
}

class SchemaMetadata extends TypeMetadata {
  constructor(root) {
    super(root);
    this.scope = 'local';
    this.store = 'memory';
    this.allow = 'write';
    this.parent = '';
    this.indexes = new Indexes();
    this.options = new Options();
    this.custom = {};
  }

  getKindMetadata(name, meta, root) {
    return getKindMetadata(name, meta, root);
  }

  updateFromKind({ kind, meta, root }) {
    const { defs, metadata } = this.getKindMetadata(kind, meta, root);
    this.setMany(metadata);
    return defs || {};
  }

  setMany(values) {
    const { kind, scope, store, allow, parent, ...custom } = values;
    this.kind = kind || this.kind;
    this.scope = scope || this.scope;
    this.store = store || this.store;
    this.allow = allow || this.allow;
    this.parent = parent || this.parent;
    this.custom = custom;
  }

  extractFromDefs(defs) {
    for (const [key, field] of Object.entries(defs)) {
      for (const collection of metadataCollections) {
        const updated = this[collection].update(key, field);
        if (updated) {
          Reflect.deleteProperty(defs, key);
          continue;
        }
      }
    }
    return defs;
  }

  validate(value, path) {
    if (!this.options.validate) return;
    const error = new SchemaError(path);
    try {
      return error.add(this.options.validate(value, path));
    } catch (err) {
      return error.add(`validation failed ${String(err)}`);
    }
  }
}

module.exports = { SchemaMetadata, TypeMetadata, SchemaError };
