'use strict';

class Enum {
  constructor(values) {
    this.values = values;
  }
}

class Many {
  constructor(def) {
    Object.assign(this, def);
  }
}

class Parent {
  constructor(def) {
    Object.assign(this, def);
  }
}

class Master {
  constructor(def) {
    Object.assign(this, def);
  }
}

class Include {
  constructor(def) {
    Object.assign(this, def);
  }
}

class Dictionary {
  constructor(def) {
    Object.assign(this, def);
  }
}

class Index {
  constructor(fields) {
    this.fields = fields;
  }
}

class Unique {
  constructor(fields) {
    this.fields = fields;
  }
}

class Validate {}

module.exports = {
  Enum: (...values) => new Enum(values),
  // field decorators
  Many: def => new Many(def),
  Parent: def => new Parent(def),
  Master: def => new Master(def),
  Include: def => new Include(def),
  // category decorators
  Dictionary: def => new Dictionary(def),
  // index decorators
  Index: (...values) => new Index(values),
  Unique: (...fields) => new Unique(fields),
  // validation function decorator
  Validate: fn => Object.setPrototypeOf(fn, Validate)
};
