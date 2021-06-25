'use strict';

const fsp = require('fs').promises;
const { Schema } = require('./schema.js');
const { readDirectory } = require('./loader.js');
const { TYPES } = require('./types.js');

class Model {
  constructor(types, entities, database = null) {
    this.types = types;
    this.entities = new Map();
    this.database = database;
    this.order = new Set();
    this.warnings = [];
    for (const [name, entity] of entities) {
      if (entity.type) {
        this.warnings.push(
          `Warning: 'type' property is restricted in database schemas: ${name}`
        );
      }
      const schema = new Schema(name, entity, [this]);
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
    for (const [name, entity] of entities) {
      if (name.startsWith('.')) continue;
      const warn = entity.checkConsistency();
      this.warnings.push(...warn);
    }
    if (entities.has('Identifier')) order.add('Identifier');
    for (const name of entities.keys()) {
      if (!name.startsWith('.') && !order.has(name)) {
        this.reorderEntity(name);
      }
    }
  }

  reorderEntity(name, base) {
    const entity = this.entities.get(name);
    if (!entity) return;
    for (const ref of entity.references) {
      if (ref === name) continue;
      if (ref === base) {
        this.warnings.push(`Recursive dependency: ${name}.${base}`);
        continue;
      }
      if (!this.order.has(ref)) this.reorderEntity(ref, base || name);
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
