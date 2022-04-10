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

const RESERVED_FOR_SCHEMA = ['validate', 'parse', 'serialize', 'format'];
const RESERVED_FOR_DEF = ['required', 'unique', 'default', 'note', 'index'];

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

const diffFromRulesArr = (target, rules) => {
  const diff = [];
  for (const el of target) {
    if (!rules.includes(el)) diff.push(el);
  }
  return diff;
};

const preprocessor = {
  string: (def) => {
    const [name, required] = formatRequired.type(def);
    if (isFirstUpper(name)) {
      return { name: 'reference', def: { one: def, required } };
    }
    return { name, def: { required, type: name } };
  },
  function: (def) => ({ name: 'function', def }),
  array: (def) => ({ name: 'tuple', def: { tuple: def } }),
  type: (def) => {
    const [name, required] = formatRequired.type(def.type, def.required);
    const isUp = isFirstUpper(name);
    if (isUp) return { name: 'reference', def: { one: def, required } };
    return { name, def: { ...def, required, type: name } };
  },
  object(def) {
    const keys = Object.keys(def);
    const first = keys[0];
    if (isFirstUpper(first)) {
      const [metadata, defs] = omit(first, def);
      const kind = toLowerCamel(first);
      return { name: 'schema', def: defs, kind, metadata };
    }
    if (def.type) return this.type(def);
    const diff = diffFromRulesArr(keys, RESERVED_FOR_DEF);
    if (diff.length === 1) {
      return { short: diff[0], def };
    }
    return { name: 'schema', def, kind: 'struct' };
  },
};

const typeOf = (raw) => {
  const defType = typeof raw;
  return Array.isArray(raw) ? 'array' : defType;
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
    this.fields = this.preprocess(raw);
  }

  preprocess(raw) {
    const { name, def, kind, metadata } = this.preprocessType(raw);
    if (name !== 'schema') {
      const type = this.findType(name);
      if (!type) throw new Error(`Unknown type ${type}`);
      const long = type.toLong(def, Schema, this);
      this.kind = this.kind || type.kind;
      return { value: long };
    }
    this.kind = kind;
    if (!this.findKind(kind)) throw new Error('Given Kind is invalid');
    this.applyMetadata(metadata);
    const extra = kind === 'projection' ? this.projection(metadata) : {};
    const fields = {};
    const defs = Object.assign(def, extra);
    const keys = Object.keys(def);
    for (const key of keys) {
      if (RESERVED_FOR_SCHEMA.includes(key)) continue;
      const entry = defs[key];
      if (this.preprocessIndex(key, entry)) continue;
      const [k, req] = formatRequired.key(key);
      const { name, def } = this.preprocessType(entry);
      const type = this.findType(name);
      if (!type) throw new Error(`Unknown type ${type}`);
      const long = type.toLong(def, Schema, this);
      this.references.add(name);
      fields[k] = long;
      fields[k].required = def.required === undefined ? req : def.required;
    }
    return fields;
  }

  preprocessType(defs) {
    const rawType = typeOf(defs);
    const res = preprocessor[rawType](defs);
    const { short, def } = res;
    const [key, required] = formatRequired.key(short || '', def.required);
    const isType = short ? this.isType(key) : false;
    if (isType) {
      const [omitted, rest] = omit(short, def);
      return { name: key, def: { [key]: omitted, ...rest, required } };
    } else if (short) {
      return { name: 'schema', def, kind: 'struct' };
    }
    return res;
  }

  isType(name) {
    const types = this.getTypes();
    return types.has(name);
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

  applyMetadata(meta) {
    if (!meta) return;
    this.scope = meta.scope || 'application';
    this.store = meta.store || 'persistent';
    this.allow = meta.allow || 'write';
    return;
  }

  findKind(name) {
    const kind = KIND.includes(name) ? name : undefined;
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

  getTypes() {
    const types = Object.keys(TYPES);
    for (const ns of this.namespaces) {
      types.push(...Object.keys(ns.types));
    }
    return new Set(types);
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
    const target = single && !!value && !value.value ? { value } : value || {};
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
          const { array, one, many } = defs;
          if (array) type = 'any[]';
          if (one) type = one;
          if (many) type = `${many}[]`;
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
