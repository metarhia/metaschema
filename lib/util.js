'use strict';

const formatters = {
  type: (type, req = true) => {
    const required = !type.startsWith('?');
    if (required) return [type, req];
    const name = type.substring(1);
    return [name, false];
  },

  key: (key, req = true) => {
    const required = !key.endsWith('?');
    if (required) return [key, req];
    const field = key.slice(0, -1);
    return [field, false];
  },

  length: (length) => {
    if (typeof length === 'number') return { max: length };
    if (!Array.isArray(length)) return length;
    const [min, max] = length;
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
