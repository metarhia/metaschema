'use strict';

const fsp = require('fs').promises;
const { isFirstUpper } = require('metautil');
const { Schema } = require('./schema.js');
const { readDirectory } = require('./loader.js');

const TYPES = {
  number: 'number',
  string: 'string',
  boolean: 'boolean',
  enum: 'string',
};

class Model {
  constructor(types, entities, database = null) {
    this.types = types;
    this.entities = new Map();
    this.database = database;
    this.order = new Set();
    this.warnings = [];
    for (const [name, entity] of entities) {
      const schema = new Schema(name, entity);
      this.entities.set(name, schema);
    }
    this.preprocess();
  }

  static async load(modelPath, systemTypes = {}) {
    const structs = await readDirectory(modelPath);
    const database = structs.get('.database') || null;
    const customTypes = structs.get('.types') || {};
    structs.delete('.database');
    structs.delete('.types');
    const types = { ...TYPES, ...systemTypes, ...customTypes };
    return new Model(types, structs, database);
  }

  preprocess() {
    const { entities, order } = this;
    for (const name of entities.keys()) {
      if (!name.startsWith('.')) this.checkReferences(name);
    }
    if (entities.has('Identifier')) order.add('Identifier');
    for (const name of entities.keys()) {
      if (!name.startsWith('.') && !order.has(name)) {
        this.reorderEntity(name);
      }
    }
  }

  checkReferences(name) {
    const { types, entities } = this;
    const entity = entities.get(name);
    for (const ref of entity.references) {
      if (!entities.has(ref)) {
        const warn = `Warning: ${ref} referenced from ${name} is not found`;
        this.warnings.push(warn);
      }
    }
    const fields = Object.keys(entity.fields);
    for (const field of fields) {
      const { type } = entity.fields[field];
      if (type && !isFirstUpper(type) && !types[type]) {
        const target = name + '.' + field;
        const warn = `Warning: ${target}: ${type} type is not found`;
        this.warnings.push(warn);
      }
    }
  }

  reorderEntity(name, base = name) {
    const entity = this.entities.get(name);
    if (!entity) return;
    for (const ref of entity.references) {
      if (ref === base) {
        this.warnings.push(`Recursive dependency: ${name}.${base}`);
        continue;
      }
      if (!this.order.has(ref)) this.reorderEntity(ref, base);
    }
    this.order.add(name);
  }

  async saveTypes(outputFile) {
    const { entities, order } = this;
    const dts = [];
    for (const name of order) {
      const schema = entities.get(name);
      dts.push(schema.toInterface(name));
    }
    await fsp.writeFile(outputFile, dts.join('\n\n') + '\n');
  }
}

module.exports = { Model };
