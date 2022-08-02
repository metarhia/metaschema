'use strict';

const { Schema } = require('./schema.js');
const { typeFactory } = require('./types.js');
const { firstKey } = require('./util.js');

class Model {
  constructor(types, entities, database = null) {
    this.types = typeFactory(types);
    this.entities = new Map();
    this.database = database;
    this.order = new Set();
    this.warnings = [];
    const last = new Set();
    for (const [name, entity] of entities) {
      const first = firstKey(entity);
      if (first === 'Projection') {
        last.add([name, entity]);
        continue;
      }
      const schema = new Schema(name, entity, [this]);
      this.entities.set(name, schema);
    }
    for (const [name, entity] of last) {
      const schema = new Schema(name, entity, [this]);
      this.entities.set(name, schema);
    }
    this.preprocess();
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

  get dts() {
    const { entities, order } = this;
    const dts = [];
    for (const name of order) {
      const schema = entities.get(name);
      dts.push(schema.toInterface(name));
    }
    return dts.join('\n\n') + '\n';
  }
}

module.exports = { Model };
