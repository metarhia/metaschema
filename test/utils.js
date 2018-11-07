'use strict';

const path = require('path');

const getSchemaDir = (name, parent = '') =>
  path.join(__dirname, 'schemas', parent, name);

module.exports = {
  getSchemaDir,
};
