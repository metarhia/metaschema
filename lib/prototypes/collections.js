'use strict';

const { isType } = require('../util.js');

const object = {
  rules: ['length'],
  type: 'object',
  kind: 'struct',
  checkType(source, path, root) {
    if (!this.isInstance(source)) {
      return `Filed "${path}" is not a ${this.type}`;
    }
    const entries = this.entries(source);
    if (entries.length === 0 && this.required) {
      return `Filed "${path}" is required`;
    }
    for (const [field, val] of entries) {
      if (typeof field !== this.key) {
        return `In ${this.type} "${path}": type of key must be a ${this.key}`;
      }
      const error = this.value.check(val, path, root);
      if (error.length > 0) return error;
    }
  },
  construct(def, prep) {
    const { type } = this;
    const { [type]: short, key, value } = def;
    const [[k, v]] = short ? Object.entries(short) : [[key, value]];
    this.key = k;
    const child = prep.parse(v);
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
