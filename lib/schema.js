'use strict';

const { isFirstUpper } = require('metautil');
const { TYPES } = require('./types.js');
const { Preprocessor } = require('./preprocessor.js');
const { SchemaMetadata, SchemaError } = require('./metadata.js');
const { Struct } = require('./struct.js');
const { isInstanceOf } = require('./util.js');

const ES_TYPES = ['number', 'string', 'boolean'];

class Schema extends SchemaMetadata {
  static from(source, namespaces) {
    return new Schema('', source, namespaces);
  }

  static extractSchema(def) {
    if (isInstanceOf(def, 'Schema')) return def;
    if (isInstanceOf(def.schema, 'Schema')) return def.schema;
    return null;
  }

  constructor(name, raw, namespaces = []) {
    if (isInstanceOf(raw, 'Schema')) return raw;
    super();
    this.name = name;
    this.namespaces = new Set(namespaces);
    const preprocessor = new Preprocessor(this);
    const { Type, defs, kindMeta } = preprocessor.parse(raw);
    if (Type.type !== 'schema') {
      this.kind = Type.kind;
      this.fields = new Type(defs, preprocessor);
    } else {
      const fields = this.extractMetadata(defs.schema);
      const extras = kindMeta ? this.updateFromKind(kindMeta) : {};
      this.fields = new Struct({ ...fields, ...extras }, preprocessor);
    }
  }

  get types() {
    if (this.namespaces.size === 0) return TYPES;
    const types = Array.from(this.namespaces).map((ns) => ns.types);
    return Object.assign({}, ...types);
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

  toString() {
    const replacer = (key, value) => (key === 'root' ? undefined : value);
    return JSON.stringify(this.fields, replacer);
  }

  toJSON() {
    const { root, ...rest } = this.fields;
    return root, rest;
  }
}

module.exports = { Schema };
