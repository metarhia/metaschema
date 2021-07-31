'use strict';

const { isFirstUpper, toLowerCamel } = require('metautil');
const { TYPES } = require('./types.js');

const KIND_ENT = ['entity', 'registry', 'dictionary'];
const KIND_AUX = ['journal', 'details', 'relation', 'view'];
const KIND_STORED = [...KIND_ENT, ...KIND_AUX];
const KIND_MEMORY = ['struct', 'scalar', 'form', 'projection'];
const KIND = [...KIND_STORED, ...KIND_MEMORY];

const SCOPE = ['application', 'global', 'local'];
const STORE = ['persistent', 'memory'];
const ALLOW = ['write', 'append', 'read'];

const ES_TYPES = ['number', 'string', 'boolean'];

const checks = {
  array: (arr, type) => {
    if (!Array.isArray(arr)) return false;
    for (const el of arr) {
      if (typeof el !== type) return false;
    }
    return true;
  },

  set: (set, type) => {
    if (Reflect.getPrototypeOf(set) !== Set.prototype) return false;
    for (const el of set.values()) {
      if (typeof el !== type) return false;
    }
    return true;
  },

  object: (obj, key, val) => {
    if (typeof obj !== 'object') return false;
    for (const [name, value] of Object.entries(obj)) {
      if (typeof name !== key) return false;
      if (typeof value !== val) return false;
    }
    return true;
  },

  map: (map, key, val) => {
    if (Reflect.getPrototypeOf(map) !== Map.prototype) return false;
    for (const [name, value] of map.entries()) {
      if (typeof name !== key) return false;
      if (typeof value !== val) return false;
    }
    return true;
  },
};

const getShorthand = (def) => {
  const keys = Object.keys(def);
  for (const key of keys) {
    if (def[key].shorthand) return key;
  }
  return '';
};

const check = (name, def, val) => {
  if (def.required === false && val === undefined) return [];
  const { type, key, value, length } = def;
  if (type === 'array' || type === 'set') {
    if (checks[type](val, value)) return [];
    return [`Field "${name}" expected to be ${type} of ${value}`];
  } else if (type === 'object' || type === 'map') {
    if (checks[type](val, key, value)) return [];
    return [`Field "${name}" expected to be ${type} of ${key}: ${value}`];
  } else if (type === 'enum') {
    if (def.enum.includes(val)) return [];
    return [`Field "${name}" value is not of enum: ${def.enum.join(', ')}`];
  }
  if (typeof val !== type) {
    return [`Field "${name}" is not of expected type: ${type}`];
  }
  if (length && val) {
    const len = val.toString().length;
    const { min, max } = length;
    if (min && len < min) return [`Field "${name}" value is too short`];
    if (max && len > max) return [`Field "${name}" exceeds the maximum length`];
  }
  return [];
};

const shorthand = (def) => {
  if (typeof def === 'string') return def;
  else if (Array.isArray(def)) return 'tuple';
  else if (typeof def.array === 'string') return 'array';
  else if (typeof def.set === 'string') return 'set';
  else if (typeof def.object === 'object') return 'object';
  else if (typeof def.map === 'object') return 'map';
  else if (Array.isArray(def.enum)) return 'enum';
  return '';
};

const formatLength = (length) => {
  if (typeof length === 'number') return { max: length };
  if (Array.isArray(length)) return { min: length[0], max: length[1] };
  return length;
};

const toLongForm = (type, def) => {
  if (!type) return def;
  if (type === 'enum') {
    return Object.assign(def, { type, enum: def.enum });
  } else if (type === 'array' || type === 'set') {
    const value = def[type];
    Reflect.deleteProperty(def, type);
    return Object.assign(def, { type, value });
  } else if (type === 'map' || type === 'object') {
    const col = def[type];
    Reflect.deleteProperty(def, type);
    const key = Object.keys(col)[0];
    const value = col[key];
    return Object.assign(def, { type, key, value });
  } else {
    return { type };
  }
};

class Schema {
  constructor(name, raw, namespaces) {
    const short = shorthand(raw) || raw.type;
    const defs = short ? { value: raw } : raw;
    this.name = name;
    this.kind = short ? 'scalar' : 'struct';
    this.scope = 'local';
    this.store = 'memory';
    this.allow = 'write';
    this.namespaces = new Set(namespaces);
    this.parent = '';
    this.fields = {};
    this.indexes = {};
    this.references = new Set();
    this.relations = new Set();
    this.validate = defs.validate || null;
    this.format = defs.format || null;
    this.parse = defs.parse || null;
    this.serialize = defs.serialize || null;
    this.preprocess(defs);
  }

  preprocess(defs) {
    const keys = Object.keys(defs);
    const first = keys[0];
    if (isFirstUpper(first)) {
      const metadata = defs[keys.shift()];
      this.kind = toLowerCamel(first);
      this.scope = metadata.scope || 'application';
      this.store = metadata.store || 'persistent';
      this.allow = metadata.allow || 'write';
      if (metadata.schema && metadata.fields) {
        this.parent = metadata.schema;
        const parent = this.findReference(this.parent);
        for (const key of metadata.fields) {
          defs[key] = parent.fields[key];
          keys.push(key);
        }
      }
    }
    for (const key of keys) {
      const entry = defs[key];
      const short = shorthand(entry);
      let type = short || entry.type;
      if (!type) {
        if (this.preprocessIndex(key, entry)) continue;
        if (entry.json) {
          const json = Schema.from(entry.json);
          this.fields[key] = Object.assign({}, entry, { type: 'json', json });
        } else {
          const schema = Schema.from(entry);
          this.fields[key] = schema;
          this.references = new Set([...this.references, ...schema.references]);
          this.relations = new Set([...this.relations, ...schema.relations]);
        }
        continue;
      }
      const required = !type.startsWith('?');
      if (!required) type = type.substring(1);
      const def = short ? toLongForm(type, entry) : entry;
      if (!Reflect.has(def, 'required')) def.required = required;
      if (def.length) def.length = formatLength(def.length);
      this.references.add(type);
      if (isFirstUpper(type)) {
        this.relations.add({ to: type, type: 'many-to-one' });
      }
      this.fields[key] = def;
    }
  }

  preprocessIndex(key, def) {
    const { index, primary, unique, many } = def;
    const isIndex = many || Array.isArray(index || primary || unique);
    if (isIndex) this.indexes[key] = def;
    if (many) {
      this.references.add(many);
      this.relations.add({ to: many, type: 'one-to-many' });
    }
    return isIndex;
  }

  static from(raw, namespaces) {
    return new Schema('', raw, namespaces);
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
    const type = TYPES[name];
    if (type) return type;
    for (const ns of this.namespaces) {
      const type = ns.types[name];
      if (type) return type;
    }
    return null;
  }

  findReference(name) {
    for (const ns of this.namespaces) {
      const entity = ns.entities.get(name);
      if (entity) return entity;
    }
    return null;
  }

  check(value, path = '') {
    const target = this.kind === 'scalar' ? { value } : value || {};
    const keys = Object.keys(target);
    const fields = Object.keys(this.fields);
    const errors = [];
    const shorthand = getShorthand(this.fields);
    if (shorthand) {
      const shortDef = this.fields[shorthand];
      const errs = check(shorthand, shortDef, value);
      if (errs.length === 0) return { valid: true, errors };
    }
    const names = new Set([...keys, ...fields]);
    for (const name of names) {
      const value = target[name];
      let def = this.fields[name];
      if (def && isFirstUpper(def.type)) {
        def = this.findReference(def.type);
      }
      if (!def) {
        errors.push(`Field "${path}${name}" is not expected`);
        continue;
      }
      if (def instanceof Schema) {
        const subcheck = def.check(value, name + '.');
        if (!subcheck.valid) errors.push(...subcheck.errors);
        continue;
      }
      if (def.json instanceof Schema) {
        const subcheck = def.json.check(value, name + '.');
        if (!subcheck.valid) errors.push(...subcheck.errors);
        continue;
      }
      if (def.required && !keys.includes(name)) {
        errors.push(`Field "${path}${name}" is required`);
        continue;
      }
      const errs = check(name, def, value);
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
