'use strict';

const { formatters, checks } = require('./util.js');
const { AbstractType } = require('./prototypes/abstract.js');
const scalars = require('./prototypes/scalars.js');
const collections = require('./prototypes/collections.js');
const { reference } = require('./prototypes/reference.js');
const { schema } = require('./prototypes/schema.js');

const prototypes = {
  ...scalars,
  ...collections,
  reference,
  many: reference,
  one: reference,
  schema,
};

const rulesFrom = (prototype) => {
  const { rules } = prototype;
  if (!rules) return null;
  const result = { checks: {}, formatters: {} };
  for (const rule of rules) {
    if (formatters[rule]) result.formatters[rule] = formatters[rule];
    if (checks[rule]) result.checks[rule] = checks[rule];
  }
  return result;
};

const construct = (prototype) => {
  class Type {
    constructor(def, preprocessor) {
      this.init();
      this.from(def, preprocessor);
    }
  }
  Object.assign(Type.prototype, AbstractType, prototype, rulesFrom(prototype));
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
