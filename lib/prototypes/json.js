'use strict';

const json = {
  kind: 'struct',

  construct() {},

  checkType(value, path) {
    const isObject = value !== null && typeof value === 'object';
    if (!isObject) return `Field "${path}" not of expected type: object`;
    return null;
  },
};

module.exports = { json };
