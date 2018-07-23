'use strict';

const enumArray = values => class Enum {
  constructor(val) {
    this.value = Enum.key(val);
  }
  static get collection() {
    return values;
  }
  static has(val) {
    return values.includes(val);
  }
  static key(val) {
    return values.includes(val) ? val : undefined;
  }
  [Symbol.toPrimitive]() {
    return this.value;
  }
};

const enumCollection = values => {
  const index = {};
  for (const key in values) {
    const value = values[key];
    index[value] = key;
  }
  return class Enum {
    constructor(val) {
      this.value = Enum.key(val);
    }
    static get collection() {
      return values;
    }
    static has(val) {
      return !!(values[val] || index[val]);
    }
    static key(val) {
      const value = values[val];
      return value ? val : index[val];
    }
    [Symbol.toPrimitive](hint) {
      const value = this.value;
      if (hint === 'number') return parseInt(value, 10);
      return values[value];
    }
  };
};

const Enum = (...args) => {
  const item = args[0];
  const itemType = typeof(item);
  if (itemType === 'object') return enumCollection(item);
  if (itemType !== 'string') return enumArray(args);
  return enumCollection(Object.assign({}, args));
};

const Dictionary = def => class Dictionary {
  constructor() {
  }
  static get definition() {
    return def;
  }
};

const Log = def => class Log {
  constructor() {
  }
  static get definition() {
    return def;
  }
};

const List = def => class List {
  constructor() {
  }
  static get definition() {
    return def;
  }
};

const Many = def => class Many {
  constructor() {
  }
  static get definition() {
    return def;
  }
};

const Include = def => class Include {
  constructor() {
  }
  static get definition() {
    return def;
  }
};

const Validate = def => class Validate {
  constructor() {
  }
  static get definition() {
    return def;
  }
};

module.exports = {
  Enum, Dictionary, List, Many, Log, Include, Validate
};
