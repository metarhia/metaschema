'use strict';

const util = require('util');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const common = require('@metarhia/common');

const { processSchema } = require('./schema-processor');
const { Metaschema } = require('./schema');

const flatten = arr => [].concat(...arr);

const readFile = util.promisify(fs.readFile);

const loadSchema = async (filePath, options, module) => {
  const source = (await readFile(filePath)).toString();

  const ext = path.extname(filePath);
  const name = path.basename(filePath, ext);

  const type = options.pathToType(filePath);

  const ctx = {
    context: options.context,
    decorators: options.decorators,
  };

  if (options.localDecorators && options.localDecorators[type]) {
    ctx.localDecorators = options.localDecorators[type];
  }

  const definition = processSchema(name, source, ctx, vm.runInNewContext);

  return [
    {
      type,
      module,
      name,
      definition,
      source,
    },
  ];
};

const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);

const loadModule = async (dir, options) => {
  const paths = await readdir(dir);

  const promises = paths.map(relPath => {
    const absPath = path.join(dir, relPath);
    return stat(absPath).then(stats => {
      if (stats.isDirectory()) {
        return loadModule(absPath, options);
      } else if (options.pathToType(relPath)) {
        const moduleName = path.basename(dir);
        return loadSchema(absPath, options, moduleName);
      } else {
        return [];
      }
    });
  });

  const results = await Promise.all(promises);
  return flatten(results);
};

// Creates Metaschema object and fills it with schemas
//   dir <string> | <string[]>
//   options <Object>
//     context <Object>
//     decorators <Object>
//     localDecorators <Object>, optional
//       [type] <Object> decorators specific for this schema type
//     pathToType <Object>
//       [ext] <string>
//     pathToType <Function>
//       path <string>
//     Returns: <string>
//     preprocessor: <Function>, optional
//       schemas <Schema[]>
//     Returns: <Schema[]>
//   config <Object>
//     prepare <Function>
//       ms <Metaschema>
//     resolve <Function>
//       ms <Metaschema>
//       path <string>
//       Returns: <Schema>
//     processors <Object>
//       [type] <Object>
//         preprocess <Function[]>, optional
//           schema <Schema>
//           Returns: <Error[]>
//         validateSchema <Function[]>, optional
//           schema <Schema>
//           Returns: <Error[]>
//         add <Function>
//           schema <Schema>
//           ms <Metaschema>
//           Returns: <Error[]>
//         postprocess <Function[]>, optional
//           schema <Schema>
//           ms <Metaschema>
//           Returns: <Error[]>
//         serialize <Function>, optional
//           schema <Schema>
//           ms <Metaschema>
//           Returns: <string>
//         validateInstance <Function>, optional
//           ms <Metaschema>
//           schema <Schema>
//           instance <any>
//           options <Object>
//           Returns: <Error[]>
//         creator <Function>, optional
//           ms <Metaschema>
//           schema <Schema>
//           args <any>
//           options <Object>
//           Returns: [<Error[]>, <any>]
//     processOrder: <Function> | <Object>, function is passed to
//         Array.prototype.sort (a: <Schema>, b: <Schema>) => <number>.
//         If <Object> is provided it would be used as
//         map from schema type (<string>) to order value (<number>),
//         types with lower values are processed earlier.
// Returns: <Metaschema>
const load = async (dir, options, config) => {
  if (!Array.isArray(dir)) {
    dir = [dir];
  }
  options = { ...options };
  const { pathToType } = options;
  if (typeof pathToType !== 'function') {
    options.pathToType = filepath => pathToType[common.fileExt(filepath)];
  }
  const results = await Promise.all(dir.map(dir => loadModule(dir, options)));
  const schemas = options.preprocessor
    ? options.preprocessor(flatten(results))
    : flatten(results);
  return Metaschema.create(schemas, config);
};

// Create a config to validate schemas according to the system schema
//   path <string> path to the system schema
//   systemConfig <Object>
//     options <Object>
//       decorators
//       localDecorators <Object>, optional
//         [type] <Object> decorators specific for this schema type
//       pathToType <Object>
//         [ext] <string>
//       pathToType <Function>
//         path <string>
//       Returns: <string>
//       loadOrder <Function>
//         a <string>
//         b <string>
//         Returns: <number>
//     config <Object>
//      prepare <Function>
//        ms <Metaschema>
//      resolve <Function>
//        ms <Metaschema>
//        path <string>
//        Returns: <Schema>
//      processors <Object>
//        [type] <Object>
//          add <Function>
//            schema <Schema>
//            ms <Metaschema>
//            Returns: <Error[]>
//          postprocess <Function>, optional
//            schema <Schema>
//            ms <Metaschema>
//            Returns: <Error[]>
//          validateInstance <Function>, optional
//            ms <Metaschema>
//            schema <Schema>
//            instance <any>
//            options <Object>
//            Returns: <Error[]>
//      processOrder: <Function> | <Object>, function is passed to
//          Array.prototype.sort (a: <Schema>, b: <Schema>) => <number>.
//          If <Object> is provided it would be used as
//          map from schema type (<string>) to order value (<number>),
//          types with lower values are processed earlier.
//   oldConfig <Object>
//     options <Object>
//       decorators
//       localDecorators <Object>, optional
//         [type] <Object> decorators specific for this schema type
//       pathToType <Object>
//         [ext] <string>
//       pathToType <Function>
//         path <string>
//       Returns: <string>
//       loadOrder <Function>
//         a <string>
//         b <string>
//         Returns: <number>
//     config <Object>
//      prepare <Function>
//        ms <Metaschema>
//      resolve <Function>
//        ms <Metaschema>
//        path <string>
//        Returns: <Schema>
//      processors <Object>
//        [type] <Object>
//          add <Function>
//            schema <Schema>
//            ms <Metaschema>
//            Returns: <Error[]>
//          postprocess <Function>, optional
//            schema <Schema>
//            ms <Metaschema>
//            Returns: <Error[]>
//          validateInstance <Function>, optional
//            ms <Metaschema>
//            schema <Schema>
//            instance <any>
//            options <Object>
//            Returns: <Error[]>
//      processOrder: <Function> | <Object>, function is passed to
//          Array.prototype.sort (a: <Schema>, b: <Schema>) => <number>.
//          If <Object> is provided it would be used as
//          map from schema type (<string>) to order value (<number>),
//          types with lower values are processed earlier.
// Returns: newConfig <Object>
const applySystemConfig = async (path, systemConfig, oldConfig) => {
  const newConfig = common.clone(oldConfig);
  const systemSchema = await load(
    path,
    systemConfig.options,
    systemConfig.config
  );
  Object.entries(newConfig.config.processors)
    .filter(([type]) => systemSchema.categories.has(type))
    .forEach(([type, processor]) => {
      processor.validateSchema = processor.validateSchema || [];
      processor.validateSchema.push(schema => {
        const def = schema.definition;
        const options = { path: `${schema.name}.` };
        const error = systemSchema.validate('category', type, def, options);
        return error ? error.errors : [];
      });
    });
  return newConfig;
};

module.exports = {
  load,
  applySystemConfig,
};
