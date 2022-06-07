'use strict';

const { isType } = require('../util.js');

const object = {
  rules: ['length'],
  type: 'object',
  kind: 'struct',
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
  },
  construct(def, prep) {
    const { type } = this;
    const { [type]: short, key, value } = def;
    const [[k, v]] = short ? Object.entries(short) : [[key, value]];
    this.key = k;
    const child = prep.parse(v);
    if (isType(child)) {
      this.value = child;
      this.updateRefs(child);
    } else {
      const schema = new prep.types.schema(child.defs, prep);
      this.references.add('schema');
      this.updateRefs(schema);
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
    return value && value.constructor && value.constructor.name === 'Map';
  },
  entries(value) {
    return value.entries();
  },
};

const array = {
  type: 'array',
  kind: 'struct',
  rules: ['length'],
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
  },
  construct(def, prep) {
    const { type } = this;
    const source = def.type ? def.value : def[type];
    const child = prep.parse(source);
    if (isType(child)) {
      this.value = child;
      this.updateRefs(child);
    } else {
      const schema = new prep.types.schema(child.defs, prep);
      this.references.add('schema');
      this.updateRefs(schema);
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
    return value && value.constructor && value.constructor.name === 'Set';
  },
};

module.exports = { object, map, array, set };
