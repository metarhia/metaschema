'use strict';

const path = require('path');

const getSchemaDir = (name, parent = '') =>
  path.resolve(__dirname, '..', 'schemas', parent, name);

const removeStack = errors =>
  errors.forEach(error => {
    delete error.stack;
  });

module.exports = {
  getSchemaDir,
  removeStack,
};
