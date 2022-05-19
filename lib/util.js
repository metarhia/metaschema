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
  length: (src, type) => {
    const { length, entries } = type;
    if (!length) return;
    const value = entries ? entries(src) : src;
    const len = value.length || value;
    const { min, max } = length;
    if (min && len < min) return 'value is too short';
    if (max && len > max) return 'exceeds the maximum length';
  },
};

const harmonize = (err, path = '') => {
  const prefix = `Field "${path}" `;
  if (typeof err === 'boolean') {
    return err ? null : [`${prefix}validation error`];
  }
  if (err) {
    const unprefixed = Array.isArray(err) ? err : [err];
    return unprefixed.map((e) => (e.startsWith('Field') ? e : prefix + e));
  }
  return null;
};

const firstKey = (obj) => Object.keys(obj)[0];

const isType = (obj) => obj.constructor.name === 'Type';

module.exports = {
  formatters,
  checks,
  harmonize,
  firstKey,
  isType,
};
