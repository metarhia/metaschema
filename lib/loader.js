'use strict';

const fsp = require('fs').promises;
const path = require('path');

const metavm = require('metavm');

const { Schema } = require('./schema.js');

const createSchema = (name, src) => {
  const { exports } = new metavm.MetaScript(name, src);
  const entity = new Schema(name, exports);
  return entity;
};

const loadSchema = async (fileName) => {
  const src = await fsp.readFile(fileName, 'utf8');
  const name = path.basename(fileName, '.js');
  const { exports } = new metavm.MetaScript(name, src);
  const entity = new Schema(name, exports);
  return entity;
};

module.exports = { createSchema, loadSchema };
