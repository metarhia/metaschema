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
//   loadOptions <Object>
//     context
//     decorators
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
//         preprocess <Function>, optional
//           schema <Schema>
//           Returns: <Error[]>
//         validateSchema <Function>, optional
//           schema <Schema>
//           Returns: <Error[]>
//         add <Function>
//           schema <Schema>
//           ms <Metaschema>
//           Returns: <Error[]>
//         postprocess <Function>, optional
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
//         create <Function>, optional
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
// Returns: [<Error[]>, <Metaschema>]
const load = async (dir, options, config) => {
  if (!Array.isArray(dir)) {
    dir = [dir];
  }
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

module.exports = {
  load,
};
