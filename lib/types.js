'use strict';

const { AbstractType } = require('./prototypes/abstract.js');
const scalars = require('./prototypes/scalars.js');
const collections = require('./prototypes/collections.js');
const { reference } = require('./prototypes/reference.js');
const { schema } = require('./prototypes/schema.js');
const { tuple } = require('./prototypes/tuple.js');
const { json } = require('./prototypes/json.js');

const PROTOTYPES = {
  ...scalars,
  ...collections,
  reference,
  many: reference,
  one: reference,
  schema,
  tuple,
  json,
};

const createType = (name, prototype) => {
  class Type extends AbstractType {
    static metadata = {};
    static type = name;
    static kind = prototype.kind;

    static assign(key, value) {
      this.metadata[key] = value;
    }

    constructor(def, preprocessor) {
      super(def, preprocessor);
      const { type } = this;
      this.type = type;
    }
  }
  const { rules } = prototype;
  if (rules) Type.setRules(rules);
  Object.assign(Type.prototype, prototype, { type: name });
  return Type;
};

const TYPES = ((types = {}) => {
  for (const [name, proto] of Object.entries(PROTOTYPES)) {
    types[name] = createType(name, proto);
  }
  return types;
})();

const updateTypeMetadata = (Type, metadata = {}) => {
  for (const [key, value] of Object.entries(metadata)) {
    Type.assign(key, value);
  }
};

const checkCustomType = (proto) => {
  if (!proto) {
    throw new Error(
      'Custom type must be an object with methods "construct" and "checkType"',
    );
  }
  const { checkType, construct } = proto;
  if (!checkType || !construct) {
    throw new Error(
      'Custom type must contain "construct" and "checkType" methods',
    );
  }
  if (typeof checkType !== 'function' || typeof construct !== 'function') {
    throw new Error('"construct" and "checkType" must be functions');
  }
};

const typeFactory = (customTypes) => {
  const types = { ...TYPES };
  for (const [name, value] of Object.entries(customTypes)) {
    const { js, metadata, ...rest } = value;
    let Type = types[name];
    if (Type) {
      updateTypeMetadata(Type, metadata);
      continue;
    }
    const proto = PROTOTYPES[js] || rest;
    checkCustomType(proto);
    Type = createType(name, proto);
    updateTypeMetadata(Type, metadata);
    types[name] = Type;
  }
  return types;
};

module.exports = { typeFactory, TYPES };
