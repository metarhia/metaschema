'use strict';

const fsp = require('fs').promises;
const { isFirstUpper } = require('metautil');
const { Schema } = require('./schema.js');
const { readDirectory } = require('./loader.js');

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
    const types = { ...systemTypes, ...customTypes };
    return new Model(types, structs, database);
  }

  preprocess() {
    const { entities, order } = this;
    for (const name of entities.keys()) {
      if (!name.startsWith('.')) this.checkReferences(name);
    }
    for (const name of entities.keys()) {
      if (!name.startsWith('.') && !order.has(name)) {
        this.reorderEntity(name);
      }
    }
  }

  checkReferences(name) {
    const { types, entities } = this;
    const entity = entities.get(name);
    const fields = Object.keys(entity.fields);
    for (const field of fields) {
      const def = entity.fields[field];
      if (def.constructor.name === 'Schema') continue;
      const kind = isFirstUpper(def.type) ? 'entity' : 'type';
      const { type } = def;
      const notFound = kind === 'entity' ? !entities.has(type) : !types[type];
      if (notFound) {
        const target = name + '.' + field;
        this.warnings.push(`Warning: ${kind} is not found, ${target}: ${type}`);
        delete entity.fields[field];
      }
    }
  }

  reorderEntity(name, base = name) {
    const { entities, order } = this;
    const entity = entities.get(name);
    const fields = Object.keys(entity.fields);
    for (const field of fields) {
      const { type } = entity.fields[field];
      if (type === base) {
        console.log(`Recursive dependency: ${name}.${base}`);
        continue;
      }
      if (isFirstUpper(type) && !order.has(type)) {
        this.reorderEntity(type, base);
      }
    }
    order.add(name);
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
