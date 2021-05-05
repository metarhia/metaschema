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

const readDirectory = async (dirPath) => {
  const files = await fsp.readdir(dirPath, { withFileTypes: true });
  const structs = new Map();
  for (const file of files) {
    if (file.isDirectory()) continue;
    if (!file.name.endsWith('.js')) continue;
    const absPath = path.join(dirPath, file.name);
    const { name, exports } = await metavm.readScript(absPath);
    structs.set(name, exports);
  }
  return structs;
};

module.exports = { createSchema, loadSchema, readDirectory };
