'use strict';

const vm = require('vm');
const fs = require('fs');

const taxonomy = new Map();

const loadSchema = (
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

const buildPrototype = (name, definition) => {
  const proto = new Function(name);
  for (const name in definition) {
    const fieldDef = definition[name];
    console.dir({ name, fieldDef });
  }
  return proto;
};

const buildSchema = (
  schema // object, schema
  // Returns: hash of prototypes
) => {
  for (const name in schema) {
    console.log('Build prototype: ' + name);
    const definition = schema[name];
    const proto = buildPrototype(name, definition);
    const item = { name, definition, proto };
    console.dir(item);
    taxonomy.set(name, item);
  }
};

loadSchema('types', (err, types) => {
  if (err) throw err;
  for (const name in types) {
    const definition = types[name];
    taxonomy.set(name, { name, definition });
  }
});

module.exports = {
  loadSchema,
  buildSchema,
  taxonomy,
};
