'use strict';

const formatters = {
  type: (type, req = true) => {
    const required = !type.startsWith('?');
    if (required) return { type, required: req };
    const name = type.substring(1);
    return { type: name, required: false };
  },

  key: (key, req = true) => {
    const required = !key.endsWith('?');
    if (required) return { field: key, required: req };
    const field = key.slice(0, -1);
    return { field, required: false };
  },

  length: (length) => {
    if (typeof length === 'number') return { max: length };
    if (!Array.isArray(length)) return length;
    const min = length[0];
    const max = length[1];
    return { min, max };
  },
};

const checks = {
  length: (src, type) => {
    const { length, entries } = type;
    const value = entries ? entries(src) : src;
    const size = value?.size;
    const count = value?.length;
    let len = Number(value);
    if (typeof size === 'number') len = size;
    else if (typeof count === 'number') len = count;
    const { min, max } = length;
    if (min && len < min) return 'value is too short';
    if (max && len > max) return 'exceeds the maximum length';
    return null;
  },
};

module.exports = { formatters, checks };
