'use strict';

const { isFirstUpper } = require('metautil');
const {
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

  constructor(name, raw, namespaces = []) {
    super();
    this.name = name;
    this.namespaces = new Set(namespaces);
    if (Schema.isSchema(raw)) return raw;
    const preprocessor = new Preprocessor(this);
    const { Type, defs, kindMeta } = preprocessor.parse(raw);
    const fields = Type.type === 'schema' ? this.extractFromDefs(defs) : defs;
    const extras = kindMeta ? this.updateFromKind(kindMeta) : {};
    this.fields = new Type({ ...fields, ...extras }, preprocessor, this);
    this.updateRefs(this.fields.typeMetadata);
  }

  get types() {
    if (this.namespaces.size === 0) return DEFAULT_TYPES;
    return Object.assign(
      {},
      ...Array.from(this.namespaces).map((ns) => ns.types)
    );
  }

  checkConsistency() {
    const warn = [];
    const { name, references } = this;
    for (const ref of references) {
      if (isFirstUpper(ref)) {
        if (!this.findReference(ref)) {
          warn.push(`Warning: "${ref}" referenced by "${name}" is not found`);
        }
      } else if (!this.types[ref]) {
        warn.push(`Warning: type "${ref}" is not found in "${name}"`);
      }
    }
    return warn;
  }

  findReference(name) {
    for (const ns of this.namespaces) {
      const entity = ns.entities.get(name);
      if (entity) return entity;
    }
    return null;
  }

  check(source, path = this.name) {
    const schemaError = new SchemaError(path);
    schemaError.add(this.validate(source, path));
    return schemaError.add(this.fields.check(source, path));
  }

  toInterface() {
    const { name, fields } = this;
    const types = [];
    types.push(`interface ${name} {`);
    for (const [name, def] of Object.entries(fields)) {
      let { type } = def;
      if (type) {
        const q = def.required ? '' : '?';
        const isEntity = isFirstUpper(type);
        const isType = ES_TYPES.includes(type);
        const fieldName = name + (isEntity ? 'Id' : '');
        if (isEntity) type = def.many ? 'string[]' : 'string';
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
