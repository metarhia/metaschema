'use strict';

const util = require('util');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const common = require('@metarhia/common');

const { processSchema } = require('./schema-processor');
const { Metaschema } = require('./schema');

const readdir = util.promisify(fs.readdir);
const readFile = util.promisify(fs.readFile);
const stat = util.promisify(fs.stat);

const flatten = arr =>
  arr.reduce((acumulator, element) => {
    acumulator.push(...element);
    return acumulator;
  }, []);

const loadSchema = async (filePath, options, module) => {
  const source = (await readFile(filePath)).toString();

  const ext = path.extname(filePath);
  const name = path.basename(filePath, ext);
  const definition = processSchema(name, source, options, vm.runInNewContext);

  return [
    {
      type: options.extToType[common.fileExt(filePath)],
      module,
      name,
      definition,
      source,
    },
  ];
};

const loadModule = async (dir, options) => {
  const paths = await readdir(dir);
  paths.sort(options.order);

  const promises = paths.map(relPath => {
    const absPath = path.join(dir, relPath);
    return stat(absPath).then(stats => {
      if (stats.isDirectory()) {
        return loadModule(absPath, options);
      } else if (options.extToType[common.fileExt(absPath)]) {
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
//     context
//     decorators
//     extToType <Object>
//       [ext] <string>
//     order: <Function> function to pass to Array.prototype.sort,
//         to order files and modules before loading
//       a <string>
//       b <string>
//       Returns: <number>
//   config <Object>
//     processors <Object>
//       [type] <Object>
//         preprocess: <Function> optional
//           schema - <Schema>
//           Returns: <Error[]>
//         validate: <Function> optional
//           schema - <Schema>
//           Returns <Error[]>
//         add <Function>
//           schema - <Schema>
//           ms - <Metaschema>
//           Returns <Error[]>
//         postprocess <Function> optional
//           schema - <Schema>
//           ms - <Metaschema>
//           Returns: <Error[]>
//         serialize <Function> optional
//           schema <Schema>
//           ms <Metaschema>
//           Returns: <string>
//     order: <Function> function to pass to Array.prototype.sort,
//         to order schemas before processing
//       a <Schema>
//       b <Schema>
//       Returns: <number>
// Returns: [<Error[]>, <Metaschema>]
const load = async (dir, options, config) => {
  if (!Array.isArray(dir)) {
    dir = [dir];
  }
  const results = await Promise.all(dir.map(dir => loadModule(dir, options)));
  return Metaschema.create(flatten(results), config);
};

module.exports = {
  load,
};
