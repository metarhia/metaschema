'use strict';

const path = require('path');
const metasync = require('metasync');
const common = require('@metarhia/common');
const fs = require('fs');

const { createAndProcess } = require('./schema');
const { processSchema } = require('./schema-loader');

const moduleDir = path.dirname(__dirname);
const schemasDir = path.join(moduleDir, 'schemas');
const domainsPath = path.join(schemasDir, 'metaschema', 'default.domains');

const supportedFileExtensions = new Set([
  'category',
  'domains',
  'view',
  'form',
  'display',
  'action',
  'res',
]);

// Load schema file from the filesystem
//   filepath - <string> full path to the schema file
//   context - <Object> object to be assigned to global during loading
//   callback - <Function> to report the result
//     error - <Error> | <null>
//     name - <string> schema name
//     type - <string> schema type
//     schema - <Object> parsed schema
//     source - <string> schema source
const loadSchema = (filepath, context, callback) => {
  fs.readFile(filepath, (err, source) => {
    if (err) {
      callback(err);
      return;
    }
    const ext = path.extname(filepath);
    const name = path.basename(filepath, ext);
    let exports;
    try {
      exports = processSchema(name, source, context);
    } catch (e) {
      callback(e);
      return;
    }
    callback(null, name, common.fileExt(filepath), exports, source);
  });
};

const getSortOrder = file => {
  if (!file.includes('.')) {
    return 0;
  }
  if (file.endsWith('.category')) {
    return 1;
  }
  return 2;
};

const sorter = (a, b) => getSortOrder(b) - getSortOrder(a);

const loadModuleSchema = (filepath, context, dirName, callback) => {
  loadSchema(filepath, context, (error, name, type, definition, source) => {
    if (error) {
      callback(error);
      return;
    }

    const schemas = [];
    const obj = { name, definition };

    if (type !== 'domains' && type !== 'category') {
      let [category, entity] = name.split('.');
      if (!entity) {
        entity = category;
        category = dirName;
      }
      obj.name = entity;
      obj.category = category;
      if (type === 'view' && !definition.Base) {
        definition.Base = obj.category;
      }
    }

    schemas.push([type, obj]);
    const sourceObj = {
      path: filepath,
      source: source.toString(),
      type,
      ...obj,
    };
    delete sourceObj.definition;
    obj.source = sourceObj;
    callback(null, schemas);
  });
};

// Load schemas from directory
//   dir - <string> | <null> directory to load schemas from
//   context - <Object> object to be assigned to global during loading
//   isRoot - <boolean>
//   callback - <Function>
//     error - <Error>
//     schemas - <Array[]>
//       type - <string>
//       schema - <Object>
const load = (dir, context, isRoot, callback) => {
  const schemas = [];
  fs.readdir(dir, (error, files) => {
    if (error) {
      callback(error);
      return;
    }

    metasync.each(
      files.sort(sorter),
      (fileName, callback) => {
        const filePath = path.join(dir, fileName);

        fs.stat(filePath, (error, stats) => {
          if (error) {
            callback(error);
            return;
          }

          const cb = (error, schema) => {
            if (error) {
              callback(error);
            } else {
              schemas.push(...schema);
              callback(null, schemas);
            }
          };

          if (stats.isDirectory()) {
            load(filePath, context, false, cb);
          } else if (supportedFileExtensions.has(common.fileExt(filePath))) {
            const moduleName = isRoot ? null : path.basename(dir);
            loadModuleSchema(filePath, context, moduleName, cb);
          } else {
            cb(null, []);
          }
        });
      },
      error => {
        callback(error, schemas);
      }
    );
  });
};

// Load schemas from directory and create Metaschema
//   dir - <string> | <string[]> | <null> directory(ies) to load schemas from
//   context - <Object> object to be assigned to global during loading
//   callback - <Function>
//     error - <Error>
//     metaschema - <Metaschema>
const loadAndCreate = (dir, context, callback) => {
  const schemas = [];
  const fillSchemasWith = schemasArray => schemas.push(...schemasArray);

  const trimFilePaths = (dir, schemas) => {
    common
      .iter(schemas)
      .filter(([, schema]) => schema.source && schema.source.path)
      .each(([, schema]) => {
        schema.source.path = path.relative(
          path.resolve(dir, '..'),
          schema.source.path
        );
      });
  };

  const finish = err => {
    if (err) {
      callback(err);
      return;
    }

    loadModuleSchema(domainsPath, context, schemasDir, (err, arr) => {
      if (err) {
        callback(err);
      } else {
        trimFilePaths(moduleDir, arr);
        fillSchemasWith(arr);
        callback(...createAndProcess(schemas));
      }
    });
  };

  if (Array.isArray(dir)) {
    metasync.each(
      dir,
      (d, cb) => {
        load(d, context, true, (err, arr) => {
          fillSchemasWith(arr);
          trimFilePaths(d, arr);
          cb(err);
        });
      },
      finish
    );
  } else {
    load(dir, context, true, (err, arr) => {
      fillSchemasWith(arr);
      trimFilePaths(dir, arr);
      finish(err);
    });
  }
};

module.exports = {
  loadSchema,
  load,
  loadAndCreate,
};
