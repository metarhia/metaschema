'use strict';

class SchemaError {
  static #prefix = 'Field';
  static format(err, path = '') {
    const pfx = `${SchemaError.#prefix} "${path}" `;
    if (typeof err === 'boolean') {
      return err ? null : [`${pfx}validation error`];
    }
    if (err) {
      const prefix = SchemaError.#prefix;
      const unprefixed = Array.isArray(err) ? err : [err];
      return unprefixed.map((e) => (e.startsWith(prefix) ? e : pfx + e));
    }
    return null;
  }

  static isInstance(err) {
    return err && err.constructor && err.constructor.name === 'SchemaError';
  }

  #path;
  constructor(path) {
    this.#path = path;
    this.errors = [];
    this.valid = true;
  }

  add(err) {
    if (SchemaError.isInstance(err)) {
      this.errors.push(...err.errors);
    } else {
      const errs = SchemaError.format(err, this.#path);
      if (errs) this.errors.push(...errs);
    }
    this.valid = this.errors.length === 0;
    return this;
  }
}

class Options {
  static #values = ['validate', 'parse', 'serialize', 'format'];
  constructor() {
    this.validate = null;
    this.format = null;
    this.parse = null;
    this.serialize = null;
  }

  update(key, field) {
    if (Options.#values.includes(key) && typeof field === 'function') {
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
    this.kind = 'struct';
    this.references = new Set();
    this.relations = new Set();
    this.root = root;
  }

  updateRefs({ references = [], relations = [] }) {
    references.forEach(this.references.add, this.references);
    relations.forEach(this.relations.add, this.relations);
  }
}

class SchemaMetadata extends TypeMetadata {
  static #collections = ['indexes', 'options'];
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

  setMany(values) {
    const { kind, scope, store, allow, parent, ...custom } = values;
    this.kind = kind || this.kind;
    this.scope = scope || this.scope;
    this.store = store || this.store;
    this.allow = allow || this.allow;
    this.parent = parent || this.parent;
    this.custom = custom;
  }

  destructMetadata(key, field) {
    for (const collection of SchemaMetadata.#collections) {
      const updated = this[collection].update(key, field);
      if (updated) return updated;
    }
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
