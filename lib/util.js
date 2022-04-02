'use strict';
const UPPER_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWER_LETTERS = 'abcdefghijklmnopqrstyvwxyz';

const formatRequired = {
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
};

const formatLength = (length) => {
  if (typeof length === 'number') return { max: length };
  if (Array.isArray(length)) return { min: length[0], max: length[1] };
  return length;
};

const omit = (key, obj) => {
  const { [key]: omitted, ...rest } = obj;
  return [omitted, rest];
};

const isFirstUpper = (s) => !!s && UPPER_LETTERS.includes(s[0]);
const isFirstLower = (s) => !!s && LOWER_LETTERS.includes(s[0]);
const isFirstLetter = (s) => isFirstUpper(s) || isFirstLower(s);

module.exports = {
  formatRequired,
  omit,
  isFirstUpper,
  formatLength,
  isFirstLetter,
};
