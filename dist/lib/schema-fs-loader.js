'use strict';

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

var path = require('path');

var vm = require('vm');

var metasync = require('metasync');

var fs = require('fs');

var _require = require('./schema'),
    create = _require.create;

var _require2 = require('./decorators'),
    decorators = _require2.all;

var SCRIPT_TIMEOUT = 2000;
var moduleDir = path.dirname(__dirname);
var schemasDir = path.join(moduleDir, 'schemas');
var domainsPath = path.join(schemasDir, 'metaschema', 'domains.schema');

var processSchemaFile = function processSchemaFile(filename, decorators, source) {
  var api = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
  var sandbox = Object.assign({}, decorators, {
    api: api
  });
  sandbox.global = sandbox;
  var code = "'use strict';\n(".concat(source, ")");
  var options = {
    filename: filename,
    timeout: SCRIPT_TIMEOUT,
    lineOffset: 1
  };
  return vm.runInNewContext(code, sandbox, options);
}; // Load schema file from the filesystem
//   filepath - <string> full path to the schema file
//   api - <Object> object to be passed as 'api' during loading
//   callback - <Function> to report the result
//     error - <Error> | <null>
//     name - <string> schema name
//     schema - <Object> parsed schema
//     source - <string> schema source


var loadSchema = function loadSchema(filepath, api, callback) {
  fs.readFile(filepath, function (err, source) {
    if (err) {
      callback(err);
      return;
    }

    var name = path.basename(filepath, '.schema');
    var exports;

    try {
      exports = processSchemaFile(filepath, decorators, source, api);
    } catch (e) {
      callback(e);
      return;
    }

    callback(null, name, exports, source);
  });
};

var loadFiles = function loadFiles(files, api, callback) {
  var schemas = [];
  files.unshift(domainsPath);
  metasync.each(files, function (filepath, callback) {
    loadSchema(filepath, api, function (err, name, schema, source) {
      if (err) {
        callback(err);
        return;
      }

      schemas.push([name, schema, source]);
      callback(null);
    });
  }, function (err) {
    if (err) callback(err);else callback(null, schemas);
  });
}; // Load schemas from directory
//   dir - <string> | <null> directory to load schemas from
//   api - <Object> object to be passed as 'api' during loading
//   callback - <Function>
//     error - <Error>
//     schemas - <Object[]>


var load = function load(dir, api, callback) {
  if (!dir || typeof dir !== 'string') {
    loadFiles([], api, callback);
    return;
  }

  if (!dir.includes(path.sep)) dir = path.join(schemasDir, dir);
  fs.readdir(dir, function (err, files) {
    if (err) {
      callback(err);
      return;
    }

    files = files.map(function (file) {
      return path.join(dir, file);
    });
    loadFiles(files, api, callback);
  });
}; // Load schemas from directory and create Metaschema
//   dir - <string> | <string[]> | <null> directory(ies) to load schemas from
//   api - <Object> object to be passed as 'api' during loading
//   callback - <Function>
//     error - <Error>
//     metaschema - <Metaschema>


var loadAndCreate = function loadAndCreate(dir, api, callback) {
  if (Array.isArray(dir)) {
    metasync.map(dir, function (d, cb) {
      load(d, api, cb);
    }, function (err, schemas) {
      var _ref;

      if (err) callback(err);else callback.apply(void 0, _toConsumableArray(create((_ref = []).concat.apply(_ref, _toConsumableArray(schemas)))));
    });
  } else {
    load(dir, api, function (err, schemas) {
      if (err) callback(err);else callback.apply(void 0, _toConsumableArray(create(schemas)));
    });
  }
};

module.exports = {
  loadSchema: loadSchema,
  load: load,
  loadAndCreate: loadAndCreate
};