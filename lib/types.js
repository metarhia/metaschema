'use strict';
const { formatRequired, formatLength, omit } = require('./util.js');

const scalar = {
  kind: 'scalar',
  check(value, path, def) {
    const { length } = def;
    if (typeof value !== this.name) {
      return [`Field "${path}" is not of expected type: ${this.name}`];
    }
    if (length && value) {
      const len = value.toString().length;
      const { min, max } = length;
      if (min && len < min) return [`Field "${path}" value is too short`];
      if (max && len > max) {
        return [`Field "${path}" exceeds the maximum length`];
      }
    }
    return [];
  },
  toLong(def) {
    const type = def.type || def;
    const formatted = formatRequired.type(type);
    if (typeof def === 'string') return formatted;
    const res = omit(type, def);
    const { length } = def;
    if (length) res.length = formatLength(length);
    return Object.assign(res, formatted);
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
    const { reference, relation, required } = def;
    const sch = schema.findReference(reference);
    if (relation.endsWith('many')) {
      const type = schema.findType('array');
      const fakeDef = {
        type: 'array',
        value: {
          type: 'reference',
          reference,
          required,
          relation: 'one-to-one',
        },
        required,
      };
      return type.check(value, path, fakeDef, schema);
    }
    return sch.check(value, path).errors;
  },
  toLong(def, Schema, schema) {
    const ref = {};
    if (typeof def === 'string') {
      ref.name = def;
      ref.relation = 'many-to-one';
    } else if (def.type === this.name) {
      ref.name = def.reference;
      ref.relation = 'many-to-one';
    } else if (def.many) {
      ref.name = def.many;
      ref.relation = 'one-to-many';
    } else if (def.one) {
      ref.name = def.one;
      ref.relation = 'one-to-one';
    } else if (def.type !== this.name) {
      ref.name = def.type;
      ref.relation = 'many-to-one';
    }
    const { name, relation } = ref;
    const { type } = formatRequired.type(name);
    schema.references.add(type);
    schema.relations.add({ to: type, type: relation });
    return { type: this.name, reference: type, relation };
  },
};

const schema = {
  name: 'schema',
  kind: 'struct',
  check(value, path, def) {
    return def.schema.check(value, path).errors;
  },
  toLong(def, Schema, schemaRef) {
    const { namespaces } = schemaRef;
    let schema;
    if (def.type === this.name || def.schema) {
      const exist = Schema.extractSchema(def);
      if (exist) return def;
      schema = Schema.from(def.schema, namespaces);
    } else {
      schema = Schema.from(def, namespaces);
    }
    schemaRef.references = new Set([
      ...schemaRef.references,
      ...schema.references,
    ]);
    schemaRef.relations = new Set([
      ...schemaRef.relations,
      ...schema.relations,
    ]);

    return { type: this.name, schema };
  },
};

const array = {
  name: 'array',
  kind: 'struct',
  check(value, path, def, schema) {
    if (!this.isInstance(value)) {
      return [`Field "${path}" value is not a ${this.name}`];
    }
    for (const el of value) {
      const type = schema.findType(def.value.type);
      const error = type.check(el, path, def.value, schema);
      if (error.length > 0) return error;
    }
    return [];
  },
  toLong(def, Schema, schema) {
    let value;
    if (def.type) {
      value = def.value;
    } else {
      const first = Object.keys(def)[0];
      value = def[first];
    }
    const { type, required } = schema.preprocessType(value);
    const long = type.toLong(value, Schema, schema);
    return { type: this.name, value: { ...long, required } };
  },
  isInstance(value) {
    return Array.isArray(value);
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
  isInstance(value) {
    return typeof value === 'object';
  },
  entries(value) {
    return Object.entries(value);
  },
  check(value, path, def) {
    if (!this.isInstance(value)) {
      return [`Filed "${path}" is not a ${this.name}`];
    }
    for (const [key, val] of this.entries(value)) {
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
    const keys = Object.keys(def);
    const first = keys[0];
    const entries = Object.entries(def[first]);
    const [key, value] = entries.shift();
    return Object.assign({ type: this.name, key, value }, entries);
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
  string: { name: 'string', ...scalar },
  number: { name: 'number', ...scalar },
  bigint: { name: 'bigint', ...scalar },
  boolean: { name: 'boolean', ...scalar },
  enum: enumerable,
  schema,
  array,
  set,
  object,
  map,
  function: fn,
  reference,
};

const prepareTypes = (types) => {
  const preparedTypes = {};
  for (const [key, value] of Object.entries(types)) {
    if (typeof value === 'string') {
      preparedTypes[key] = { pg: value, ...TYPES.string };
    }
    if (value.type) {
      const name = value.type.js;
      const pg = value.type.pg;
      preparedTypes[key] = { name, pg, ...value };
    }
  }
  return preparedTypes;
};

module.exports = { TYPES, prepareTypes };
