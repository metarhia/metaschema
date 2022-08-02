'use strict';

const object = {
  rules: ['length'],
  kind: 'struct',

  construct(def, prep) {
    const { type } = this;
    const { [type]: short, key, value } = def;
    const [[k, v]] = short ? Object.entries(short) : [[key, value]];
    this.key = k;
    const { Type, defs } = prep.parse(v);
    this.value = new Type(defs, prep);
  },

  checkType(source, path) {
    if (!this.isInstance(source)) {
      return `Filed "${path}" is not a ${this.type}`;
    }
    const entries = this.entries(source);
    if (entries.length === 0 && this.required) {
      return `Filed "${path}" is required`;
    }
    const errors = [];
    for (const [field, val] of entries) {
      if (typeof field !== this.key) {
        return `In ${this.type} "${path}": type of key must be a ${this.key}`;
      }
      const nestedPath = `${path}.${field}`;
      const result = this.value.check(val, nestedPath);
      if (!result.valid) errors.push(...result.errors);
    }
    if (errors.length > 0) return errors;
    return null;
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

  isInstance(value) {
    return value?.constructor?.name === 'Map';
  },

  entries(value) {
    return value.entries();
  },
};

const array = {
  kind: 'struct',
  rules: ['length'],

  construct(def, prep) {
    const { type } = this;
    const source = def[type] || def.value;
    const { Type, defs } = prep.parse(source);
    this.value = new Type(defs, prep);
  },

  checkType(source, path) {
    if (!this.isInstance(source)) {
      return `Field "${path}" not of expected type: ${this.type}`;
    }
    const value = [...source];
    const errors = [];
    for (let i = 0; i < value.length; i++) {
      const el = value[i];
      const nestedPath = `${path}[${i}]`;
      const result = this.value.check(el, nestedPath);
      if (!result.valid) errors.push(...result.errors);
    }
    if (errors.length > 0) return errors;
    return null;
  },

  isInstance(value) {
    return Array.isArray(value);
  },
};

const set = {
  ...array,

  isInstance(value) {
    return value?.constructor?.name === 'Set';
  },
};

module.exports = { object, map, array, set };
