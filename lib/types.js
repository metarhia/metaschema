'use strict';

const { AbstractType } = require('./prototypes/abstract.js');
const scalars = require('./prototypes/scalars.js');
const collections = require('./prototypes/collections.js');
const { reference } = require('./prototypes/reference.js');
const { struct } = require('./prototypes/struct.js');
const { tuple } = require('./prototypes/tuple.js');

class TypeFactory {
  #prototypes;

  constructor() {
    this.#prototypes = {
      ...scalars,
      ...collections,
      reference,
      many: reference,
      one: reference,
      schema: struct,
      tuple,
    };
    this.types = {};
    for (const [name, proto] of Object.entries(this.#prototypes)) {
      this.types[name] = this.create(name, proto);
    }
  }

  create(name, prototype) {
    class Type extends AbstractType {
      static metadata = {};
      static type = name;
      static kind = prototype.kind;

      static assign(key, value) {
        this.metadata[key] = value;
      }

      constructor(def, preprocessor) {
        super(preprocessor.root);
        this.create(def, preprocessor);
      }
    }
    const { rules } = prototype;
    if (rules) Type.setRules(rules);
    Object.assign(Type.prototype, prototype);
    return Type;
  }

  updateMetadata(Type, metadata = {}) {
    for (const [key, value] of Object.entries(metadata)) {
      Type.assign(key, value);
    }
  }

  updateType(name, metadata) {
    const Type = this.types[name];
    this.updateMetadata(Type, metadata);
  }

  addType(name, proto, metadata) {
    const Type = this.create(name, proto);
    this.types[name] = Type;
    this.updateMetadata(Type, metadata);
  }

  attouchTypes(types) {
    for (const [name, value] of Object.entries(types)) {
      const { js, metadata, ...proto } = value;
      if (this.types[name]) {
        this.updateType(name, metadata);
        continue;
      }
      if (!js || js === name) {
        this.addType(name, proto, metadata);
        continue;
      }
      if (this.types[js]) {
        const proto = this.#prototypes[js];
        this.addType(name, proto, metadata);
      }
    }
    return this.types;
  }
}

const DEFAULT_TYPES = new TypeFactory().types;

module.exports = { TypeFactory, DEFAULT_TYPES };
