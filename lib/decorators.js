'use strict';

// Field decorators

class ValuesDecorator {
  constructor(values) {
    this.values = values;
  }
}

class Enum extends ValuesDecorator {}
const createEnum = (...values) => new Enum(values);

class Flags extends ValuesDecorator {
  constructor(values, enumDomain) {
    super(values);
    this.enum = enumDomain;
  }
}

const createFlags = (...values) => new Flags(values);
createFlags.of = enumDomain => new Flags(null, enumDomain);

class CategoryDecorator {
  constructor(category) {
    this.category = category;
  }
}

class List extends CategoryDecorator {}
const createList = category => new List(category);

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
class Include extends RelationDecorator {
  constructor(def) {
    if (typeof def === 'string') {
      def = { category: def, required: true };
    } else {
      def.required = true;
    }
    super(def);
  }
}

class Hierarchy extends RelationDecorator {
  constructor(def) {
    def.index = true;
    super(def);
  }
}

class Catalog extends Hierarchy {
  constructor(def) {
    if (!def.category) {
      def.category = 'Catalog';
    }
    def.required = true;
    super(def);
  }
}

class Subdivision extends Hierarchy {
  constructor(def) {
    if (!def.category) {
      def.category = 'Subdivision';
    }
    def.required = true;
    super(def);
  }
}

// Index decorators

class Index {
  constructor(fields) {
    this.fields = fields;
  }
}

class Unique extends Index {}

// Function decorators

class Validate {}

class Execute {
  constructor(def) {
    if (typeof def === 'string') {
      this.Action = def;
    } else {
      Object.assign(this, def);
    }
  }
}

class Action {
  constructor(def) {
    if (typeof def === 'function') {
      this.Execute = def;
    } else {
      Object.assign(this, def);
    }
    if (!this.Args) this.Args = {};
    if (!this.Returns) this.Returns = {};
    if (!this.TransactionMode) this.TransactionMode = 'All';
    if (!this.ProcessMode) this.ProcessMode = 'Any';
    if (!this.RefreshMode) this.RefreshMode = 'Current';
  }
}

// Entity decorators

class Registry extends Decorator {}
class Dictionary extends Decorator {}
class System extends Decorator {}
class Log extends Decorator {}
class Local extends Decorator {}
class Table extends Decorator {
  constructor(def, config) {
    super(def);
    Object.assign(this, config);
  }
}
class History extends Decorator {}

// Not materialized entity decorators

class View extends Decorator {}
class Memory extends Decorator {}
class Arguments extends Decorator {}
class Form extends Decorator {
  constructor(def) {
    super(def);
    if (!this.Fields) {
      this.Fields = {};
    }
  }
}

class DisplayMode extends Decorator {}

// Form layout decorators

class LayoutDecorator {
  constructor(name, config = {}) {
    Object.assign(this, { ...config, name });
  }
}

class Group extends LayoutDecorator {
  constructor(name, config, children) {
    super(name, config);
    this.children = children;
  }
}

class Input extends LayoutDecorator {}
class Label extends LayoutDecorator {}

const decorators = {
  entity: {
    // Entity decorators
    Registry: def => new Registry(def),
    Dictionary: def => new Dictionary(def),
    System: def => new System(def),
    Log: def => new Log(def),
    Local: def => new Local(def),
    Table: (def, config) => new Table(def, config),
    History: def => new History(def),
    View: def => new View(def),
    Memory: def => new Memory(def),
    Form: def => new Form(def),
    DisplayMode: def => new DisplayMode(def),
    Arguments: def => new Arguments(def),
    Group: (name, config, ...children) => new Group(name, config, children),
    Input: (name, config = {}) => new Input(name, config),
    Label: (name, config = {}) => new Label(name, config),
  },
  attribute: {
    // Field decorators
    // Data types
    Enum: createEnum,
    Flags: createFlags,
    List: createList,
    // Relations
    Many: def => new Many(def),
    Master: def => new Master(def),
    Include: def => new Include(def),
    Hierarchy: (def = {}) => new Hierarchy(def),
    Catalog: (def = {}) => new Catalog(def),
    Subdivision: (def = {}) => new Subdivision(def),
    // Index decorators
    Index: (...fields) => new Index(fields),
    Unique: (...fields) => new Unique(fields),
    // Function decorators
    Validate: fn => Object.setPrototypeOf(fn, Validate),
    Execute: def => new Execute(def),
    Action: def => new Action(def),
  },
};

decorators.all = { ...decorators.entity, ...decorators.attribute };

module.exports = decorators;
