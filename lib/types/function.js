'use strict';

const fn = {
  name: 'function',
  check(value, path) {
    if (typeof value === 'function') return [];
    return [`Field "${path}" is not a function`];
  },
  toLong(def) {
    def.type = 'function';
    def.required = false;
    return def;
  },
};

module.exports = { function: fn };
