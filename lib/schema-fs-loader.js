'use strict';

const path = require('path');
const metasync = require('metasync');
const common = require('@metarhia/common');
const fs = require('fs');

const { create } = require('./schema');
const { processSchema } = require('./schema-loader');
const { extractDecorator } = require('./schema-utils');

const moduleDir = path.dirname(__dirname);
const schemasDir = path.join(moduleDir, 'schemas');
const domainsPath = path.join(schemasDir, 'metaschema', 'default.domains');

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

    if (type === 'category') {
      Object.entries(definition).forEach(([key, value]) => {
        const decorator = extractDecorator(value);
        if (decorator === 'Action') {
          delete definition[key];
          schemas.push([
            'action',
            {
              name: key,
              category: name,
              definition: value,
            },
          ]);
        } else if (decorator === 'Hierarchy' && !value.category) {
          value.category = name;
        }
      });
    } else if (type !== 'domains') {
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
    schemas.push(['source', { path: filepath, source }]);
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
          } else {
            const moduleName = isRoot ? null : path.basename(dir);
            loadModuleSchema(filePath, context, moduleName, cb);
          }
        });
      },
      error => {
        callback(error, schemas);
      }
    );
  });
};

const typeToPlural = {
  category: 'categories',
  domains: 'domains',
  view: 'views',
  form: 'forms',
  action: 'actions',
  display: 'displayModes',
  source: 'sources',
};

// Load schemas from directory and create Metaschema
//   dir - <string> | <string[]> | <null> directory(ies) to load schemas from
//   context - <Object> object to be assigned to global during loading
//   callback - <Function>
//     error - <Error>
//     metaschema - <Metaschema>
const loadAndCreate = (dir, context, callback) => {
  const schemas = {
    categories: [],
    domains: [],
    views: [],
    forms: [],
    actions: [],
    displayModes: [],
    sources: [],
  };

  const fillSchemasWith = schemasArray =>
    schemasArray.forEach(([type, schema]) => {
      schemas[typeToPlural[type]].push(schema);
    });

  const finish = err => {
    if (err) {
      callback(err);
      return;
    }

    loadModuleSchema(domainsPath, context, schemasDir, (err, arr) => {
      if (err) {
        callback(err);
      } else {
        fillSchemasWith(arr);
        callback(...create(schemas));
      }
    });
  };

  if (Array.isArray(dir)) {
    metasync.each(
      dir,
      (d, cb) => {
        load(d, context, true, (err, arr) => {
          fillSchemasWith(arr);
          cb(err);
        });
      },
      finish
    );
  } else {
    load(dir, context, true, (err, arr) => {
      fillSchemasWith(arr);
      finish(err);
    });
  }
};

module.exports = {
  loadSchema,
  load,
  loadAndCreate,
};
