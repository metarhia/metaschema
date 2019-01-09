'use strict';

const path = require('path');
const vm = require('vm');
const metasync = require('metasync');
const fs = require('fs');

const { create } = require('./schema');
const { all: decorators } = require('./decorators');

const SCRIPT_TIMEOUT = 2000;

const moduleDir = path.dirname(__dirname);
const schemasDir = path.join(moduleDir, 'schemas');
const domainsPath = path.join(schemasDir, 'metaschema', 'domains.schema');

const processSchemaFile = (filename, decorators, source, context = {}) => {
  const sandbox = { ...context, ...decorators };
  sandbox.global = sandbox;
  const code = `'use strict';\n(${source})`;
  const options = {
    filename,
    timeout: SCRIPT_TIMEOUT,
    lineOffset: 1,
  };
  return vm.runInNewContext(code, sandbox, options);
};

// Load schema file from the filesystem
//   filepath - <string> full path to the schema file
//   context - <Object> object to be assigned to global during loading
//   callback - <Function> to report the result
//     error - <Error> | <null>
//     name - <string> schema name
//     schema - <Object> parsed schema
//     source - <string> schema source
const loadSchema = (filepath, context, callback) => {
  fs.readFile(filepath, (err, source) => {
    if (err) {
      callback(err);
      return;
    }
    const name = path.basename(filepath, '.schema');
    let exports;
    try {
      exports = processSchemaFile(filepath, decorators, source, context);
    } catch (e) {
      callback(e);
      return;
    }
    callback(null, name, exports, source);
  });
};

const loadFiles = (files, context, callback) => {
  const schemas = [];
  files.unshift(domainsPath);
  metasync.each(files, (filepath, callback) => {
    loadSchema(filepath, context, (err, name, schema, source) => {
      if (err) {
        callback(err);
        return;
      }
      schemas.push([name, schema, source]);
      callback(null);
    });
  }, err => {
    if (err) callback(err);
    else callback(null, schemas);
  });
};

// Load schemas from directory
//   dir - <string> | <null> directory to load schemas from
//   context - <Object> object to be assigned to global during loading
//   callback - <Function>
//     error - <Error>
//     schemas - <Object[]>
const load = (dir, context, callback) => {
  if (!dir || typeof dir !== 'string') {
    loadFiles([], context, callback);
    return;
  }
  if (!dir.includes(path.sep)) dir = path.join(schemasDir, dir);
  fs.readdir(dir, (err, files) => {
    if (err) {
      callback(err);
      return;
    }
    files = files.map(file => path.join(dir, file));
    loadFiles(files, context, callback);
  });
};

// Load schemas from directory and create Metaschema
//   dir - <string> | <string[]> | <null> directory(ies) to load schemas from
//   context - <Object> object to be assigned to global during loading
//   callback - <Function>
//     error - <Error>
//     metaschema - <Metaschema>
const loadAndCreate = (dir, context, callback) => {
  if (Array.isArray(dir)) {
    metasync.map(dir,
      (d, cb) => { load(d, context, cb); },
      (err, schemas) => {
        if (err) callback(err);
        else callback(...create([].concat(...schemas)));
      }
    );
  } else {
    load(dir, context, (err, schemas) => {
      if (err) callback(err);
      else callback(...create(schemas));
    });
  }
};

module.exports = {
  loadSchema,
  load,
  loadAndCreate,
};
