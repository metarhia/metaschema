'use strict';

const object = {
  rules: ['length'],
  kind: 'struct',

  construct(def, prep) {
    const { type } = this;
    const { [type]: short, key, value } = def;
    const pair = short ? Object.entries(short)[0] : [key, value];
    const keyType = pair[0];
    const valueDef = pair[1];
    this.key = keyType;
    const { Type, defs } = prep.parse(valueDef);
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
    for (const pair of entries) {
      const field = pair[0];
      const fieldValue = pair[1];
      if (typeof field !== this.key) {
        const hint = `type of key must be a ${this.key}`;
        return `In ${this.type} "${path}": ${hint}`;
      }
      const nestedPath = `${path}.${field}`;
      const result = this.value.check(fieldValue, nestedPath);
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
    return [...value.entries()];
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
    for (let index = 0; index < value.length; index += 1) {
      const element = value[index];
      const nestedPath = `${path}[${index}]`;
      const result = this.value.check(element, nestedPath);
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
