'use strict';

const { toLowerCamel, isFirstUpper } = require('metautil');
const { formatters, isType } = require('./util.js');
const { DEFAULT } = require('./types.js');
const { Preprocessor } = require('./preprocessor.js');

const KIND_ENT = ['entity', 'registry', 'dictionary'];
const KIND_AUX = ['journal', 'details', 'relation', 'view'];
const KIND_STORED = [...KIND_ENT, ...KIND_AUX];
const KIND_MEMORY = ['struct', 'scalar', 'form', 'projection'];
const KIND = [...KIND_STORED, ...KIND_MEMORY];

const SCOPE = ['application', 'global', 'local'];
const STORE = ['persistent', 'memory'];
const ALLOW = ['write', 'append', 'read'];

const ES_TYPES = ['number', 'string', 'boolean'];

const RESERVED = ['validate', 'parse', 'serialize', 'format'];

class Schema {
  constructor(name, source, namespaces = []) {
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
    const types = this.getTypes();
    this.prep = new Preprocessor(types, Schema);
    this.preprocess(this.prep.parse(source));
    this.options = {
      validate: source.validate || null,
      format: source.format || null,
      parse: source.parse || null,
      serialize: source.serialize || null,
    };
  }

  validate(value, path) {
    if (!this.options.validate) return;
    try {
      const res = this.options.validate(value, path);
      if (typeof res === 'boolean') return res ? '' : ['Validation error'];
      if (res) return Array.isArray(res) ? res : [res];
    } catch (err) {
      return [`Field "${path || this.name}" validation failed ${String(err)}`];
    }
  }

  preprocess(source) {
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
      const child = this.prep.parse(entry);
      if (child.skip) {
        this.fields[key] = child.skip;
        continue;
      }
      const [field, required] = formatters.key(key, entry.required);
      if (isType(child)) {
        this.updateMetadata(child);
        child.required = child.required && required;
        this.fields[field] = child;
      } else {
        const schema = new this.prep.types.schema(child.defs, this.prep);
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
    this.references = new Set([...this.references, ...meta.references]);
    this.relations = new Set([...this.relations, ...meta.relations]);
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
    let types = {};
    for (const ns of this.namespaces) {
      if (ns.types) types = { ...types, ...ns.types };
    }
    if (Object.keys(types).length === 0) types = DEFAULT;
    return types;
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
      const errors = this.fields.check(source, path);
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
