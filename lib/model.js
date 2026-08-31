'use strict';

const { firstKey } = require('metautil');

const { Schema } = require('./schema.js');
const { typeFactory } = require('./types.js');

class Model {
  constructor(types, entities, database = null) {
    this.types = typeFactory(types);
    this.entities = new Map();
    this.database = database;
    this.order = new Set();
    this.warnings = [];
    const projections = [];
    for (const pair of entities) {
      const name = pair[0];
      const entity = pair[1];
      const first = firstKey(entity);
      const isProjection = first === 'Projection';
      if (isProjection) {
        projections.push({ name, entity });
        continue;
      }
      const schema = new Schema(name, entity, [this]);
      this.entities.set(name, schema);
    }
    for (const projection of projections) {
      const { name, entity } = projection;
      const schema = new Schema(name, entity, [this]);
      this.entities.set(name, schema);
    }
    this.preprocess();
  }

  preprocess() {
    const { entities, order } = this;
    for (const pair of entities) {
      const name = pair[0];
      const entity = pair[1];
      if (name.startsWith('.')) continue;
      const warn = entity.checkConsistency();
      this.warnings.push(...warn);
    }
    if (entities.has('Identifier')) order.add('Identifier');
    for (const name of entities.keys()) {
      const isMeta = name.startsWith('.');
      const alreadyOrdered = order.has(name);
      if (!isMeta && !alreadyOrdered) this.reorderEntity(name);
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
      dts.push(schema.toInterface());
    }
    return `${dts.join('\n\n')}\n`;
  }
}

module.exports = { Model };
