'use strict';

const json = {
  kind: 'struct',

  construct() {},

  checkType(value, path) {
    if (typeof value !== 'object' || !value) {
      return `Field "${path}" not of expected type: object`;
    }
    return null;
  },
};

module.exports = { json };
