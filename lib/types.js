'use strict';
const { formatLength, omit } = require('./util.js');

const checkLength = (value, path, length) => {
  const len = value.length;
  const { min, max } = length;
  if (min && len < min) return [`Field "${path}" value is too short`];
  if (max && len > max) {
    return [`Field "${path}" exceeds the maximum length`];
  }
};

const scalar = {
  kind: 'scalar',
  check(value, path, def) {
    if (typeof value !== this.name) {
      return [`Field "${path}" is not of expected type: ${this.name}`];
    }
    const { length } = def;
    if (length && this.length) {
      const err = checkLength(value, path, length);
      if (err) return err;
    }
    return [];
  },
  toLong(def) {
    const { length } = def;
    if (length) def.length = formatLength(length);
    return def;
  },
};

const enumerable = {
  name: 'enum',
  kind: 'scalar',
  check(value, path, def) {
    if (def.enum.includes(value)) return [];
    return [`Field "${path}" value is not of enum: ${def.enum.join(', ')}`];
  },
  toLong(def) {
    return { type: 'enum', ...def };
  },
};

const reference = {
  name: 'reference',
  kind: 'struct',
  check(value, path, def, schema) {
    const { one, many, required } = def;
    if (many) {
      const type = schema.findType('array');
      const fakeDef = {
        type: 'array',
        value: {
          type: 'reference',
          one: many,
        },
        required,
      };
      return type.check(value, path, fakeDef, schema);
    }
    const sch = schema.findReference(one);
    return sch.check(value, path).errors;
  },
  toLong(def, Schema, schema) {
    const defs = typeof def === 'string' ? { one: def } : def;
    const key = def.many ? 'many' : 'one';
    const value = defs[key] ? defs[key] : defs.type;
    const relation = key === 'many' ? 'many-to-one' : 'one-to-many';
    schema.references.add(value);
    schema.relations.add({ to: value, type: relation });
    return { type: this.name, [key]: value };
  },
};

const schema = {
  name: 'schema',
  kind: 'struct',
  check(value, path, def) {
    return def.schema.check(value, path).errors;
  },
  toLong(def, Schema, parent) {
    const { namespaces } = parent;
    const { name } = this;
    const exist = Schema.extractSchema(def);
    if (exist) return { type: name, schema: exist };
    const target = def.schema ? def.schema : def;
    const schema = Schema.from(target, namespaces);
    parent.references = new Set([...parent.references, ...schema.references]);
    parent.relations = new Set([...parent.relations, ...schema.relations]);

    return { type: name, schema };
  },
};

const array = {
  name: 'array',
  kind: 'struct',
  check(value, path, def, schema) {
    if (!this.isInstance(value)) {
      return [`Field "${path}" value is not a ${this.name}`];
    }
    const { length } = def;
    if (length) {
      const err = checkLength(value, path, length);
      if (err) return err;
    }
    for (const el of value) {
      const type = schema.findType(def.value.type);
      const error = type.check(el, path, def.value, schema);
      if (error.length > 0) return error;
    }
    return [];
  },
  toLong(def, Schema, schema) {
    let raw;
    if (def.type) {
      raw = def.value;
    } else {
      const first = Object.keys(def)[0];
      raw = def[first];
    }
    const { length } = def;
    if (length) def.length = formatLength(length);

    const { value, ...rest } = schema.preprocess(raw);
    return {
      type: this.name,
      value: value || { type: 'schema', schema: Schema.from(rest) },
    };
  },
  isInstance(value) {
    return Array.isArray(value);
  },
  length(value, path, def) {
    return checkLength(value, path, def);
  },
};

const set = {
  ...array,
  name: 'set',
  isInstance(value) {
    return Reflect.getPrototypeOf(value) === Set.prototype;
  },
};

const object = {
  name: 'object',
  kind: 'struct',
  check(value, path, def) {
    if (!this.isInstance(value)) {
      return [`Filed "${path}" is not a ${this.name}`];
    }
    const entries = this.entries(value);
    const { length } = def;
    if (length) {
      const err = checkLength(entries, path, length);
      if (err) return err;
    }
    for (const [key, val] of entries) {
      if (typeof key !== def.key) {
        return [`In ${this.name} "${path}": type of key must be a ${def.key}`];
      }
      if (typeof val !== def.value) {
        return [
          `In ${this.name} "${path}": type of value must be a ${def.value}`,
        ];
      }
    }
    return [];
  },
  toLong(def) {
    if (def.type) {
      return def;
    }
    const { length } = def;
    if (def.length) def.length = formatLength(length);
    const { name } = this;
    const [entries, rest] = omit(name, def);
    const [key, value] = Object.entries(entries)[0];
    return { type: name, key, value, ...rest };
  },
  isInstance(value) {
    return typeof value === 'object';
  },
  entries(value) {
    return Object.entries(value);
  },
};

const map = {
  ...object,
  name: 'map',
  isInstance(value) {
    return Reflect.getPrototypeOf(value) === Map.prototype;
  },
  entries(value) {
    return value.entries();
  },
};

const fn = {
  name: 'function',
  check(value, path) {
    if (typeof value === 'function') return [];
    return [`Field "${path}" is not a function`];
  },
  toLong(def) {
    def.type = 'function';
    def.required = false;
    return def;
  },
};

const TYPES = {
  string: { name: 'string', length: true, ...scalar },
  number: { name: 'number', length: true, ...scalar },
  bigint: { name: 'bigint', length: true, ...scalar },
  boolean: { name: 'boolean', ...scalar },
  enum: enumerable,
  schema,
  array,
  set,
  object,
  map,
  function: fn,
  reference,
  many: reference,
  one: reference,
};

const prepareTypes = (types) => {
  const preparedTypes = {};
  for (const [key, value] of Object.entries(types)) {
    if (typeof value === 'string') {
      preparedTypes[key] = { pg: value, ...TYPES.string };
    } else {
      const { js, pg } = value;
      if (!js) continue;
      const name = js;
      const [, rest] = omit('js', value);
      preparedTypes[key] = { name, pg, ...rest };
    }
  }
  return preparedTypes;
};

module.exports = { TYPES, prepareTypes };
