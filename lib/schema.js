'use strict';

const vm = require('vm');
const fs = require('fs');
const { basename } = require('path');
const metasync = require('metasync');

const { parseSignature } = require('./introspection.js');
const decorators = require('./decorators.js');

const SCRIPT_TIMEOUT = 2000;

const domains = new Map();
const categories = new Map();

const structs = {};

const loadSchema = (
  // Load schema file
  fileName, // schema file
  callback // function, (error, data)
) => {
  fs.readFile(fileName, (err, source) => {
    if (err) {
      callback(err);
      return;
    }
    const sandbox = {};
    Object.assign(sandbox, structs);
    sandbox.global = sandbox;
    const context = vm.createContext(sandbox);
    const code = `'use strict';\n(${source})`;
    const options = {
      filename: fileName,
      timeout: SCRIPT_TIMEOUT,
    };
    let exports;
    try {
      const script = new vm.Script(code, options);
      exports = script.runInContext(context, options);
    } catch (e) {
      console.log(e);
      callback(e);
      return;
    }
    callback(null, exports);
  });
};

loadSchema('./taxonomy/domains.schema', (error, schema) => {
  for (const name in schema) {
    const domain = schema[name];
    domains.set(name, domain);
  }
});

const load = (
  // Load schemas
  path, // directory
  callback // function, (error, data)
) => {
  if (!path.includes('/')) path = './taxonomy/' + path;
  const schemas = {};
  fs.readdir(path, (err, files) => {
    if (err) {
      callback(err);
      return;
    }
    metasync.each(files, (file, callback) => {
      loadSchema(path + '/' + file, (err, schema) => {
        const name = basename(file, '.schema');
        schemas[name] = schema;
        callback();
      });
    }, (err) => {
      if (err) {
        callback(err);
        return;
      }
      callback(null, schemas);
    });
  });
};

const createInstance = (
  // Create category instance
  name, // string, type, domain or category name
  value // instance value, scalar or object
  // Returns: instance
) => {
  const category = categories.get(name);
  if (category && category.factory) {
    return category.factory(value);
  }
  const domain = domains.get(name);
  const type = typeof(value);
  const expected = domain ? domain.type : name;
  if (type === expected) return value;
  const data = `{ ${name}: ${JSON.stringify(value)} }`;
  console.log(new TypeError(`${data} expected to be ${expected}`).stack);
  return null;
};

const min = (a, b) => (a < b ? a : b);

const factorify = (
  // Create factory from category definition
  name, // string, category name
  definition // object, category definition
  // Returns: function, (...args) returns instance
) => {
  const properties = Object.keys(definition);
  const factory = (...args) => {
    let instance = args[0];
    if (args.length > 1) instance = args;
    const obj = {};
    let fields, i, len, field, value, def, type;
    const isArr = Array.isArray(instance);
    if (isArr) {
      len = min(properties.length, instance.length);
    } else {
      fields = Object.keys(instance)
        .filter(field => properties.includes(field));
      len = fields.length;
    }
    for (i = 0; i < len; i++) {
      if (isArr) {
        field = properties[i];
        value = instance[i];
      } else {
        field = fields[i];
        value = instance[field];
      }
      def = definition[field];
      if (typeof(def) === 'function') {
        value = def(value);
        obj[field] = value;
      } else {
        type = def.category || def.domain;
        value = createInstance(type, value);
        if (value) obj[field] = value;
      }
    }
    return obj;
  };
  categories.set(name, { name, definition, factory });
  return factory;
};

const build = (
  // Build schemas list (directory)
  schemas // object, key: schema
  // Returns: function
) => {
  const factories = {};
  let name, factory, definition;
  for (name in schemas) {
    definition = schemas[name];
    factory = factorify(name, definition);
    factories[name] = factory;
  }
  return (name, ...args) => factories[name](...args);
};

const guard = (
  // Function arguments guard
  fn, // function
  guards // hash
  // Returns: bool, success status
) => {
  const sig = parseSignature(fn);
  sig.parameters.forEach(par => {
    const value = guards[par.name];
    const arg = createInstance(par.type, value);
    console.dir({ arg });
  });
  return true;
};

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

Object.assign(structs, decorators, {
  // structure decorators
  Enum: (...args) => {
    const item = args[0];
    const itemType = typeof(item);
    if (itemType === 'object') return enumCollection(item);
    if (itemType !== 'string') return enumArray(args);
    return enumCollection(Object.assign({}, args));
  },
  List: category => items => items.map(
    item => createInstance(category, item)
  ),
});

module.exports = {
  load,
  loadSchema,
  build,
  domains,
  categories,
  createInstance,
  guard,
};
