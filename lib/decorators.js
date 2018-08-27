'use strict';

// Field decorators

class ValuesDecorator {
  constructor(values) {
    this.values = values;
  }
}

class Enum extends ValuesDecorator {}
class Bitmask extends ValuesDecorator {}

class Decorator {
  constructor(def) {
    Object.assign(this, def);
  }
}

class RelationDecorator extends Decorator {
  constructor(def) {
    if (typeof def === 'string') {
      def = { category: def };
    }
    super(def);
  }
}

class Many extends RelationDecorator {}
class Master extends RelationDecorator {
  constructor(def) {
    if (typeof def === 'string') {
      def = { category: def, required: true };
    }
    super(def);
  }
}
class Include extends RelationDecorator {}

// Index decorators

class Index {
  constructor(fields) {
    this.fields = fields;
  }
}

class Unique extends Index {}

// Validation function decorator

class Validate {}

// Entity decorators

class Registry extends Decorator {}
class Dictionary extends Decorator {}
class System extends Decorator {}
class Log extends Decorator {}
class Local extends Decorator {}
class History extends Decorator {}
class View extends Decorator {}

module.exports = {
  entity: {
    // Entity decorators
    Registry: def => new Registry(def),
    Dictionary: def => new Dictionary(def),
    System: def => new System(def),
    Log: def => new Log(def),
    Local: def => new Local(def),
    History: def => new History(def),
    View: def => new View(def)
  },
  attribute: {
    // Field decorators
    // Data types
    Enum: (...values) => new Enum(values),
    Bitmask: (...values) => new Bitmask(values),
    // Relations
    Many: def => new Many(def),
    Master: def => new Master(def),
    Include: def => new Include(def),
    // Index decorators
    Index: (...fields) => new Index(fields),
    Unique: (...fields) => new Unique(fields),
    // Validation function decorator
    Validate: fn => Object.setPrototypeOf(fn, Validate)
  }
};
