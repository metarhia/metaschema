'use strict';

const { toLowerCamel } = require('metautil');
const { TYPES } = require('./types.js');
const {
  formatRequired,
  omit,
  isFirstUpper,
  isFirstLetter,
} = require('./util.js');

const KIND_ENT = ['entity', 'registry', 'dictionary'];
const KIND_AUX = ['journal', 'details', 'relation', 'view'];
const KIND_STORED = [...KIND_ENT, ...KIND_AUX];
const KIND_MEMORY = ['struct', 'scalar', 'form', 'projection'];
const KIND = [...KIND_STORED, ...KIND_MEMORY];

const SCOPE = ['application', 'global', 'local'];
const STORE = ['persistent', 'memory'];
const ALLOW = ['write', 'append', 'read'];

const ES_TYPES = ['number', 'string', 'boolean', 'bigint'];

const EXCLUDE_FIELDS = ['validate', 'parse', 'serialize', 'format'];

const setValidate = (validate) => {
  if (!validate) return () => ({ valid: true, errors: [] });
  if (typeof validate !== 'function') {
    throw new Error('Validate must be a function');
  }
  return (value, path) => {
    try {
      const res = validate(value, path);
      const valid = typeof res === 'boolean' ? res : Boolean(res.valid);
      const errors = (res && res.errors) || [];
      return { valid, errors };
    } catch (err) {
      return {
        valid: false,
        errors: [`Schema "${path}" validation failed ${String(err)}`],
      };
    }
  };
};
class Schema {
  constructor(name, raw, namespaces = []) {
    this.name = name;
    this.kind = '';
    this.scope = 'local';
    this.store = 'memory';
    this.allow = 'write';
    this.namespaces = new Set(namespaces);
    this.parent = '';
    this.fields = {};
    this.indexes = {};
    this.references = new Set();
    this.relations = new Set();
    this.validate = setValidate(raw.validate);
    this.format = raw.format || (() => {});
    this.parse = raw.parse || (() => {});
    this.serialize = raw.serialize || (() => {});
    this.preprocess(raw, this.fields);
  }

  preprocess(raw, reference) {
    const { name, defs } = this.formatDef(raw);
    const typeFmt = formatRequired.type(name);
    const type = this.findType(typeFmt.type);
    if (name !== 'schema') {
      const long = type.toLong(defs, Schema, this);
      const required = formatRequired.resolve(
        defs.required,
        typeFmt.required,
        long.required
      );
      reference.value = { ...long, required };
      this.kind = this.kind || type.kind;
      return;
    }
    this.kind = this.kind || 'struct';
    const keys = Object.keys(defs);
    for (const key of keys) {
      if (EXCLUDE_FIELDS.includes(key)) continue;
      const entry = defs[key];
      if (this.preprocessIndex(key, entry)) continue;
      const keyFmt = formatRequired.field(key);
      const short = this.formatDef(entry);
      const typeFmt = formatRequired.type(short.name);
      const type = this.findType(typeFmt.type);
      const long = type.toLong(short.defs, Schema, this);
      const required = formatRequired.resolve(
        keyFmt.required,
        typeFmt.required,
        long.required,
        entry.required
      );
      this.references.add(type.name);
      const field = keyFmt.field;
      reference[field] = long;
      reference[field].required = required;
    }
  }

  formatDef(defs) {
    const defsType = typeof defs;
    if (defsType === 'string') {
      if (isFirstUpper(defs)) return { name: 'reference', defs };
      return { name: defs, defs };
    }
    if (defsType === 'function') return { name: 'function', defs };
    if (defsType !== 'object') throw new Error('Invalid defsinition provided');
    if (Array.isArray(defs)) return { name: 'tuple', defs };
    if (defs.type) {
      if (isFirstUpper(defs.type)) return { name: 'reference', defs };
      return { name: defs.type, defs };
    }
    if (defs.many || defs.one) return { name: 'reference', defs };
    const first = Object.keys(defs)[0];
    const isUpper = isFirstUpper(first);
    const kind = isUpper ? this.findKind(toLowerCamel(first)) : null;
    if (kind) {
      const metadata = defs[first];
      this.extractMetadata({ ...metadata, kind });
      const extra = kind === 'projection' ? this.projection(metadata) : {};
      const rest = omit(first, defs);
      return { name: 'schema', defs: { ...extra, ...rest } };
    }
    if (isUpper) return { name: 'reference', reference: first };
    const isType = this.findType(first);
    if (isType) return { name: first, defs };
    return { name: 'schema', defs };
  }

  preprocessIndex(key, defs) {
    const { index, primary, unique, many } = defs;
    const isIndex = Array.isArray(index || primary || unique);
    if (isIndex || many) this.indexes[key] = defs;
    return isIndex;
  }

  projection(metadata) {
    const { schema, fields } = metadata;
    if (!schema && !fields) throw new Error('Invalid Projection');
    this.parent = schema;
    const parent = this.findReference(this.parent);
    const defs = {};
    for (const key of fields) {
      defs[key] = parent.fields[key];
    }
    return defs;
  }

  extractMetadata(metadata) {
    this.kind = metadata.kind;
    this.scope = metadata.scope || 'application';
    this.store = metadata.store || 'persistent';
    this.allow = metadata.allow || 'write';
    return;
  }

  findKind(name) {
    const kind = KIND.find((el) => el === name);
    if (kind) return kind;
    for (const ns of this.namespaces) {
      const kind = ns.kinds[name];
      if (kind) return kind;
    }
    return null;
  }

  findType(name) {
    const type = TYPES[name];
    if (type) return type;
    for (const ns of this.namespaces) {
      const type = ns.types[name];
      if (type) return type;
    }
    return null;
  }

  findReference(name) {
    const trueName = typeof name === 'object' ? name.schema : name;
    for (const ns of this.namespaces) {
      const entity = ns.entities.get(trueName);
      if (entity) return entity;
    }
    return null;
  }

  check(value, path = '') {
    const res = this.validate(value, path);
    if (!res.valid) return res;
    const single = this.fields.value;
    const target = single && single.type ? { value } : value || {};
    const keys = Object.keys(target);
    const fields = Object.keys(this.fields);
    const names = new Set([...keys, ...fields]);
    const errors = [];
    for (const name of names) {
      const value = target[name];
      let defs = this.fields[name];
      if (!defs) {
        errors.push(`Field "${name}" is not expected`);
        continue;
      }
      if (isFirstUpper(defs.type)) {
        defs = this.findReference(defs.type);
      }
      const type = this.findType(defs.type);
      const nestedPath = path ? `${path}.${name}` : name;
      if (!defs.required && value === undefined) continue;
      if (defs.required && !keys.includes(name)) {
        errors.push(`Field "${nestedPath}" is required`);
        continue;
      }
      const errs = type.check(value, nestedPath, defs, this);
      if (errs.length > 0) errors.push(...errs);
    }
    return { valid: errors.length === 0, errors };
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

  toInterface() {
    const { name, fields } = this;
    const types = [];
    types.push(`interface ${name} {`);
    const pk = toLowerCamel(name) + 'Id';
    types.push(`  ${pk}: number;`);
    for (const [name, defs] of Object.entries(fields)) {
      let { type } = defs;
      if (type) {
        const q = defs.required ? '' : '?';
        const isEntity = isFirstUpper(type);
        const isType = ES_TYPES.includes(type);
        let fieldName = name + (isEntity ? 'Id' : '');
        if (!isFirstLetter(fieldName)) fieldName = `"${fieldName}"`;
        if (isEntity) {
          type = 'number';
        } else if (!isType) {
          const { array, reference, relation } = defs;
          if (array) type = 'any[]';
          if (reference) {
            type = relation.endsWith('one') ? `${reference}` : `${reference}[]`;
          }
        }
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

  static from(raw, namespaces) {
    return new Schema('', raw, namespaces);
  }

  static extractSchema(defs) {
    if (defs instanceof Schema) return defs;
    if (defs.schema instanceof Schema) return defs.schema;
    if (defs.struct instanceof Schema) return defs.struct;
    return null;
  }
}

Schema.KIND = KIND;
Schema.KIND_STORED = KIND_STORED;
Schema.KIND_MEMORY = KIND_MEMORY;
Schema.SCOPE = SCOPE;
Schema.STORE = STORE;
Schema.ALLOW = ALLOW;

module.exports = { Schema };
