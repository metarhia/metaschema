'use strict';

const { formatLength, checkLength, omit } = require('../util.js');

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
    const raw = def.type ? def.value : omit(this.name, def)[0];
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
};

const set = {
  ...array,
  name: 'set',
  isInstance(value) {
    return Reflect.getPrototypeOf(value) === Set.prototype;
  },
};

module.exports = { array, set };
