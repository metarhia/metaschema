'use strict';

const { toLowerCamel, isFirstUpper } = require('metautil');
const { formatters, isType, harmonize } = require('./util.js');
const {
  KIND,
  KIND_STORED,
  KIND_MEMORY,
  SCOPE,
  STORE,
  ALLOW,
} = require('./kinds.js');
const { DEFAULT } = require('./types.js');
const { Preprocessor } = require('./preprocessor.js');

const ES_TYPES = ['number', 'string', 'boolean'];

const RESERVED = ['validate', 'parse', 'serialize', 'format'];

class Schema {
  constructor(name, raw, namespaces = []) {
    this.kind = 'struct';
    this.scope = 'local';
    this.store = 'memory';
    this.allow = 'write';
    this.parent = '';
    this.indexes = {};
    this.references = new Set();
    this.relations = new Set();
    this.fields = {};
    this.name = name;
    this.namespaces = new Set(namespaces);
    this.preprocess(raw);
    this.options = {
      validate: raw.validate || null,
      format: raw.format || null,
      parse: raw.parse || null,
      serialize: raw.serialize || null,
    };
  }

  validate(value, path) {
    const field = path || this.name;
    if (!this.options.validate) return;
    try {
      return harmonize(this.options.validate(value, path), field);
    } catch (err) {
      return harmonize(`validation failed ${String(err)}`, field);
    }
  }

  preprocess(raw) {
    const prep = new Preprocessor(this, Schema);
    const source = prep.parse(raw);
    if (isType(source)) {
      this.fields = source;
      this.assignMetadata(source);
      return;
    }
    const { defs, metadata } = source;
    const keys = Object.keys(defs);
    if (metadata) this.assignMetadata(metadata);
    for (const key of keys) {
      if (RESERVED.includes(key)) continue;
      const entry = defs[key];
      if (this.preprocessIndex(key, entry)) continue;
      const child = prep.parse(entry);
      if (child.skip) {
        this.fields[key] = entry;
        continue;
      }
      const [field, required] = formatters.key(key, entry.required);
      if (isType(child)) {
        this.updateMetadata(child);
        child.required = child.required && required;
        this.fields[field] = child;
      } else {
        const schema = new prep.types.schema(child.defs, prep);
        schema.required = required;
        this.fields[field] = schema;
        this.references.add('schema');
        this.updateMetadata(schema);
      }
    }
  }

  preprocessIndex(key, defs) {
    const { index, primary, unique, many } = defs;
    const isIndex = Array.isArray(index || primary || unique);
    if (isIndex || many) this.indexes[key] = defs;
    return isIndex;
  }

  updateMetadata(meta) {
    meta.references.forEach(this.references.add, this.references);
    meta.relations.forEach(this.relations.add, this.relations);
  }

  assignMetadata(meta) {
    this.kind = meta.kind;
    this.scope = meta.scope || this.scope;
    this.store = meta.store || this.store;
    this.allow = meta.allow || this.allow;
    this.parent = meta.parent || '';
  }

  static from(source, namespaces) {
    return new Schema('', source, namespaces);
  }

  static extractSchema(def) {
    if (def instanceof Schema) return def;
    if (def.schema instanceof Schema) return def.schema;
    return null;
  }

  checkConsistency() {
    const warn = [];
    const { name, references } = this;
    for (const ref of references) {
      if (isFirstUpper(ref)) {
        if (!this.findReference(ref)) {
          warn.push(`Warning: "${ref}" referenced by "${name}" is not found`);
        }
      } else if (!this.findType(ref)) {
        warn.push(`Warning: type "${ref}" is not found in "${name}"`);
      }
    }
    return warn;
  }

  findType(name) {
    for (const ns of this.namespaces) {
      const type = ns.types[name];
      if (type) return type;
    }
    const type = DEFAULT[name];
    if (type) return type;
    return null;
  }

  getTypes() {
    const types = Object.assign(
      {},
      ...Array.from(this.namespaces).map((ns) => ns.types)
    );
    return Object.keys(types).length === 0 ? { ...DEFAULT } : types;
  }

  findReference(name) {
    for (const ns of this.namespaces) {
      const entity = ns.entities.get(name);
      if (entity) return entity;
    }
    return null;
  }

  check(source, path = '') {
    if (isType(this.fields)) {
      const errors = this.fields.check(source, path, this);
      return { valid: errors.length === 0, errors };
    }
    const err = this.validate(source, path);
    if (err) return { valid: false, errors: err };
    const keys = Object.keys(source);
    const fields = Object.keys(this.fields);
    const names = new Set([...fields, ...keys]);
    const errors = [];
    for (const name of names) {
      const value = source[name];
      const type = this.fields[name];
      if (!type) {
        errors.push(`Field "${name}" is not expected`);
        continue;
      }
      const nestedPath = path ? `${path}.${name}` : name;
      if (!type.required && value === undefined) continue;
      if (type.required && !keys.includes(name)) {
        errors.push(`Field "${nestedPath}" is required`);
        continue;
      }
      const errs = type.check(value, nestedPath, this);
      if (errs.length > 0) errors.push(...errs);
    }
    return { valid: errors.length === 0, errors };
  }

  toInterface() {
    const { name, fields } = this;
    const types = [];
    types.push(`interface ${name} {`);
    const pk = toLowerCamel(name) + 'Id';
    types.push(`  ${pk}: number;`);
    for (const [name, def] of Object.entries(fields)) {
      let { type } = def;
      if (type) {
        const q = def.required ? '' : '?';
        const isEntity = isFirstUpper(type);
        const isType = ES_TYPES.includes(type);
        const fieldName = name + (isEntity ? 'Id' : '');
        if (isEntity) type = 'number';
        else if (!isType) type = 'string';
        types.push(`  ${fieldName}${q}: ${type};`);
      }
    }
    types.push('}');
    return types.join('\n');
  }

  attach(...namespaces) {
    for (const ns of namespaces) this.namespaces.add(ns);
  }

  detouch(...namespaces) {
    for (const ns of namespaces) this.namespaces.delete(ns);
  }
}

Schema.KIND = KIND;
Schema.KIND_STORED = KIND_STORED;
Schema.KIND_MEMORY = KIND_MEMORY;
Schema.SCOPE = SCOPE;
Schema.STORE = STORE;
Schema.ALLOW = ALLOW;

module.exports = { Schema };
