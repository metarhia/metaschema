'use strict';

const { join } = require('path');
const { readFileSync } = require('fs');
const { processSchema } = require('./schema-loader');
const { create } = require('./schema');

const schemasDir = join(__dirname, '..', 'schemas', 'metaschema');
const schemas = {
  categories: [],
  domains: [],
  views: [],
  forms: [],
  actions: [],
  sources: [],
};

const loadAs = (type, names) =>
  names.map(name => {
    const path = join(schemasDir, `${name}.${type}`);
    const source = readFileSync(path);
    const definition = processSchema(name, source);
    return { name, definition };
  });

schemas.domains = loadAs('domains', ['system']);
schemas.categories = loadAs('category', ['Domain', 'DatabaseField']);

const [err, schemaValidator] = create(schemas);

if (err) console.error(err);

module.exports = schemaValidator;
