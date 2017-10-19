'use strict';

const vm = require('vm');
const fs = require('fs');

const taxonomy = new Map();

const load = (
  fileName, // schema file
  callback // function, (error, data)
) => {
  try {
    const filePath = './taxonomy/' + fileName + '.schema';
    fs.readFile(filePath, (err, source) => {
      if (err) {
        callback(err);
        return;
      }

      const sandbox = {};
      sandbox.global = sandbox;
      const context = vm.createContext(sandbox);

      const code = '"use strict";\n(' + source + ')';
      const options = {
        filename: fileName,
        timeout: 1000,
      };
      const script = new vm.Script(code, options);
      const exports = script.runInContext(context, options);
      callback(null, exports);
    });
  } catch (err) {
    callback(err);
  }
};

const create = (
  name, // name, category schema
  obj // object, of category
  // Returns: instance
) => {
  const category = taxonomy.get(name);
  if (category && category.factory) {
    return category.factory(obj);
  }
  return null;
};

const min = (a, b) => (a < b ? a : b);

const assign = (obj, name, value, type) => {
  if (typeof(value) === type) {
    obj[name] = value;
  } else {
    value = create(type, value);
    if (value) obj[name] = value;
  }
};

const factorify = (name, definition) => {
  const properties = Object.keys(definition);
  const factory = (...args) => {
    console.log('Create ' + name);
    let instance = args[0];
    if (typeof(instance) !== 'object' || args.length > 1) {
      instance = args;
    }
    const obj = {};
    if (Array.isArray(instance)) {
      const len = min(properties.length, instance.length);
      for (let i = 0; i < len; i++) {
        const name = properties[i];
        const value = instance[i];
        const type = definition[name].type;
        assign(obj, name, value, type);
      }
    } else {
      const fields = Object.keys(instance);
      for (let i = 0; i < fields.length; i++) {
        const name = fields[i];
        if (properties.includes(name)) {
          const value = instance[name];
          const type = definition[name].type;
          assign(obj, name, value, type);
        }
      }
    }
    return obj;
  };
  return factory;
};

const build = (
  schema // object, schema
  // Returns: hash of prototypes
) => {
  const prototypes = {};
  for (const name in schema) {
    const definition = schema[name];
    const factory = factorify(name, definition);
    const item = { name, definition, factory };
    taxonomy.set(name, item);
    prototypes[name] = factory;
  }
  return (name, ...args) => prototypes[name](...args);
};

const guard = (
  args // object, function arguments
  // Returns: bool, success status
) => {
  //const stack = new Error('Just get stack').stack;
  //const functionName = guard.caller;
  //console.dir({ functionName });
  console.dir(args);
  return true;
};

load('types', (err, types) => {
  if (err) throw err;
  for (const name in types) {
    const definition = types[name];
    taxonomy.set(name, { name, definition });
  }
});

module.exports = {
  load,
  build,
  taxonomy,
  create,
  guard,
};
