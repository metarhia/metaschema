'use strict';

class Enum {
  constructor(values) {
    this.values = values;
  }
}

class Decorator {
  constructor(def) {
    Object.assign(this, def);
  }
}

class Many extends Decorator {}
class Parent extends Decorator {}
class Master extends Decorator {}
class Include extends Decorator {}
class Dictionary extends Decorator {}

class Index {
  constructor(fields) {
    this.fields = fields;
  }
}

class Unique extends Index {}

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
