'use strict';

const { isType } = require('../util.js');

const object = {
  rules: ['length'],
  type: 'object',
  kind: 'struct',
  checkType(source, path) {
    const { type, key, value } = this;
    if (!this.isInstance(source)) {
      return `Filed "${path}" is not a ${type}`;
    }
    const entries = this.entries(source);
    for (const [field, val] of entries) {
      if (typeof field !== key) {
        return `In ${type} "${path}": type of key must be a ${key}`;
      }
      if (typeof val !== value) {
        return `In ${type} "${path}": type of value must be a ${value}`;
      }
    }
  },
  construct(def) {
    const { type } = this;
    const { [type]: short } = def;
    if (def.type) return def;
    const [key, value] = Object.entries(short)[0];
    this.key = key;
    this.value = value;
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
  type: 'map',
  isInstance(value) {
    return Reflect.getPrototypeOf(value) === Map.prototype;
  },
  entries(value) {
    return value.entries();
  },
};

const array = {
  type: 'array',
  kind: 'struct',
  rules: ['length'],
  checkType(value, path, root) {
    if (!this.isInstance(value)) {
      return `Field "${path}" value is not a ${this.type}`;
    }
    for (const el of value) {
      const error = this.value.check(el, path, root);
      if (error.length > 0) return error;
    }
  },
  construct(def, prep) {
    const { type } = this;
    const source = def.type ? def.value : def[type];
    const child = prep.parse(source);
    if (isType(child)) {
      this.value = child;
      this.metadataFrom(child);
    } else {
      const schema = new prep.types.schema(child.defs, prep);
      this.references.add('schema');
      this.metadataFrom(schema);
      this.value = schema;
    }
  },
  isInstance(value) {
    return Array.isArray(value);
  },
};

const set = {
  ...array,
  type: 'set',
  isInstance(value) {
    return Reflect.getPrototypeOf(value) === Set.prototype;
  },
};

module.exports = { object, map, array, set };
