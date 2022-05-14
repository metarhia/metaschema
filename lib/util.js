'use strict';

const formatters = {
  type: (type, req = true) => {
    const required = !type.startsWith('?');
    if (required) return [type, required && req];
    const name = type.substring(1);
    return [name, required && req];
  },
  key: (key, req = true) => {
    const required = !key.endsWith('?');
    if (required) return [key, required && req];
    const field = key.slice(0, -1);
    return [field, required];
  },
  length: (length) => {
    if (typeof length === 'number') return { max: length };
    if (Array.isArray(length)) return { min: length[0], max: length[1] };
    return length;
  },
};

const checks = {
  length: (src, path, type) => {
    const { length, entries } = type;
    const value = entries ? entries(src) : src;
    const len = value.length || value;
    const { min, max } = length;
    if (min && len < min) throw new Error(`Field "${path}" value is too short`);
    if (max && len > max) {
      throw new Error(`Field "${path}" exceeds the maximum length`);
    }
  },
};

const harmonize = (result) => {
  if (typeof result === 'boolean') {
    return result ? '' : ['Validation error'];
  }
  if (result) return Array.isArray(result) ? result : [result];
};

const omit = (key, obj) => {
  const { [key]: omitted, ...rest } = obj;
  return [omitted, rest];
};

const firstKey = (obj) => Object.keys(obj)[0];

const isType = (obj) => obj.constructor.name === 'Type';

module.exports = {
  formatters,
  checks,
  harmonize,
  omit,
  firstKey,
  isType,
};
