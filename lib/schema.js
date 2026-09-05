'use strict';

const { isFirstUpper, isInstanceOf } = require('metautil');

const { TYPES } = require('./types.js');
const { Preprocessor } = require('./preprocessor.js');
const { SchemaMetadata, ValidationResult } = require('./metadata.js');
const { Struct } = require('./struct.js');

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

  static concat(...sources) {
    const defs = {};
    const schemas = sources.map((s) => Schema.from(s));
    const kind = schemas[0]?.kind;
    for (const schema of schemas) {
      if (kind !== schema.kind) {
        throw new Error(
          `Schemas have different kinds: "${kind}", "${schema.kind}"`,
        );
      }
      for (const [key, value] of Object.entries(schema.fields)) {
        const { type, required } = value;
        if (
          defs[key] !== undefined &&
          (type !== defs[key].type || required !== defs[key].required)
        ) {
          throw new Error(`Schema concat conflicts with key "${key}"`);
        }
        defs[key] = value;
      }
    }
    const resultSchema = Schema.from(defs);
    // Q: How to merge options?
    for (const schema of schemas) {
      resultSchema.updateFromSchema(schema);
      // Q: Can we have conflicts with indexes?
      Object.assign(resultSchema.indexes, schema.indexes);
    }
    return resultSchema;
  }

  constructor(name, raw, namespaces = []) {
    if (isInstanceOf(raw, 'Schema')) return raw;
    super();
    this.name = name;
    this.namespaces = new Set(namespaces);
    const preprocessor = new Preprocessor(this);
    const { Type, defs, kindMeta } = preprocessor.parse(raw);
    const isSchemaType = Type.type === 'schema';
    if (!isSchemaType) {
      this.kind = Type.kind;
      this.fields = new Type(defs, preprocessor);
    } else {
      const fields = this.extractMetadata(defs.schema);
      let extras = Object.create(null);
      if (kindMeta) extras = this.updateFromKind(kindMeta);
      const combined = { ...fields, ...extras };
      this.fields = new Struct(combined, preprocessor);
    }
  }

  get types() {
    if (this.namespaces.size === 0) return TYPES;
    const types = Array.from(this.namespaces).map((ns) => ns.types);
    return Object.assign(Object.create(null), ...types);
  }

  checkConsistency() {
    const warn = [];
    const { name, references } = this;
    for (const ref of references) {
      if (isFirstUpper(ref)) {
        const entity = this.findReference(ref);
        if (!entity) {
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
    const result = new ValidationResult(path);
    const custom = this.validate(source, path);
    const nested = this.fields.check(source, path);
    result.add(custom);
    return result.add(nested);
  }

  toInterface() {
    const { name, fields } = this;
    const lines = [`interface ${name} {`];
    for (const pair of Object.entries(fields)) {
      const fieldKey = pair[0];
      const def = pair[1];
      const { type } = def;
      if (!type) continue;
      const optional = def.required ? '' : '?';
      const isEntity = isFirstUpper(type);
      const isBuiltin = ES_TYPES.includes(type);
      const fieldName = isEntity ? `${fieldKey}Id` : fieldKey;
      let tsType = type;
      if (isEntity) tsType = def.many ? 'string[]' : 'string';
      else if (!isBuiltin) tsType = 'string';
      lines.push(`  ${fieldName}${optional}: ${tsType};`);
    }
    lines.push('}');
    return lines.join('\n');
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
    if (root) throw new Error('Schema cannot be serialized');
    return rest;
  }
}

module.exports = { Schema };
