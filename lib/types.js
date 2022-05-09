'use strict';

const { AbstractType } = require('./prototypes/abstract.js');
const scalars = require('./prototypes/scalars.js');
const collections = require('./prototypes/collections.js');
const reference = require('./prototypes/reference.js');
const schema = require('./prototypes/schema.js');

const prototypes = {
  ...scalars,
  ...collections,
  ...reference,
  ...schema,
};

const construct = (prototype) => {
  class Type {
    constructor(def, preprocessor) {
      this.init();
      this.from(def, preprocessor);
    }
  }
  Object.assign(Type.prototype, AbstractType, prototype);
  return Type;
};

const make = (target = {}) => {
  for (const [name, proto] of Object.entries(prototypes)) {
    if (target[name]) continue;
    target[name] = construct(proto);
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
      res[name] = construct({ ...prototypes[name], pg: custom });
      continue;
    }
    const { js, pg } = custom;
    const proto = js ? { ...prototypes[js], pg } : custom;
    res[name] = construct(proto);
  }
  return make(res);
};

const DEFAULT = make();

module.exports = { DEFAULT, prepareTypes };
