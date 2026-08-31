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

const CUSTOM_TYPE_HINT =
  'Custom type must be an object with methods "construct" and "checkType"';
const MISSING_METHODS =
  'Custom type must contain "construct" and "checkType" methods';
const NOT_FUNCTIONS = '"construct" and "checkType" must be functions';

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

const createTypes = (prototypes) => {
  const types = Object.create(null);
  for (const pair of Object.entries(prototypes)) {
    const name = pair[0];
    const proto = pair[1];
    types[name] = createType(name, proto);
  }
  return types;
};

const TYPES = createTypes(PROTOTYPES);

const updateTypeMetadata = (Type, metadata = {}) => {
  for (const pair of Object.entries(metadata)) {
    const key = pair[0];
    const value = pair[1];
    Type.assign(key, value);
  }
};

const checkCustomType = (proto) => {
  if (!proto) throw new Error(CUSTOM_TYPE_HINT);
  const { checkType, construct } = proto;
  if (!checkType || !construct) throw new Error(MISSING_METHODS);
  const checkIsFn = typeof checkType === 'function';
  const constructIsFn = typeof construct === 'function';
  if (!checkIsFn || !constructIsFn) throw new Error(NOT_FUNCTIONS);
};

const typeFactory = (customTypes) => {
  for (const pair of Object.entries(customTypes)) {
    const name = pair[0];
    const value = pair[1];
    const { js, metadata, ...rest } = value;
    let Type = TYPES[name];
    if (Type) {
      updateTypeMetadata(Type, metadata);
      continue;
    }
    const proto = PROTOTYPES[js] || rest;
    checkCustomType(proto);
    Type = createType(name, proto);
    updateTypeMetadata(Type, metadata);
    TYPES[name] = Type;
  }
  return TYPES;
};

module.exports = { TYPES, typeFactory };
