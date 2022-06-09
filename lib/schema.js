'use strict';

const { toLowerCamel, isFirstUpper } = require('metautil');
const { formatters, isType } = require('./util.js');
const {
  getKindMetadata,
  KIND,
  KIND_STORED,
  KIND_MEMORY,
  SCOPE,
  STORE,
  ALLOW,
} = require('./kinds.js');
const { DEFAULT_TYPES } = require('./types.js');
const { Preprocessor } = require('./preprocessor.js');
const { SchemaMetadata, SchemaError } = require('./metadata.js');

const ES_TYPES = ['number', 'string', 'boolean'];
class Schema extends SchemaMetadata {
  static KIND = KIND;
  static KIND_STORED = KIND_STORED;
  static KIND_MEMORY = KIND_MEMORY;
  static SCOPE = SCOPE;
  static STORE = STORE;
  static ALLOW = ALLOW;

  static isSchema(src) {
    return src && src.constructor && src.constructor.name === 'Schema';
  }

  static from(source, namespaces, prep) {
    return new Schema('', source, namespaces, prep);
  }

  static extractSchema(def) {
    if (this.isSchema(def)) return def;
    if (this.isSchema(def.schema)) return def.schema;
    return null;
  }

  constructor(name, raw, namespaces = [], prep = null) {
    super();
    this.fields = {};
    this.name = name;
    const nss = prep ? prep.namespaces : null;
    this.namespaces = nss || new Set(namespaces);
    const pr = prep || new Preprocessor(this);
    this.root = pr.root;
    this.preprocess(raw, pr);
  }

  get types() {
    if (this.namespaces.size === 0) return DEFAULT_TYPES;
    return Object.assign(
      {},
      ...Array.from(this.namespaces).map((ns) => ns.types)
    );
  }

  getKindMetadata(name, meta, root) {
    return getKindMetadata(name, meta, root);
  }

  preprocess(raw, prep) {
    const { Type, defs, metadata } = prep.parse(raw);
    if (Type.prototype.type !== 'schema') {
      this.fields = new Type(defs, prep, this);
      this.updateRefs(this.fields.metadata);
      return;
    }
    const entries = Object.entries(defs);
    if (metadata) this.setMany(metadata);
    for (const [key, entry] of entries) {
      if (this.destructMetadata(key, entry)) continue;
      const { Type, defs } = prep.parse(entry);
      if (!Type) {
        this.fields[key] = entry;
        continue;
      }
      const [field, required] = formatters.key(key, entry.required);
      if (Type.name !== 'schema') {
        const child = new Type(defs, prep, this);
        this.updateRefs(child.metadata);
        child.required = child.required && required;
        this.fields[field] = child;
      } else {
        const schema = new Type(defs, prep, this);
        schema.required = schema.required && required;
        this.fields[field] = schema;
        this.references.add('schema');
        this.updateRefs(schema.metadata);
      }
    }
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
    const type = DEFAULT_TYPES[name];
    if (type) return type;
    return null;
  }

  findReference(name) {
    for (const ns of this.namespaces) {
      const entity = ns.entities.get(name);
      if (entity) return entity;
    }
    return null;
  }

  check(source, path = '') {
    const schemaError = new SchemaError(path || this.name);
    if (isType(this.fields)) {
      return schemaError.add(this.fields.check(source, path));
    }
    schemaError.add(this.validate(source, path));
    if (!schemaError.valid) return schemaError;
    const keys = Object.keys(source);
    const fields = Object.keys(this.fields);
    const names = new Set([...fields, ...keys]);
    for (const name of names) {
      const value = source[name];
      const type = this.fields[name];
      if (!type) {
        schemaError.add(`Field "${name}" is not expected`);
        continue;
      }
      if (!isType(type)) continue;
      const nestedPath = path ? `${path}.${name}` : name;
      if (type.required && !keys.includes(name)) {
        schemaError.add(`Field "${nestedPath}" is required`);
        continue;
      }
      schemaError.add(type.check(value, nestedPath));
    }
    return schemaError;
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

module.exports = { Schema };
