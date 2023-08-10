'use strict';

const { isFirstLetter, validateBracketBalance } = require('metautil');

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
    if (!Array.isArray(length)) return length;
    const [min, max] = length;
    return { min, max };
  },
};

const checks = {
  length: (src, type) => {
    const { length, entries } = type;
    const value = entries ? entries(src) : src;
    const len = value.length || value;
    const { min, max } = length;
    if (min && len < min) return 'value is too short';
    if (max && len > max) return 'exceeds the maximum length';
    return null;
  },
};

const firstKey = (obj) => Object.keys(obj).find(isFirstLetter);

const isInstanceOf = (obj, constrName) => obj?.constructor?.name === constrName;

const isStringIndex = (index) => {
  if (typeof index !== 'string') return false;
  const brackets = ['(', ')'];
  if (brackets.some((bracket) => index.indexOf(bracket) === -1)) return false;
  if (!validateBracketBalance(index, brackets.join(''))) return false;
  const expression = index.substring(
    index.indexOf(brackets[0]) + 1,
    index.lastIndexOf(brackets[1]),
  );
  return expression.trim().length !== 0;
};

module.exports = {
  formatters,
  checks,
  firstKey,
  isInstanceOf,
  isStringIndex,
};
