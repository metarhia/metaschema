'use strict';
const UPPER_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWER_LETTERS = 'abcdefghijklmnopqrstyvwxyz';

const formatRequired = {
  type: (type) => {
    const required = !type.startsWith('?');
    if (required) return { type, required };
    const name = type.substring(1);
    return { type: name, required };
  },
  field: (key) => {
    const required = !key.endsWith('?');
    if (required) return { field: key, required };
    const field = key.slice(0, -1);
    return { field, required };
  },
  resolve(...args) {
    let required = true;
    for (const arg of args) {
      const isBool = typeof arg === 'boolean';
      if (isBool && arg === false) required = false;
    }
    return required;
  },
};

const formatLength = (length) => {
  if (typeof length === 'number') return { max: length };
  if (Array.isArray(length)) return { min: length[0], max: length[1] };
  return length;
};

const omit = (key, obj) => {
  // eslint-disable-next-line no-unused-vars
  const { [key]: omitted, ...rest } = obj;
  return rest;
};

const isFirstUpper = (s) => !!s && UPPER_LETTERS.includes(s[0]);

const isFirstLetter = (s) =>
  (!!s && UPPER_LETTERS.includes(s[0])) || LOWER_LETTERS.includes(s[0]);

module.exports = {
  formatRequired,
  omit,
  isFirstUpper,
  formatLength,
  isFirstLetter,
};
