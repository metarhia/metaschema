'use strict';

const path = require('path');
const metasync = require('metasync');
const common = require('@metarhia/common');
const fs = require('fs');

const { createAndProcess } = require('./schema');
const { processSchema } = require('./schema-loader');

const { SchemaValidationError, MetaschemaError } = require('./schema-errors');

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
      callback([error]);
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
    callback([], schemas);
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
const load = (dir, context, { isRoot = false, names }, callback) => {
  const schemas = [];
  const errors = [];
  fs.readdir(dir, (error, files) => {
    if (error) {
      callback([error]);
      return;
    }

    metasync.each(
      files.sort(sorter),
      (fileName, callback) => {
        const filePath = path.join(dir, fileName);

        fs.stat(filePath, (error, stats) => {
          if (error) {
            errors.push(error);
            callback(null);
            return;
          }

          const cb = (errs, schema) => {
            if (errs.length) {
              errors.push(...errs);
            } else {
              schemas.push(...schema);
            }
            callback(null);
          };

          const name = path.basename(fileName, path.extname(fileName));
          const existing = names.get(name);
          if (existing) {
            if (dir !== existing) {
              errors.push(
                new SchemaValidationError('duplicateModule', filePath, null, {
                  path: existing,
                })
              );
            }
          } else {
            names.set(name, filePath);
          }

          if (stats.isDirectory()) {
            load(filePath, context, { names }, cb);
          } else if (supportedFileExtensions.has(common.fileExt(filePath))) {
            const moduleName = isRoot ? null : path.basename(dir);
            loadModuleSchema(filePath, context, moduleName, cb);
          } else {
            cb([], []);
          }
        });
      },
      () => {
        callback(errors, schemas);
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
  const errors = [];

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

  const process = (errs, schemasArr, dir) => {
    errors.push(...errs);
    trimFilePaths(dir, schemasArr);
    schemas.push(...schemasArr);
  };

  const finish = () => {
    loadModuleSchema(domainsPath, context, schemasDir, (err, arr) => {
      process(err, arr, moduleDir);
      if (errors.length) {
        callback(new MetaschemaError(errors));
      } else {
        callback(...createAndProcess(schemas));
      }
    });
  };

  const loadOptions = { isRoot: true, names: new Map() };

  if (Array.isArray(dir)) {
    metasync.each(
      dir,
      (d, cb) => {
        load(d, context, loadOptions, (err, arr) => {
          process(err, arr, d);
          cb(null);
        });
      },
      finish
    );
  } else {
    load(dir, context, loadOptions, (err, arr) => {
      process(err, arr, dir);
      finish();
    });
  }
};

module.exports = {
  loadSchema,
  load,
  loadAndCreate,
};
