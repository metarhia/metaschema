'use strict';

const { formatLength, omit, checkLength } = require('../util.js');

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
    const { length } = def;
    if (def.length) def.length = formatLength(length);
    if (def.type) return def;
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

module.exports = { object, map };
