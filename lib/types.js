'use strict';

const { AbstractType } = require('./prototypes/abstract.js');
const scalars = require('./prototypes/scalars.js');
const collections = require('./prototypes/collections.js');
const { reference } = require('./prototypes/reference.js');
const { schema } = require('./prototypes/schema.js');
const { tuple } = require('./prototypes/tuple.js');

const prototypes = {
  ...scalars,
  ...collections,
  reference,
  many: reference,
  one: reference,
  schema,
  tuple,
};

const typeFactory = (prototype) => {
  class Type extends AbstractType {
    static metadata = {};
    static assign(key, value) {
      this.metadata[key] = value;
    }
    constructor(def, preprocessor, root) {
      super(root);
      this.from(def, preprocessor);
    }
  }
  const { rules } = prototype;
  if (rules) Type.setRules(rules);
  Object.assign(Type.prototype, prototype);
  return Type;
};

const make = (target = {}) => {
  for (const [name, proto] of Object.entries(prototypes)) {
    if (target[name]) continue;
    target[name] = typeFactory(proto);
  }
  return target;
};

const prepareTypes = (customTypes) => {
  const res = {};
  for (const [name, custom] of Object.entries(customTypes)) {
    if (typeof custom === 'string') {
      if (!prototypes[name]) {
        throw new TypeError(`Type ${name} does not exist`);
      }
      res[name] = typeFactory(prototypes[name]);
      res[name].assign('pg', custom);
      continue;
    }
    const { js, pg } = custom;
    const proto = js ? prototypes[js] : custom;
    res[name] = typeFactory(proto);
    res[name].assign('pg', pg);
  }
  return make(res);
};

const DEFAULT = make();

module.exports = { DEFAULT, prepareTypes };
